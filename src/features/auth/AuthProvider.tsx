import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { canPerform, AuthenticatedUser, PermissionAction, PermissionModule } from '../../domain/auth/permissions';
import { getCurrentSessionUser, onAuthStateChanged, signIn, signOut } from './authService';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (module: PermissionModule, action: PermissionAction) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSessionUser()
      .then(setUser)
      .finally(() => setLoading(false));

    return onAuthStateChanged(setUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const nextUser = await signIn(email, password);
        setUser(nextUser);
      },
      logout: async () => {
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
