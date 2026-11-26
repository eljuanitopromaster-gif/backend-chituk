import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scriptId } = await params;
    
    const auth = await requireActiveUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.user.id;
    const actorUsername = auth.user.username || auth.user.email;

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
