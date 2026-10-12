import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado. Se requiere token de sesión.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Sesión no válida o expirada.' }, { status: 401 });
    }

    const body = await req.json();
    const { username, bio, avatar, email } = body;

    // Obtener los datos actuales del usuario
    const { data: currentUser, error: userFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userFetchError || !currentUser) {
      return NextResponse.json({ error: 'No se encontró el perfil de usuario.' }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {};

    // 1. Manejo del cambio de Username (con cooldown de 15 días)
    if (username !== undefined && username.trim() !== '' && username.trim() !== currentUser.username) {
      const trimmedUsername = username.trim();

      if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        return NextResponse.json({ error: 'El nombre de usuario debe tener entre 3 y 30 caracteres.' }, { status: 400 });
      }

      if (!/^[\p{L}\p{N}._-]+$/u.test(trimmedUsername)) {
        return NextResponse.json({ error: 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos.' }, { status: 400 });
      }

      // Validar regla de los 15 días
      if (currentUser.username_changed_at) {
        const lastChanged = new Date(currentUser.username_changed_at).getTime();
        const now = Date.now();
        const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
        const elapsed = now - lastChanged;

        if (elapsed < fifteenDaysMs) {
          const remainingDays = Math.ceil((fifteenDaysMs - elapsed) / (24 * 60 * 60 * 1000));
          const nextDate = new Date(lastChanged + fifteenDaysMs).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          return NextResponse.json({
            error: `Solo puedes cambiar tu nombre de usuario cada 15 días. Podrás volver a cambiarlo en ${remainingDays} días (el ${nextDate}).`,
            canChangeUsername: false,
            remainingDays,
            nextAvailableDate: nextDate
          }, { status: 400 });
        }
      }

      // Verificar si el username ya está en uso
      const normalized = trimmedUsername.toLowerCase();
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('normalized', normalized)
        .neq('id', user.id)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json({ error: 'Ese nombre de usuario ya está registrado por otra persona.' }, { status: 400 });
      }

      updatePayload.username = trimmedUsername;
      updatePayload.normalized = normalized;
      updatePayload.username_changed_at = new Date().toISOString();
    }

    // 2. Manejo de la descripción (bio)
    if (bio !== undefined) {
      if (typeof bio === 'string' && bio.length > 500) {
        return NextResponse.json({ error: 'La descripción no puede exceder 500 caracteres.' }, { status: 400 });
      }
      updatePayload.bio = bio ? bio.trim() : null;
    }

    // 3. Manejo del avatar / foto de perfil
    if (avatar !== undefined) {
      let finalAvatarUrl = avatar;

      // Si se envió un base64, intentar subirlo a Supabase Storage (bucket 'avatars')
      if (typeof avatar === 'string' && avatar.startsWith('data:image')) {
        try {
          const matches = avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const ext = mimeType.split('/')[1] || 'png';
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `avatars/${user.id}-${Date.now()}.${ext}`;

            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('avatars')
              .upload(fileName, buffer, { contentType: mimeType, upsert: true });

            if (!uploadErr && uploadData) {
              const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
              if (publicUrlData?.publicUrl) {
                finalAvatarUrl = publicUrlData.publicUrl;
              }
            }
          }
        } catch (storageErr) {
          console.warn("Storage upload failed, keeping base64/fallback", storageErr);
        }
      }

      updatePayload.avatar = finalAvatarUrl || null;
    }

    // 4. Manejo del cambio de Email (sin límites de tiempo o frecuencia)
    if (email !== undefined && typeof email === 'string' && email.trim() !== '' && email.trim().toLowerCase() !== (currentUser.email || '').toLowerCase()) {
      const trimmedEmail = email.trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json({ error: 'Por favor ingresa un correo electrónico válido.' }, { status: 400 });
      }

      // Verificar si el correo ya está en uso por otro usuario
      const { data: existingEmailUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', trimmedEmail)
        .neq('id', user.id)
        .maybeSingle();

      if (existingEmailUser) {
        return NextResponse.json({ error: 'Ese correo electrónico ya está registrado con otra cuenta.' }, { status: 400 });
      }

      // Actualizar en Supabase Auth
      const { error: authEmailError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email: trimmedEmail, email_confirm: true }
      );

      if (authEmailError) {
        return NextResponse.json({ error: `Error al actualizar correo: ${authEmailError.message}` }, { status: 400 });
      }

      updatePayload.email = trimmedEmail;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ success: true, message: 'No hay cambios para guardar.', user: currentUser });
    }

    // Realizar actualización en la base de datos
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error al actualizar perfil:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Error en POST /api/users/profile:", error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
