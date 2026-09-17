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

    // Obtener el script actual
    const { data: script, error: scriptError } = await supabase
      .from('projects')
      .select('likes, authorId')
      .eq('id', scriptId)
      .single();

    if (scriptError || !script) return NextResponse.json({ error: 'Script no encontrado' }, { status: 404 });

    let currentLikes = 0;
    if (typeof script.likes === 'number') {
      currentLikes = script.likes;
    } else if (Array.isArray(script.likes)) {
      currentLikes = script.likes.length;
    } else if (typeof script.likes === 'string') {
      currentLikes = parseInt(script.likes) || 0;
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'like';

    let newLikes = currentLikes;
    if (action === 'like') {
      newLikes += 1;
    } else if (action === 'unlike') {
      newLikes = Math.max(0, newLikes - 1);
    }

    // Actualizar likes
    const { error: updateError } = await supabase
      .from('projects')
      .update({ likes: newLikes })
      .eq('id', scriptId);

    if (updateError) throw updateError;

    // Insertar Notificación solo si es like
    if (action === 'like' && script.authorId !== user.id && script.authorId !== actorUsername) {
      await supabase.from('notifications').insert([{
        user_id: script.authorId,
        actor_id: actorUsername,
        type: 'like',
        read: false
      }]);
    }

    return NextResponse.json({ success: true, likes: newLikes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
