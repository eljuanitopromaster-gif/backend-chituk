import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado. Se requiere token de sesión.' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Sesión no válida o expirada.' }, { status: 401 });
    }

    const userId = user.id;

    // 1. Eliminar likes de comentarios realizados por el usuario
    try {
      await supabase.from('comment_likes').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Advertencia al borrar comment_likes:', e);
    }

    // 2. Eliminar comentarios del usuario
    try {
      await supabase.from('comments').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Advertencia al borrar comments:', e);
    }

    // 3. Eliminar insignias otorgadas
    try {
      await supabase.from('user_badges').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Advertencia al borrar user_badges:', e);
    }

    // 4. Eliminar scripts / proyectos creados por el usuario
    try {
      await supabase.from('projects').delete().eq('authorId', userId);
    } catch (e) {
      console.warn('Advertencia al borrar projects:', e);
    }

    // 5. Eliminar notificaciones relacionadas
    try {
      await supabase.from('notifications').delete().or(`user_id.eq.${userId},actor_id.eq.${userId}`);
    } catch (e) {
      console.warn('Advertencia al borrar notifications:', e);
    }

    // 6. Eliminar el registro público en la tabla users
    try {
      const { error: userTableErr } = await supabase.from('users').delete().eq('id', userId);
      if (userTableErr) {
        console.warn('Advertencia al borrar de tabla users:', userTableErr.message);
      }
    } catch (e) {
      console.warn('Error en borrado tabla users:', e);
    }

    // 7. Eliminar la cuenta permanentemente de Supabase Auth
    const { error: deleteAuthErr } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthErr) {
      console.error('Error al borrar usuario de auth.users:', deleteAuthErr);
      return NextResponse.json({ 
        error: `Error al purgar usuario de Supabase Auth: ${deleteAuthErr.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta de usuario y datos eliminados permanentemente.'
    });
  } catch (err: any) {
    console.error('Error no controlado en /api/user/delete:', err);
    return NextResponse.json({ 
      error: err.message || 'Error interno al procesar la eliminación de cuenta.' 
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  return POST(req);
}

