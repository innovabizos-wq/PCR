import { createClient } from '@supabase/supabase-js';

const ALLOWED_COMPANY_IDS = new Set(['oz', 'pt', 'ds']);

const requireEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta variable ${name}`);
  }
  return value;
};

const parseCompanyIds = () => {
  const raw = process.env.ADMIN_COMPANY_IDS?.trim() || 'oz,pt,ds';
  const companyIds = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (companyIds.length === 0) {
    throw new Error('ADMIN_COMPANY_IDS debe incluir al menos una empresa.');
  }

  const invalidCompanyIds = companyIds.filter((companyId) => !ALLOWED_COMPANY_IDS.has(companyId));
  if (invalidCompanyIds.length > 0) {
    throw new Error(`ADMIN_COMPANY_IDS contiene valores inválidos: ${invalidCompanyIds.join(', ')}.`);
  }

  return [...new Set(companyIds)];
};

const supabaseUrl = requireEnv('SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const email = process.env.ADMIN_EMAIL?.trim() || 'admin@policarbonatocr.com';
const password = process.env.ADMIN_PASSWORD?.trim();
const companyIds = parseCompanyIds();

if (!password || password.length < 8) {
  throw new Error('ADMIN_PASSWORD es obligatoria y debe tener al menos 8 caracteres.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const findUserByEmail = async (targetEmail) => {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const foundUser = data.users.find((user) => user.email?.toLowerCase() === targetEmail.toLowerCase());
    if (foundUser) return foundUser;

    if (data.users.length < perPage) return null;
    page += 1;
  }
};

const upsertAccessTables = async (userId) => {
  const { error: profileError } = await supabase.from('user_profiles').upsert({
    id: userId,
    role: 'super_admin'
  });
  if (profileError) throw profileError;

  const { error: deleteAccessError } = await supabase.from('user_company_access').delete().eq('user_id', userId);
  if (deleteAccessError) throw deleteAccessError;

  const accessRows = companyIds.map((companyId) => ({ user_id: userId, company_id: companyId }));
  const { error: insertAccessError } = await supabase.from('user_company_access').insert(accessRows);
  if (insertAccessError) throw insertAccessError;
};

const upsertAdmin = async () => {
  const existing = await findUserByEmail(email);

  const appMetadata = {
    role: 'super_admin',
    company_ids: companyIds
  };

  if (!existing) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: { role: 'super_admin', company_ids: companyIds }
    });
    if (error) throw error;

    await upsertAccessTables(data.user.id);
    console.log(`✅ Usuario administrador creado: ${data.user.email}`);
    return;
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    app_metadata: appMetadata,
    user_metadata: { ...(existing.user_metadata || {}), role: 'super_admin', company_ids: companyIds },
    email_confirm: true
  });
  if (updateError) throw updateError;

  await upsertAccessTables(existing.id);
  console.log(`✅ Usuario administrador actualizado: ${existing.email}`);
};

upsertAdmin().catch((error) => {
  console.error('❌ Error bootstrap admin:', error.message || error);
  process.exitCode = 1;
});
