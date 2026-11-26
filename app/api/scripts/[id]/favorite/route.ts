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

    // 1. Verificar si ya existe el favorito en user_favorites
    const { data: existingFav, error: favError } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', scriptId)
      .maybeSingle();

    if (favError) throw favError;

    const action = existingFav ? 'unfavorite' : 'favorite';

    if (action === 'unfavorite') {
      // Eliminar el favorito
      const { error: deleteError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', scriptId);

      if (deleteError) throw deleteError;
    } else {
      // Insertar el favorito
      const { error: insertError } = await supabase
        .from('user_favorites')
        .insert([{ user_id: userId, project_id: scriptId }]);

      if (insertError) throw insertError;
    }

    // 2. Obtener el total exacto de favoritos para este script
    const { count: favoritesCount, error: countError } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', scriptId);

    if (countError) throw countError;

    // 3. Notificación al autor solo si es nuevo favorito
    if (action === 'favorite') {
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
            type: 'favorite',
            read: false
          }]);
        } catch (e) {
          // Ignorar error de notificación
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      favorites: favoritesCount || 0, 
      action 
    });
  } catch (err: any) {
    console.error("Error in favorite route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

