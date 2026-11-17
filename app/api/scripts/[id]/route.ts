import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canUserDeleteScript } from '@/app/lib/scriptPermissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Obtener el script actual
    const { data: script, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !script) {
      return NextResponse.json({ error: 'Script no encontrado' }, { status: 404 });
    }

    // 2. Incrementar views
    const currentViews = script.views || 0;
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ views: currentViews + 1 })
      .eq('id', id);

    if (updateError) {
      console.error("Error incrementing views:", updateError);
    }

    // 3. Obtener nombre de autor para mayor amigabilidad
    let authorName = script.authorId;
    const { data: userData } = await supabaseAdmin.from('users').select('username').eq('id', script.authorId).single();
    if (userData) {
      authorName = userData.username;
    }

    // 4. Obtener total de favoritos
    const { count: favoritesCount } = await supabaseAdmin
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuración incompleta: falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado. Inicia sesión para continuar.' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Sesión inválida o expirada.' }, { status: 401 });
    }

    const { id } = await params;

    // 1. Obtener el script antes de eliminar para validar su autoría
    const { data: script, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!script) {
      return NextResponse.json({ error: 'Script no encontrado' }, { status: 404 });
    }

    // 2. Obtener rol y estado del usuario autenticado desde public.users
    const { data: publicUser } = await supabaseAdmin
      .from('users')
      .select('role, username, normalized, banned')
      .eq('id', authUser.id)
      .maybeSingle();

    if (publicUser?.banned) {
      return NextResponse.json({ error: 'Unauthorized: Cuenta suspendida.' }, { status: 403 });
    }

    // 3. Validación Dual: Autor original O Staff (admin / moderator / etc.)
    const hasPermission = canUserDeleteScript(
      {
        id: authUser.id,
        role: publicUser?.role || authUser.app_metadata?.role || authUser.user_metadata?.role,
        username: publicUser?.username || authUser.user_metadata?.username,
        normalized: publicUser?.normalized,
      },
      script
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized: No tienes permiso para eliminar este script.' },
        { status: 403 }
      );
    }

    // 4. Limpieza segura de registros relacionados antes de borrar el script
    try {
      await supabaseAdmin.from('user_likes').delete().eq('project_id', id);
    } catch {}
    try {
      await supabaseAdmin.from('user_favorites').delete().eq('project_id', id);
    } catch {}
    try {
      const { data: scriptComments } = await supabaseAdmin
        .from('comments')
        .select('id')
        .eq('project_id', id);
      const commentIds = (scriptComments || []).map((c: any) => c.id);
      if (commentIds.length > 0) {
        await supabaseAdmin.from('comment_likes').delete().in('comment_id', commentIds);
      }
      await supabaseAdmin.from('comments').delete().eq('project_id', id);
    } catch {}

    // 5. Ejecutar DELETE en projects usando supabaseAdmin (Service Role Key)
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error in DELETE /api/scripts/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error interno al eliminar el script' }, { status: 500 });
  }
}
