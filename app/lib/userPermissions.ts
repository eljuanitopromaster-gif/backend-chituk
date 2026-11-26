// Gestión de usuarios y roles: más restrictiva que el resto de funciones de staff.
export const USER_ADMIN_ROLES = ['owner', 'admin'] as const;

export const ASSIGNABLE_ROLES = ['user', 'creator', 'mod', 'moderator', 'admin', 'owner'] as const;

function normalizeRole(role?: string | null): string {
  return (role || 'user').toLowerCase().trim();
}

/** Solo `owner` y `admin` acceden a `/admin/users` y `/api/admin/users`. */
export function canManageUsers(role?: string | null): boolean {
  return (USER_ADMIN_ROLES as readonly string[]).includes(normalizeRole(role));
}

/** Un `owner` solo puede ser modificado (rol, correo, verificación o ban) por otro `owner`. */
export function canModifyUser(actorRole?: string | null, targetRole?: string | null): boolean {
  if (!canManageUsers(actorRole)) return false;
  return normalizeRole(targetRole) !== 'owner' || normalizeRole(actorRole) === 'owner';
}

/** Solo valores de la lista blanca; únicamente un `owner` puede asignar `owner`. */
export function canAssignRole(actorRole: string | null | undefined, newRole: string): boolean {
  if (!canManageUsers(actorRole)) return false;
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(newRole)) return false;
  return newRole !== 'owner' || normalizeRole(actorRole) === 'owner';
}
