import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';
import { isStaffRole } from '@/app/lib/scriptPermissions';
import fs from 'fs';
import path from 'path';

const FALLBACK_DIR = path.join(process.cwd(), 'scratch');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'comments_db.json');

function getFallbackData() {
  try {
    if (!fs.existsSync(FALLBACK_FILE)) return { comments: [], likes: [] };
    const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { comments: [], likes: [] };
  }
}

function saveFallbackData(data: { comments: any[]; likes: any[] }) {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing fallback comments:', err);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { id: scriptId, commentId } = await params;

    const auth = await requireActiveUser(req);
    if (!auth.ok) return auth.response;
    const user = auth.user;
    const isStaff = isStaffRole(user.role);

    // 1. Try Supabase
    const { data: existingComment, error: findErr } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .maybeSingle();

    if (!findErr && existingComment) {
      if (existingComment.user_id !== user.id && !isStaff) {
        return NextResponse.json({ error: 'No tienes permiso para eliminar este comentario' }, { status: 403 });
      }

      await supabase.from('comment_likes').delete().eq('comment_id', commentId);
      await supabase.from('comments').delete().eq('id', commentId);

      return NextResponse.json({ success: true });
    }

    // 2. Fallback
    const fallback = getFallbackData();
    const commentIndex = fallback.comments.findIndex((c: any) => c.id === commentId);
    if (commentIndex >= 0) {
      const comment = fallback.comments[commentIndex];
      if (comment.userId !== user.id && !isStaff) {
        return NextResponse.json({ error: 'No tienes permiso para eliminar este comentario' }, { status: 403 });
      }
      fallback.comments.splice(commentIndex, 1);
      fallback.likes = fallback.likes.filter((l: any) => l.commentId !== commentId);
      saveFallbackData(fallback);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
  } catch (err: any) {
    console.error('Error in DELETE /api/scripts/[id]/comments/[commentId]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
