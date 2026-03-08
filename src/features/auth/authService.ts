import { Session } from '@supabase/supabase-js';
import { getSupabaseOrThrow, supabase } from '../../lib/supabase';
import { AuthenticatedUser, UserRole } from '../../domain/auth/permissions';

interface UserProfileRow {
  role: UserRole;
}

interface UserCompanyAccessRow {
  company_id: string;
}

const normalizeRole = (value: unknown): UserRole => {
  if (value === 'super_admin' || value === 'admin_empresa' || value === 'ventas' || value === 'inventario' || value === 'consulta') {
    return value;
  }
  return 'consulta';
};

const normalizeCompanyIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
};

const readMetadataAuth = (session: Session): Pick<AuthenticatedUser, 'role' | 'companyIds'> => {
  const metadata = session.user.app_metadata ?? {};
  const userMetadata = session.user.user_metadata ?? {};

  return {
    role: normalizeRole(metadata.role ?? userMetadata.role),
    companyIds: normalizeCompanyIds(metadata.company_ids ?? userMetadata.company_ids)
  };
};

const resolveAuthFromDatabase = async (userId: string): Promise<Pick<AuthenticatedUser, 'role' | 'companyIds'> | null> => {
  if (!supabase) return null;

  const [{ data: profileData, error: profileError }, { data: accessData, error: accessError }] = await Promise.all([
    supabase.from('user_profiles').select('role').eq('id', userId).maybeSingle<UserProfileRow>(),
    supabase.from('user_company_access').select('company_id').eq('user_id', userId)
  ]);

  if (profileError || accessError) {
    console.warn('No se pudo resolver perfil/acceso desde tablas auxiliares, usando metadata JWT.', {
      profileError,
      accessError
    });
    return null;
  }

  if (!profileData) return null;

  return {
    role: normalizeRole(profileData.role),
    companyIds: (accessData as UserCompanyAccessRow[] | null)?.map((item) => item.company_id) ?? []
  };
};

const mapSessionUser = async (session: Session | null): Promise<AuthenticatedUser | null> => {
  if (!session?.user.email) return null;

  const dbAuth = await resolveAuthFromDatabase(session.user.id);
  const metadataAuth = readMetadataAuth(session);

  return {
    id: session.user.id,
    email: session.user.email,
    role: dbAuth?.role ?? metadataAuth.role,
    companyIds: dbAuth?.companyIds.length ? dbAuth.companyIds : metadataAuth.companyIds
  };
};

export const signIn = async (email: string, password: string): Promise<AuthenticatedUser> => {
  const client = getSupabaseOrThrow();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const mapped = await mapSessionUser(data.session);
  if (!mapped) throw new Error('No fue posible resolver la sesión del usuario.');
  return mapped;
};

export const signOut = async (): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentSessionUser = async (): Promise<AuthenticatedUser | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return mapSessionUser(data.session);
};

export const onAuthStateChanged = (cb: (user: AuthenticatedUser | null) => void): (() => void) => {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => cb(await mapSessionUser(session)));
  return () => data.subscription.unsubscribe();
};
