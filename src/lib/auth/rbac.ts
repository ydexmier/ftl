import type { UserRole } from '@models/User';

const HIERARCHY: Record<UserRole, number> = { USER: 1, ADMIN: 2, SUPERUSER: 3 };

export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return (HIERARCHY[userRole] ?? 0) >= (HIERARCHY[required] ?? 0);
}

export const ROLES = {
  USER: 'USER' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
  SUPERUSER: 'SUPERUSER' as UserRole,
};
