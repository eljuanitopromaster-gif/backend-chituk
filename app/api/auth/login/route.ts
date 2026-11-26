import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findEmailByUsername } from '@/app/lib/server/accounts';

const INVALID_CREDENTIALS = 'Credenciales inválidas. Verifica tu correo/usuario y contraseña.';

// Inicio de sesión por nombre de usuario: el correo nunca sale del servidor.
export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Usuario y contraseña son obligatorios.' }, { status: 400 });
    }

    const email = await findEmailByUsername(username);
    if (!email) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    // Cliente desechable por petición para no compartir sesiones entre usuarios
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      if (error?.status === 429) {
        return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' }, { status: 429 });
      }
      if (error?.code === 'email_not_confirmed') {
        return NextResponse.json({ error: 'Debes confirmar tu correo antes de iniciar sesión.' }, { status: 403 });
      }
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    return NextResponse.json(
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('Error en POST /api/auth/login:', err);
    return NextResponse.json({ error: 'No se pudo iniciar sesión.' }, { status: 500 });
  }
}
