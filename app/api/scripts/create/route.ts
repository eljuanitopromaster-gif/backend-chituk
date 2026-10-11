import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCaptcha } from '@/app/lib/captcha';

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
    const { title, game, description, script, isMobileFriendly, image, captchaToken, captchaAnswer, honeypot } = body;

    // Verificar protección anti-bot
    const captchaCheck = verifyCaptcha(captchaToken, captchaAnswer, honeypot);
    if (!captchaCheck.valid) {
      return NextResponse.json({ error: captchaCheck.error || 'Código de seguridad incorrecto' }, { status: 400 });
    }

    if (!title || !game || !description || !script) {
        return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const newId = crypto.randomUUID();
    const fullDescription = `${game}\n\n${description}`;

    let finalImageUrl = image || null;
    if (typeof image === 'string' && image.startsWith('data:image')) {
      try {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const ext = mimeType.split('/')[1] || 'jpeg';
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = `covers/${newId}-${Date.now()}.${ext}`;

          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('covers')
            .upload(fileName, buffer, { contentType: mimeType, upsert: true });

          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('covers')
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              finalImageUrl = publicUrlData.publicUrl;
            }
          }
        }
      } catch (storageErr) {
        console.warn("Cover image storage upload fallback to data url", storageErr);
      }
    }

    const projectToSave = {
        id: newId,
        title: title,
        description: fullDescription,
        script: script,
        image: finalImageUrl,
        scriptMode: isMobileFriendly ? 'mobile-friendly' : 'script',
        is_mobile_friendly: isMobileFriendly ? true : false,
        kind: 'script',
        authorId: user.id, // OBLIGATORIO: user_id de la sesión
        status: 'pending', // OBLIGATORIO: estado pending
        createdAt: new Date().toISOString(),
        views: 0,
        unlocks: 0,
        copies: 0,
        likes: 0,
        language: 'lua'
    };

    const { data, error } = await supabase.from('projects').insert([projectToSave]).select();
    if (error) throw error;

    // Obtener username del autor para la notificación
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
