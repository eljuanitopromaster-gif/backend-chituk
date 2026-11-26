export const STAFF_DELETE_ROLES = ['admin', 'moderator', 'mod', 'owner', 'creator'] as const;

export interface PermissionUser {
  id?: string | null;
  role?: string | null;
  username?: string | null;
  normalized?: string | null;
  authUser?: { id?: string | null } | null;
}

export interface ScriptAuthorRef {
  authorId?: string | null;
  author_id?: string | null;
  author?: string | null;
  authorName?: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isStaffRole(role?: string | null): boolean {
  if (!role) return false;
  return (STAFF_DELETE_ROLES as readonly string[]).includes(role.toLowerCase().trim());
}

/**
 * Validación dual para eliminación de scripts:
 * a) El usuario pertenece al staff (admin / moderator / mod / owner / creator)
 * b) El usuario es el autor original del script:
 *    - user.id === script.authorId (validación moderna por UUID de Supabase)
 *    - user.username === script.authorId o user.username === script.author (compatibilidad legacy;
 *      una referencia con formato UUID nunca se compara contra el username)
 * `user.role` y `user.username` deben provenir de public.users, nunca de user_metadata.
 */
export function canUserDeleteScript(
  user: PermissionUser | null | undefined,
  scriptOrAuthorId?: ScriptAuthorRef | string | null
): boolean {
  if (!user) return false;
  if (isStaffRole(user.role)) return true;
  if (!scriptOrAuthorId) return false;

  const candidates: string[] = [];
  if (typeof scriptOrAuthorId === 'string') {
    if (scriptOrAuthorId.trim()) candidates.push(scriptOrAuthorId.trim());
  } else {
    for (const val of [
      scriptOrAuthorId.authorId,
      scriptOrAuthorId.author_id,
      scriptOrAuthorId.author,
      scriptOrAuthorId.authorName,
    ]) {
      if (typeof val === 'string' && val.trim()) {
        candidates.push(val.trim());
      }
    }
  }

  if (candidates.length === 0) return false;

  const userId = (user.id || user.authUser?.id || '').trim();
  const username = (user.username || '').trim();
  const normalizedUsername = (user.normalized || username).trim().toLowerCase();

  return candidates.some((authorRef) => {
    if (userId && userId === authorRef) return true;
    if (isUuid(authorRef)) return false;
    if (username && username === authorRef) return true;
    if (normalizedUsername && normalizedUsername === authorRef.toLowerCase()) return true;
    return false;
  });
}
