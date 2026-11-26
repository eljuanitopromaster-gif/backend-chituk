import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';
import { verifyCaptcha } from '@/app/lib/captcha';

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Context) {
  try {
    const { id: scriptId } = await params;
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sort') || 'likes'; // 'likes' or 'newest'

    // Sesión opcional: solo sirve para marcar isLiked
    let currentUserId: string | null = null;
    const token = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) currentUserId = user.id;
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('project_id', scriptId);
    if (error) throw error;

    const userIds = [...new Set((comments || []).map((c: any) => c.user_id))];
    const usersMap: Record<string, { username: string; avatar: string | null; role: string }> = {};

    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar, role')
        .in('id', userIds);
      if (usersError) throw usersError;
      (usersData || []).forEach((u: any) => {
        usersMap[u.id] = { username: u.username, avatar: u.avatar, role: u.role || 'user' };
      });
    }

    const likedIds = new Set<string>();
    if (currentUserId) {
      const { data: likes, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', currentUserId);
      if (likesError) throw likesError;
      (likes || []).forEach((l: any) => likedIds.add(l.comment_id));
    }

    const commentsList = (comments || []).map((c: any) => {
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
        isLiked: likedIds.has(c.id),
        createdAt: c.created_at
      };
    });

    const newestFirst = (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    commentsList.sort(sortBy === 'likes'
      ? (a, b) => (b.likesCount - a.likesCount) || newestFirst(a, b)
      : newestFirst);

    return NextResponse.json({
      success: true,
      comments: commentsList,
      total: commentsList.length
    });
  } catch (err: any) {
    console.error('Error in GET /api/scripts/[id]/comments:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Context) {
  try {
    const { id: scriptId } = await params;

    // 1. Auth check
    const auth = await requireActiveUser(req);
    if (!auth.ok) return auth.response;
    const user = auth.user;

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

    const { data: script, error: scriptError } = await supabase
      .from('projects')
      .select('authorId')
      .eq('id', scriptId)
      .maybeSingle();
    if (scriptError) throw scriptError;
    if (!script) {
      return NextResponse.json({ error: 'Script no encontrado' }, { status: 404 });
    }

    // 3. User info
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('avatar')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const authorName = user.username || 'Usuario';

    // 4. Insert
    const { data: inserted, error: insertError } = await supabase
      .from('comments')
      .insert([{
        project_id: scriptId,
        user_id: user.id,
        content: trimmed,
        likes_count: 0
      }])
      .select()
      .single();
    if (insertError) throw insertError;

    // 5. Notify script author if different (un fallo aquí no anula el comentario)
    if (script.authorId && script.authorId !== user.id && script.authorId !== authorName) {
      const { error: notifError } = await supabase.from('notifications').insert([{
        user_id: script.authorId,
        actor_id: authorName,
        type: 'comment',
        read: false
      }]);
      if (notifError) console.warn('Could not post notification:', notifError.message);
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: inserted.id,
        projectId: scriptId,
        userId: user.id,
        authorName,
        authorAvatar: profile?.avatar || null,
        authorRole: user.role,
        content: trimmed,
        likesCount: 0,
        isLiked: false,
        createdAt: inserted.created_at
      }
    });
  } catch (err: any) {
    console.error('Error in POST /api/scripts/[id]/comments:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
