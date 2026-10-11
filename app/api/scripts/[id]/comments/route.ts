import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCaptcha } from '@/app/lib/captcha';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fallback file storage for comments when database table is not yet migrated
const FALLBACK_DIR = path.join(process.cwd(), 'scratch');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'comments_db.json');

function getFallbackData() {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (!fs.existsSync(FALLBACK_FILE)) {
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify({ comments: [], likes: [] }, null, 2));
      return { comments: [], likes: [] };
    }
    const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading fallback comments:', err);
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scriptId } = await params;
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sort') || 'likes'; // 'likes' or 'newest'

    // Optional user check from Authorization header to check isLiked
    let currentUserId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) currentUserId = user.id;
      } catch (e) { }
    }

    // Try fetching from Supabase first
    const { data: supaComments, error: supaErr } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', scriptId);

    let commentsList: any[] = [];

    if (!supaErr && supaComments) {
      // Supabase table exists!
      const userIds = [...new Set(supaComments.map((c: any) => c.user_id))];
      let usersMap: Record<string, { username: string; avatar: string | null; role: string }> = {};
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, avatar, role')
          .in('id', userIds);
        if (usersData) {
          usersData.forEach((u: any) => {
            usersMap[u.id] = { username: u.username, avatar: u.avatar, role: u.role || 'user' };
          });
        }
      }

      // Check user liked comments
      let userLikedCommentIds = new Set<string>();
      if (currentUserId) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', currentUserId);
        if (likesData) {
          likesData.forEach((l: any) => userLikedCommentIds.add(l.comment_id));
        }
      }

      commentsList = supaComments.map((c: any) => {
        const u = usersMap[c.user_id] || { username: 'Usuario', avatar: null, role: 'user' };
        return {
          id: c.id,
          projectId: c.project_id,
          userId: c.user_id,
          authorName: u.username,
          authorAvatar: u.avatar,
          authorRole: u.role,
          content: c.content,
          likesCount: c.likes_count || 0,
          isLiked: userLikedCommentIds.has(c.id),
          createdAt: c.created_at
        };
      });
    } else {
      // Fallback local store
      const fallback = getFallbackData();
      const filtered = fallback.comments.filter((c: any) => c.projectId === scriptId);

      commentsList = filtered.map((c: any) => {
        const isLiked = currentUserId 
          ? fallback.likes.some((l: any) => l.commentId === c.id && l.userId === currentUserId)
          : false;
        return {
          ...c,
          isLiked
        };
      });
    }

    // Sort
    if (sortBy === 'likes') {
      commentsList.sort((a, b) => (b.likesCount - a.likesCount) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      commentsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({
      success: true,
      comments: commentsList,
      total: commentsList.length
    });
  } catch (err: any) {
    console.error('Error in GET /api/scripts/[id]/comments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: scriptId } = await params;

    // 1. Auth check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Inicia sesión para comentar' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 });

    // 2. Body check
    const { content, captchaToken, captchaAnswer, honeypot } = await req.json();

    // Verificación anti-bot para comentarios
    const captchaCheck = verifyCaptcha(captchaToken, captchaAnswer, honeypot);
    if (!captchaCheck.valid) {
      return NextResponse.json({ error: captchaCheck.error || 'Código de seguridad incorrecto' }, { status: 400 });
    }

    const trimmed = (content || '').trim();
    if (!trimmed || trimmed.length < 2) {
      return NextResponse.json({ error: 'El comentario debe tener al menos 2 caracteres' }, { status: 400 });
    }
    if (trimmed.length > 1200) {
      return NextResponse.json({ error: 'El comentario no puede exceder 1200 caracteres' }, { status: 400 });
    }

    // 3. User info
    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar, role')
      .eq('id', user.id)
      .maybeSingle();

    const authorName = userData?.username || user.email?.split('@')[0] || 'Usuario';
    const authorAvatar = userData?.avatar || null;
    const authorRole = userData?.role || 'user';

    const newCommentId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    // 4. Try Supabase insert
    const { data: inserted, error: supaErr } = await supabase
      .from('comments')
      .insert([{
        id: newCommentId,
        project_id: scriptId,
        user_id: user.id,
        content: trimmed,
        likes_count: 0,
        created_at: nowIso
      }])
      .select()
      .maybeSingle();

    const createdComment = {
      id: inserted ? inserted.id : newCommentId,
      projectId: scriptId,
      userId: user.id,
      authorName,
      authorAvatar,
      authorRole,
      content: trimmed,
      likesCount: 0,
      isLiked: false,
      createdAt: nowIso
    };

    if (supaErr) {
      // Fallback
      const fallback = getFallbackData();
      fallback.comments.push(createdComment);
      saveFallbackData(fallback);
    }

    // 5. Notify script author if different
    try {
      const { data: script } = await supabase
        .from('projects')
        .select('authorId')
        .eq('id', scriptId)
        .maybeSingle();

      if (script && script.authorId && script.authorId !== user.id && script.authorId !== authorName) {
        await supabase.from('notifications').insert([{
          user_id: script.authorId,
          actor_id: authorName,
          type: 'comment',
          read: false
        }]);
      }
    } catch (notifErr) {
      console.warn('Could not post notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      comment: createdComment
    });
  } catch (err: any) {
    console.error('Error in POST /api/scripts/[id]/comments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
