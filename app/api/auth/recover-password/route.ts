import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';
import { findEmailByUsername } from '@/app/lib/server/accounts';

// Respuesta única: no revela si la cuenta existe ni a qué correo pertenece
const GENERIC_RESPONSE = {
  success: true,
  message: 'Si existe una cuenta con esos datos, recibirás un correo con las instrucciones para restablecer tu contraseña. Si no llega, espera unos minutos e inténtalo de nuevo.'
};

export async function POST(req: Request) {
  try {
    const { email: inputEmail, origin } = await req.json();

    if (!inputEmail || typeof inputEmail !== 'string') {
      return NextResponse.json({ error: 'Por favor ingresa un correo electrónico o nombre de usuario válido.' }, { status: 400 });
    }

    let targetEmail: string | null = inputEmail.trim();

    // Si el usuario ingresó su nombre de usuario en lugar de email
    if (!targetEmail.includes('@')) {
      targetEmail = await findEmailByUsername(targetEmail);
      if (!targetEmail) {
        return NextResponse.json(GENERIC_RESPONSE);
      }
    }

    const appOrigin = origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${appOrigin}/reset-password`;

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: redirectUrl
    });

    // Los fallos (incluido el límite de envíos) solo se registran en el servidor
    if (resetErr) {
      console.error('Error al enviar correo de recuperación:', resetErr.message);
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err: any) {
    console.error("Error in recover-password route:", err);
    return NextResponse.json({ error: 'Ocurrió un error inesperado al procesar la recuperación.' }, { status: 500 });
  }
}
