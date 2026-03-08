export type UserRole = 'super_admin' | 'admin_empresa' | 'ventas' | 'inventario' | 'consulta';
export type PermissionAction = 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar' | 'aprobar' | 'administrar';
export type PermissionModule = 'auth' | 'company' | 'users' | 'customers' | 'quotes' | 'inventory' | 'documents' | 'audit' | 'reporting' | 'admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  companyIds: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Record<PermissionModule, PermissionAction[]>> = {
  super_admin: {
    auth: ['ver', 'administrar'],
    company: ['ver', 'crear', 'editar', 'eliminar', 'administrar'],
    users: ['ver', 'crear', 'editar', 'eliminar', 'administrar'],
    customers: ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'aprobar'],
    quotes: ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'aprobar'],
    inventory: ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'aprobar'],
    documents: ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'aprobar'],
    audit: ['ver', 'exportar'],
    reporting: ['ver', 'exportar'],
    admin: ['ver', 'administrar']
  },
  admin_empresa: {
    auth: ['ver'],
    company: ['ver', 'editar'],
    users: ['ver', 'crear', 'editar'],
    customers: ['ver', 'crear', 'editar', 'exportar'],
    quotes: ['ver', 'crear', 'editar', 'exportar', 'aprobar'],
    inventory: ['ver', 'crear', 'editar', 'exportar'],
    documents: ['ver', 'crear', 'editar', 'exportar', 'aprobar'],
    audit: ['ver'],
    reporting: ['ver', 'exportar'],
    admin: ['ver']
  },
  ventas: {
    auth: ['ver'],
    company: ['ver'],
    users: ['ver'],
    customers: ['ver', 'crear', 'editar'],
    quotes: ['ver', 'crear', 'editar', 'exportar'],
    inventory: ['ver'],
    documents: ['ver', 'crear', 'exportar'],
    audit: [],
    reporting: ['ver'],
    admin: []
  },
  inventario: {
    auth: ['ver'],
    company: ['ver'],
    users: [],
    customers: ['ver'],
    quotes: ['ver'],
    inventory: ['ver', 'crear', 'editar', 'eliminar', 'exportar'],
    documents: ['ver'],
    audit: ['ver'],
    reporting: ['ver'],
    admin: []
  },
  consulta: {
    auth: ['ver'],
    company: ['ver'],
    users: [],
    customers: ['ver'],
    quotes: ['ver'],
    inventory: ['ver'],
    documents: ['ver'],
    audit: [],
    reporting: ['ver'],
    admin: []
  }
};

export const canPerform = (role: UserRole, module: PermissionModule, action: PermissionAction): boolean => {
  return ROLE_PERMISSIONS[role]?.[module]?.includes(action) ?? false;
};
