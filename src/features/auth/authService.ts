import { AuthChangeEvent, Session } from '@supabase/supabase-js';
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

  if (profileError || accessError || !profileData) {
    console.warn('No se pudo resolver perfil/acceso desde tablas auxiliares.', {
      profileError,
      accessError,
      profileData
    });
    return null;
  }

  return {
    role: normalizeRole(profileData.role),
    companyIds: (accessData as UserCompanyAccessRow[] | null)?.map((item) => item.company_id) ?? []
  };
};

const isCompanyAccessInvalid = (role: UserRole, companyIds: string[]): boolean => role !== 'super_admin' && companyIds.length === 0;

const mapSessionUser = async (session: Session | null): Promise<AuthenticatedUser | null> => {
  if (!session?.user?.id || !session.user.email) return null;

  const dbAuth = await resolveAuthFromDatabase(session.user.id);
  if (!dbAuth) return null;

  const metadataAuth = readMetadataAuth(session);
  const role = dbAuth.role ?? metadataAuth.role;
  const companyIds = dbAuth.companyIds.length ? dbAuth.companyIds : metadataAuth.companyIds;

  if (isCompanyAccessInvalid(role, companyIds)) {
    console.warn('Sesión inválida por falta de acceso por empresa.', { userId: session.user.id, role });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role,
    companyIds
  };
};

const clearSupabaseSession = async (): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('No se pudo limpiar la sesión inválida de Supabase.', error);
  }
};

const resolveUserFromSession = async (session: Session | null): Promise<AuthenticatedUser | null> => {
  const mapped = await mapSessionUser(session);
  if (session && !mapped) {
    await clearSupabaseSession();
  }
  return mapped;
};

export const signIn = async (email: string, password: string): Promise<AuthenticatedUser> => {
  const client = getSupabaseOrThrow();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const mapped = await resolveUserFromSession(data.session);
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
  return resolveUserFromSession(data.session);
};

export const onAuthStateChanged = (
  cb: (user: AuthenticatedUser | null) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  if (!supabase) return () => {};

  const handler = async (event: AuthChangeEvent, session: Session | null) => {
    if (event === 'SIGNED_OUT' || !session) {
      cb(null);
      return;
    }

    try {
      cb(await resolveUserFromSession(session));
    } catch (error) {
      onError?.(error);
      cb(null);
    }
  };

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    void handler(event, session);
  });

  return () => data.subscription.unsubscribe();
};
