import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from './supabaseAdmin';
import { isStaffRole } from '../scriptPermissions';

export interface ServerUser {
  id: string;
  email: string | null;
  username: string;
  normalized: string | null;
  role: string;
}

export type AuthResult =
  | { ok: true; user: ServerUser }
  | { ok: false; response: NextResponse };

function deny(error: string, status: number): AuthResult {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

/**
 * Exige `Authorization: Bearer <token>` válido y un perfil no suspendido.
 * La identidad sale del token; `role`, `username` y `banned` salen
 * exclusivamente de `public.users` (nunca de cabeceras ni de `user_metadata`).
 */
export async function requireActiveUser(request: Request): Promise<AuthResult> {
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return deny('No autorizado. Inicia sesión para continuar.', 401);
  }

  const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(match[1]);
  if (authError || !authUser) {
    return deny('Sesión inválida o expirada.', 401);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('username, normalized, role, banned')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError) {
    console.error('Error al leer public.users:', profileError.message);
    return deny('No se pudo verificar tu cuenta.', 500);
  }
  if (!profile) {
    return deny('No se encontró tu perfil de usuario.', 403);
  }
  if (profile.banned) {
    return deny('Cuenta suspendida.', 403);
  }

  return {
    ok: true,
    user: {
      id: authUser.id,
      email: authUser.email ?? null,
      username: profile.username || '',
      normalized: profile.normalized ?? null,
      role: String(profile.role || 'user').toLowerCase().trim(),
    },
  };
}

/** Como `requireActiveUser`, pero además exige un rol de staff. */
export async function requireStaff(request: Request): Promise<AuthResult> {
  const auth = await requireActiveUser(request);
  if (auth.ok && !isStaffRole(auth.user.role)) {
    return deny('Acceso denegado. Se requieren permisos de staff.', 403);
  }
  return auth;
}
