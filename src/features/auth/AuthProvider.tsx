import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { canPerform, AuthenticatedUser, PermissionAction, PermissionModule } from '../../domain/auth/permissions';
import { getCurrentSessionUser, onAuthStateChanged, signIn, signOut } from './authService';

const TEMPORARY_AUTH_BYPASS_ENABLED = true;
const TEMPORARY_BYPASS_USER: AuthenticatedUser = {
  id: 'temporary-local-user',
  email: 'temporal@local.dev',
  role: 'super_admin',
  companyIds: ['company-pcr', 'company-zentro']
};

interface AuthContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (module: PermissionModule, action: PermissionAction) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_RESOLUTION_TIMEOUT_MS = 8000;

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthenticatedUser | null>(TEMPORARY_AUTH_BYPASS_ENABLED ? TEMPORARY_BYPASS_USER : null);
  const [loading, setLoading] = useState(!TEMPORARY_AUTH_BYPASS_ENABLED);

  useEffect(() => {
    if (TEMPORARY_AUTH_BYPASS_ENABLED) {
      setLoading(false);
      setUser(TEMPORARY_BYPASS_USER);
      return;
    }

    let active = true;

    const resolveInitialSession = async () => {
      const timeout = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn('Tiempo de carga de sesión agotado, mostrando login.');
          resolve(null);
        }, SESSION_RESOLUTION_TIMEOUT_MS);
      });

      try {
        const sessionUser = await Promise.race([getCurrentSessionUser(), timeout]);
        if (!active) return;
        setUser(sessionUser);
      } catch (error) {
        console.error('No se pudo resolver la sesión inicial.', error);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void resolveInitialSession();

    const unsubscribe = onAuthStateChanged(
      (nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setLoading(false);
      },
      (error) => {
        console.error('Error al escuchar cambios de autenticación.', error);
        if (!active) return;
        setUser(null);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        if (TEMPORARY_AUTH_BYPASS_ENABLED) {
          setUser(TEMPORARY_BYPASS_USER);
          return;
        }

        const nextUser = await signIn(email, password);
        setUser(nextUser);
      },
      logout: async () => {
        if (TEMPORARY_AUTH_BYPASS_ENABLED) {
          setUser(TEMPORARY_BYPASS_USER);
          return;
        }

        await signOut();
        setUser(null);
      },
      can: (module, action) => (user ? canPerform(user.role, module, action) : false)
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
