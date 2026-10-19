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

export async function POST(req: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { id: scriptId, commentId } = await params;

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Inicia sesión para dar like' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 });

    // 1. Try Supabase
    const { data: existingLike, error: checkErr } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!checkErr) {
      const action: 'like' | 'unlike' = existingLike ? 'unlike' : 'like';

      if (action === 'unlike') {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert([{ comment_id: commentId, user_id: user.id }]);
      }

      // Get current comment likes
      const { data: commentData } = await supabase
        .from('comments')
        .select('likes_count')
        .eq('id', commentId)
        .single();

      const currentCount = commentData?.likes_count || 0;
      const newCount = action === 'like' ? currentCount + 1 : Math.max(0, currentCount - 1);

      await supabase
        .from('comments')
        .update({ likes_count: newCount })
        .eq('id', commentId);

      return NextResponse.json({ success: true, likesCount: newCount, action });
    } else {
      // 2. Fallback
      const fallback = getFallbackData();
      const existingIdx = fallback.likes.findIndex((l: any) => l.commentId === commentId && l.userId === user.id);
      const action = existingIdx >= 0 ? 'unlike' : 'like';

      const comment = fallback.comments.find((c: any) => c.id === commentId);
      let newCount = comment ? (comment.likesCount || 0) : 0;

      if (action === 'unlike') {
        fallback.likes.splice(existingIdx, 1);
        newCount = Math.max(0, newCount - 1);
      } else {
        fallback.likes.push({ commentId, userId: user.id, createdAt: new Date().toISOString() });
        newCount = newCount + 1;
      }

      if (comment) {
        comment.likesCount = newCount;
      }

      saveFallbackData(fallback);

      return NextResponse.json({ success: true, likesCount: newCount, action });
    }
  } catch (err: any) {
    console.error('Error in POST /api/scripts/[id]/comments/[commentId]/like:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
