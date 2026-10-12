import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { email: inputEmail, origin } = await req.json();

    if (!inputEmail || typeof inputEmail !== 'string') {
      return NextResponse.json({ error: 'Por favor ingresa un correo electrónico o nombre de usuario válido.' }, { status: 400 });
    }

    let targetEmail = inputEmail.trim();

    // Si el usuario ingresó su nombre de usuario en lugar de email
    if (!targetEmail.includes('@')) {
      const { data: userRec } = await supabase
        .from('users')
        .select('id')
        .ilike('username', targetEmail)
        .maybeSingle();

      if (!userRec) {
        return NextResponse.json({ error: 'No existe ninguna cuenta registrada con ese nombre de usuario.' }, { status: 404 });
      }

      const { data: authUser } = await supabase.auth.admin.getUserById(userRec.id);
      if (!authUser?.user?.email) {
        return NextResponse.json({ error: 'No se encontró el correo asociado a esa cuenta.' }, { status: 404 });
      }
      targetEmail = authUser.user.email;
    }

    const appOrigin = origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${appOrigin}/reset-password`;

    // 1. Intentar el envío estándar de correo de recuperación
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: redirectUrl
    });

    // 2. Si no hubo error, el correo fue enviado
    if (!resetErr) {
      return NextResponse.json({
        success: true,
        method: 'email',
        email: targetEmail,
        message: 'Hemos enviado las instrucciones para restablecer tu contraseña a tu correo electrónico.'
      });
    }

    const isRateLimited = 
      resetErr.message?.toLowerCase().includes('rate limit') || 
      (resetErr as any).status === 429;

    // 3. Si se excedió el límite horario de correos de Supabase (Free tier limit),
    // generamos un enlace directo para que el usuario NO quede bloqueado
    if (isRateLimited) {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: targetEmail,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (!linkError && linkData?.properties?.action_link) {
        return NextResponse.json({
          success: true,
          method: 'direct_link',
          email: targetEmail,
          actionLink: linkData.properties.action_link,
          message: 'El límite temporal de envíos de correo de Supabase está activo, pero hemos generado tu enlace de recuperación seguro.'
        });
      }
    }

    // Traducir mensajes comunes de error a español
    let userFriendlyError = resetErr.message || 'Error al procesar la solicitud de recuperación.';
    if (userFriendlyError.toLowerCase().includes('user not found')) {
      userFriendlyError = 'No existe ninguna cuenta registrada con este correo electrónico.';
    } else if (isRateLimited) {
      userFriendlyError = 'Has alcanzado el límite temporal de intentos de envío. Espera unos momentos o contacta a un administrador.';
    }

    return NextResponse.json({ error: userFriendlyError }, { status: 400 });
  } catch (err: any) {
    console.error("Error in recover-password route:", err);
    return NextResponse.json({ error: err.message || 'Ocurrió un error inesperado al procesar la recuperación.' }, { status: 500 });
  }
}
