import { createClient } from '@supabase/supabase-js';

const requireEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta variable ${name}`);
  }
  return value;
};

const supabaseUrl = requireEnv('SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const email = process.env.ADMIN_EMAIL?.trim() || 'admin@policarbonatocr.com';
const password = process.env.ADMIN_PASSWORD?.trim();
const companyIds = (process.env.ADMIN_COMPANY_IDS || 'oz,pt,ds')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

if (!password || password.length < 8) {
  throw new Error('ADMIN_PASSWORD es obligatoria y debe tener al menos 8 caracteres.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const upsertAdmin = async () => {
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = usersData.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

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
  console.log(`✅ Usuario administrador actualizado: ${existing.email}`);
};

upsertAdmin().catch((error) => {
  console.error('❌ Error bootstrap admin:', error.message || error);
  process.exitCode = 1;
});
