// Gestión de usuarios y roles: más restrictiva que el resto de funciones de staff.
export const USER_ADMIN_ROLES = ['owner', 'admin'] as const;

export const ASSIGNABLE_ROLES = ['user', 'creator', 'mod', 'moderator', 'admin', 'owner'] as const;

// Rangos estrictamente inferiores a `admin`
export const ADMIN_MANAGEABLE_ROLES = ['user', 'creator', 'mod', 'moderator'] as const;

function normalizeRole(role?: string | null): string {
  return (role || 'user').toLowerCase().trim();
}

/** Solo `owner` y `admin` acceden a `/admin/users` y `/api/admin/users`. */
export function canManageUsers(role?: string | null): boolean {
  return (USER_ADMIN_ROLES as readonly string[]).includes(normalizeRole(role));
}

function isBelowAdmin(role: string): boolean {
  return (ADMIN_MANAGEABLE_ROLES as readonly string[]).includes(role);
}

/**
 * Jerarquía estricta para modificar rol, correo, verificación o ban:
 * un `owner` puede con cualquiera; un `admin` solo con rangos inferiores.
 */
export function canModifyUser(actorRole?: string | null, targetRole?: string | null): boolean {
  if (!canManageUsers(actorRole)) return false;
  return normalizeRole(actorRole) === 'owner' || isBelowAdmin(normalizeRole(targetRole));
}

/** Solo valores de la lista blanca; únicamente un `owner` puede asignar `admin` u `owner`. */
export function canAssignRole(actorRole: string | null | undefined, newRole: string): boolean {
  if (!canManageUsers(actorRole)) return false;
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(newRole)) return false;
  return normalizeRole(actorRole) === 'owner' || isBelowAdmin(newRole);
}
