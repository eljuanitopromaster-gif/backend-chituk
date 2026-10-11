import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scriptId } = await params;
    
    // Auth check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { data: publicUser } = await supabase.from('users').select('username').eq('id', user.id).single();
    const actorUsername = publicUser?.username || user.email;

    // Verificar si ya existe el favorito
    const { data: existingFav, error: favError } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', scriptId)
      .maybeSingle();

    let action = 'favorite';
    if (existingFav) {
      action = 'unfavorite';
    }

    if (action === 'unfavorite') {
      // Eliminar el favorito
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', scriptId);
    } else {
      // Insertar el favorito
      await supabase
        .from('user_favorites')
        .insert([{ user_id: user.id, project_id: scriptId }]);
    }

    // Obtener el script actual para actualizar contador
    const { data: script, error: scriptError } = await supabase
      .from('projects')
      .select('favorites, authorId')
      .eq('id', scriptId)
      .single();

    if (scriptError || !script) return NextResponse.json({ error: 'Script no encontrado' }, { status: 404 });

    let currentFavorites = 0;
    if (typeof script.favorites === 'number') {
      currentFavorites = script.favorites;
    } else if (typeof script.favorites === 'string') {
      currentFavorites = parseInt(script.favorites) || 0;
    }

    let newFavorites = currentFavorites;
    if (action === 'favorite') {
      newFavorites += 1;
    } else {
      newFavorites = Math.max(0, newFavorites - 1);
    }

    // Actualizar favorites
    const { error: updateError } = await supabase
      .from('projects')
      .update({ favorites: newFavorites })
      .eq('id', scriptId);

    if (updateError) throw updateError;

    // Insertar Notificación si lo deseas (opcional para favoritos)
    if (action === 'favorite' && script.authorId !== user.id && script.authorId !== actorUsername) {
      await supabase.from('notifications').insert([{
        user_id: script.authorId,
        actor_id: actorUsername,
        type: 'favorite',
        read: false
      }]);
    }

    return NextResponse.json({ success: true, favorites: newFavorites, action });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
