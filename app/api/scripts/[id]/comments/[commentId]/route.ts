import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Inicia sesión para realizar esta acción' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
    const isStaff = userData && ['admin', 'owner', 'creator', 'mod'].includes(userData.role);

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
