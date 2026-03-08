import { COMPANIES } from '../../domain/company/company';
import { AuthenticatedUser, UserRole } from '../../domain/auth/permissions';

const LOCAL_USERS_KEY = 'pcr.local_users';
const LOCAL_SESSION_KEY = 'pcr.local_session';

export interface LocalAuthUser extends AuthenticatedUser {
  password: string;
}

const DEFAULT_ADMIN_CREDENTIALS: LocalAuthUser = {
  id: 'local-super-admin',
  email: 'prueba@correo.com',
  password: 'Prueba1234',
  role: 'super_admin',
  companyIds: COMPANIES.map((company) => company.id)
};

const safeParse = (value: string | null): LocalAuthUser[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is LocalAuthUser =>
        typeof item?.id === 'string' &&
        typeof item?.email === 'string' &&
        typeof item?.password === 'string' &&
        typeof item?.role === 'string' &&
        Array.isArray(item?.companyIds)
    );
  } catch {
    return [];
  }
};

const persistUsers = (users: LocalAuthUser[]) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const ensureBootstrapUser = (): LocalAuthUser[] => {
  const users = safeParse(localStorage.getItem(LOCAL_USERS_KEY));
  const alreadyExists = users.some((user) => user.email.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase());

  if (!alreadyExists) {
    const next = [DEFAULT_ADMIN_CREDENTIALS, ...users];
    persistUsers(next);
    return next;
  }

  return users;
};

export const listLocalUsers = (): LocalAuthUser[] => {
  return ensureBootstrapUser();
};

export const createLocalUser = (payload: {
  email: string;
  password: string;
  role: UserRole;
  companyIds: string[];
}): LocalAuthUser => {
  const users = ensureBootstrapUser();
  const normalizedEmail = payload.email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Ese correo ya existe.');
  }

  const user: LocalAuthUser = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: normalizedEmail,
    password: payload.password,
    role: payload.role,
    companyIds: payload.companyIds
  };

  persistUsers([user, ...users]);
  return user;
};

export const findLocalUserByCredentials = (email: string, password: string): LocalAuthUser | null => {
  const normalizedEmail = email.trim().toLowerCase();
  const users = ensureBootstrapUser();
  return users.find((user) => user.email.toLowerCase() === normalizedEmail && user.password === password) ?? null;
};

export const storeLocalSession = (user: LocalAuthUser): void => {
  localStorage.setItem(
    LOCAL_SESSION_KEY,
    JSON.stringify({ id: user.id, email: user.email, role: user.role, companyIds: user.companyIds })
  );
};

export const getStoredLocalSession = (): AuthenticatedUser | null => {
  const raw = localStorage.getItem(LOCAL_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id !== 'string' || typeof parsed?.email !== 'string' || typeof parsed?.role !== 'string' || !Array.isArray(parsed?.companyIds)) {
      return null;
    }
    return parsed as AuthenticatedUser;
  } catch {
    return null;
  }
};

export const clearLocalSession = (): void => {
  localStorage.removeItem(LOCAL_SESSION_KEY);
};
