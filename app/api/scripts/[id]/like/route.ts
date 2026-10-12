import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scriptId } = await params;
    
    // Auth check: support Bearer token and X-User-Id fallback
    let userId: string | null = null;
    let actorUsername: string | null = null;

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
        actorUsername = user.email || null;
      }
    }

    if (!userId) {
      const xUserId = req.headers.get('x-user-id');
      if (xUserId) {
        userId = xUserId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: publicUser } = await supabase.from('users').select('username').eq('id', userId).single();
    if (publicUser?.username) {
      actorUsername = publicUser.username;
    }

    // 1. Verificar si el usuario ya dio like a este script
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('user_likes')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', scriptId)
      .maybeSingle();

    if (likeCheckError) throw likeCheckError;

    const action = existingLike ? 'unlike' : 'like';

    if (action === 'unlike') {
      // Eliminar el like
      const { error: deleteError } = await supabase
        .from('user_likes')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', scriptId);

      if (deleteError) throw deleteError;
    } else {
      // Insertar nuevo like
      const { error: insertError } = await supabase
        .from('user_likes')
        .insert([{ user_id: userId, project_id: scriptId }]);

      if (insertError) throw insertError;
    }

    // 2. Obtener el total exacto de likes desde user_likes
    const { count: actualLikes, error: countError } = await supabase
      .from('user_likes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', scriptId);

    if (countError) throw countError;

    const newLikes = actualLikes || 0;

    // Actualizar columna likes en projects para compatibilidad
    await supabase
      .from('projects')
      .update({ likes: newLikes })
      .eq('id', scriptId);

    // 3. Notificación al autor solo si es nuevo like
    if (action === 'like') {
      const { data: script } = await supabase
        .from('projects')
        .select('authorId')
        .eq('id', scriptId)
        .maybeSingle();

      if (script && script.authorId && script.authorId !== userId && script.authorId !== actorUsername) {
        try {
          await supabase.from('notifications').insert([{
            user_id: script.authorId,
            actor_id: actorUsername || userId,
            type: 'like',
            read: false
          }]);
        } catch (e) {
          // Ignorar error de notificación
        }
      }
    }

    return NextResponse.json({ success: true, likes: newLikes, action });
  } catch (err: any) {
    console.error("Error in like route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
