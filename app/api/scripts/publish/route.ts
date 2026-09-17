import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { title, description, script, features } = body;

    const tags = [];
    if (features?.isNoKey) tags.push('no-key');
    if (features?.isMobileFriendly) tags.push('mobile-friendly');
    if (features?.isOpenSource) tags.push('open-source');
    if (features?.isPaid) tags.push('paid');

    if (!title || !script) {
        return NextResponse.json({ error: 'Title and script are required' }, { status: 400 });
    }

    // Usar crypto.randomUUID para el ID si no viene
    const newId = crypto.randomUUID();

    const projectToSave = {
        id: newId,
        title: title,
        description: description || 'Sin juego especificado',
        script: script,
        scriptMode: tags.length > 0 ? tags.join(',') : 'script',
        kind: 'script',
        authorId: user.id, // OBLIGATORIO: user_id de la sesión
        status: 'pending', // OBLIGATORIO: entra a la cola
        createdAt: new Date().toISOString(),
        views: 0,
        unlocks: 0,
        copies: 0,
        likes: 0,
        language: 'lua'
    };

    const { data, error } = await supabase.from('projects').insert([projectToSave]).select();
    if (error) throw error;

    // Obtener username del autor
    const { data: publicUser } = await supabase.from('users').select('username').eq('id', user.id).single();
    const actorUsername = publicUser?.username || user.email;

    // Notificar a los administradores
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .in('role', ['owner', 'mod']);

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        actor_id: actorUsername,
        type: 'review_pending',
        read: false
      }));
      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
