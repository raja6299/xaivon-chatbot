export type Role = 'admin' | 'sales' | 'support' | 'manager' | 'client';

export type Permission =
  | 'view:dashboard'
  | 'view:analytics'
  | 'manage:crm'
  | 'view:pipeline'
  | 'manage:knowledge'
  | 'manage:documents'
  | 'manage:calendar'
  | 'view:security'
  | 'view:health'
  | 'view:logs'
  | 'manage:settings';

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'view:dashboard',
    'view:analytics',
    'manage:crm',
    'view:pipeline',
    'manage:knowledge',
    'manage:documents',
    'manage:calendar',
    'view:security',
    'view:health',
    'view:logs',
    'manage:settings',
  ],
  manager: [
    'view:dashboard',
    'view:analytics',
    'manage:crm',
    'view:pipeline',
    'manage:knowledge',
    'manage:documents',
    'manage:calendar',
  ],
  sales: [
    'view:dashboard',
    'manage:crm',
    'view:pipeline',
    'manage:calendar',
  ],
  support: [
    'view:dashboard',
    'manage:knowledge',
    'manage:documents',
    'view:logs',
  ],
  client: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}
