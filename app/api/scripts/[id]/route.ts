import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Obtener el script actual
    const { data: script, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !script) {
      return NextResponse.json({ error: 'Script no encontrado' }, { status: 404 });
    }

    // 2. Incrementar views
    const currentViews = script.views || 0;
    const { error: updateError } = await supabase
      .from('projects')
      .update({ views: currentViews + 1 })
      .eq('id', id);

    if (updateError) {
      console.error("Error incrementing views:", updateError);
    }

    // 3. Obtener nombre de autor para mayor amigabilidad
    let authorName = script.authorId;
    const { data: userData } = await supabase.from('users').select('username').eq('id', script.authorId).single();
    if (userData) {
      authorName = userData.username;
    }

    // 4. Obtener total de favoritos
    const { count: favoritesCount } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);

    const scriptData = {
      ...script,
      authorName,
      views: currentViews + 1,
      likesCount: script.likes || 0,
      favorites: favoritesCount || 0
    };

    return NextResponse.json(scriptData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
