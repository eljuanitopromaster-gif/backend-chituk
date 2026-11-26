import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';
import { isUuid } from '@/app/lib/scriptPermissions';

export async function POST(req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { commentId } = await params;

    const auth = await requireActiveUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.user.id;

    if (!isUuid(commentId)) {
      return NextResponse.json({ error: 'El ID del comentario no es válido.' }, { status: 400 });
    }

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .maybeSingle();
    if (commentError) throw commentError;
    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();
    if (checkError) throw checkError;

    const action: 'like' | 'unlike' = existingLike ? 'unlike' : 'like';

    const { error: toggleError } = existingLike
      ? await supabase.from('comment_likes').delete().eq('id', existingLike.id)
      : await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: userId }]);
    if (toggleError) throw toggleError;

    // El contador se recalcula desde comment_likes, la fuente de verdad
    const { count, error: countError } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);
    if (countError) throw countError;

    const likesCount = count || 0;
    const { error: updateError } = await supabase
      .from('comments')
      .update({ likes_count: likesCount })
      .eq('id', commentId);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, likesCount, action });
  } catch (err: any) {
    console.error('Error in POST /api/scripts/[id]/comments/[commentId]/like:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
