import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { AuthenticatedUser, UserRole } from '../../domain/auth/permissions';

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

const mapSessionUser = (session: Session | null): AuthenticatedUser | null => {
  if (!session?.user.email) return null;
  const metadata = session.user.app_metadata ?? {};
  const userMetadata = session.user.user_metadata ?? {};

  const role = normalizeRole(metadata.role ?? userMetadata.role);
  const companyIds = normalizeCompanyIds(metadata.company_ids ?? userMetadata.company_ids);

  return {
    id: session.user.id,
    email: session.user.email,
    role,
    companyIds
  };
};

const assertSupabaseConfigured = () => {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
};

export const signIn = async (email: string, password: string): Promise<AuthenticatedUser> => {
  const client = assertSupabaseConfigured();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const mapped = mapSessionUser(data.session);
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
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(mapSessionUser(session)));
  return () => data.subscription.unsubscribe();
};
