import { env } from '../../config/env';

export interface SystemUser {
  username: string;
  password: string;
  role: string;
  permissions: string;
}

const SESSION_KEY = 'pcr_auth_session_v1';

const createDevFallbackPassword = (): string => {
  return 'Admin';
};

const defaultUser: SystemUser = {
  username: env.defaultUsername ?? 'Admin',
  password: env.defaultPassword ?? createDevFallbackPassword(),
  role: 'Administrador',
  permissions: 'Usuarios, Roles y Permisos'
};

export const getBootstrapUsers = (): SystemUser[] => [defaultUser];

export const authenticateUser = (users: SystemUser[], username: string, password: string): SystemUser | null => {
  const normalizedUsername = username.trim().toLowerCase();
  return users.find((user) => user.username.toLowerCase() === normalizedUsername && user.password === password) ?? null;
};

export const persistAuthSession = (user: SystemUser): void => {
  const payload = { username: user.username, role: user.role, at: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
};

export const hasPersistedSession = (): boolean => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { username?: string };
    return Boolean(parsed.username);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }
};

export const clearPersistedSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};
