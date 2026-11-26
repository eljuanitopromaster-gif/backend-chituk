import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';
import { isStaffRole, isUuid } from '@/app/lib/scriptPermissions';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { commentId } = await params;

    const auth = await requireActiveUser(req);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    if (!isUuid(commentId)) {
      return NextResponse.json({ error: 'El ID del comentario no es válido.' }, { status: 400 });
    }

    const { data: comment, error: findError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .maybeSingle();
    if (findError) throw findError;
    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    if (comment.user_id !== user.id && !isStaffRole(user.role)) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este comentario' }, { status: 403 });
    }

    const { error: likesError } = await supabase.from('comment_likes').delete().eq('comment_id', commentId);
    if (likesError) throw likesError;

    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/scripts/[id]/comments/[commentId]:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
