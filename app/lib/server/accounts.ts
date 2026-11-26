import 'server-only';
import { supabaseAdmin } from './supabaseAdmin';

/**
 * Resuelve el correo de una cuenta a partir de su nombre de usuario.
 * El resultado es solo para uso interno del servidor: nunca debe devolverse al cliente.
 */
export async function findEmailByUsername(username: string): Promise<string | null> {
  const clean = username.trim();
  // PostgREST trata `*` como comodín en ilike
  if (!clean || clean.includes('*')) return null;

  // Coincidencia exacta sin distinguir mayúsculas: se escapan los comodines de LIKE
  const pattern = clean.replace(/[\\%_]/g, '\\$&');

  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .ilike('username', pattern)
    .maybeSingle();

  if (error || !profile) return null;

  const { data } = await supabaseAdmin.auth.admin.getUserById(profile.id);
  return data?.user?.email ?? null;
}
