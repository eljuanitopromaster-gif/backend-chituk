import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';
import { verifyCaptcha } from '@/app/lib/captcha';

export async function POST(req: Request) {
  try {
    const auth = await requireActiveUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.user.id;

    const body = await req.json();
    const { title, game, game_id, gameId, description, script, isMobileFriendly, image, captchaToken, captchaAnswer, honeypot } = body;

    // Validación segura de UUID para la relación projects.game_id -> games.id
    const rawGameId = game_id || gameId || null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validGameId = (rawGameId && typeof rawGameId === 'string' && uuidRegex.test(rawGameId)) ? rawGameId : null;

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
          const fileName = `${newId}-${Date.now()}.${ext}`;

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

    // Inserción en la tabla 'projects' (Chituk almacena los scripts en 'projects')
    const projectToSave: any = {
        id: newId,
        title: title,
        game_id: validGameId,
        description: fullDescription,
        script: script,
        image: finalImageUrl,
        scriptMode: isMobileFriendly ? 'mobile-friendly' : 'script',
        is_mobile_friendly: isMobileFriendly ? true : false,
        kind: 'script',
        authorId: userId, // OBLIGATORIO: user_id de la sesión
        status: 'pending', // OBLIGATORIO: estado pending
        createdAt: new Date().toISOString(),
        views: 0,
        unlocks: 0,
        copies: 0,
        likes: 0,
        language: 'lua'
    };

    let data = null;
    let { data: insertedData, error } = await supabase.from('projects').insert([projectToSave]).select();
    
    // Fallback si la columna game_id aún no ha sido agregada en la BD
    if (error && error.message?.includes('game_id')) {
      console.warn("Retrying insert without game_id column:", error.message);
      delete projectToSave.game_id;
      const retryResult = await supabase.from('projects').insert([projectToSave]).select();
      error = retryResult.error;
      data = retryResult.data;
    } else {
      data = insertedData;
    }

    if (error) throw error;

    const actorUsername = auth.user.username || auth.user.email || 'Usuario';

    // Notificar a los administradores
    try {
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
    } catch (notifErr) {
      console.warn("Notification insert error ignored:", notifErr);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
