import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Nombre de usuario requerido' }, { status: 400 });
    }

    const cleanUsername = username.trim();

    // 1. Buscar en la tabla users
    const { data: userRec, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (userError || !userRec) {
      return NextResponse.json({ error: 'No existe ninguna cuenta registrada con ese nombre de usuario.' }, { status: 404 });
    }

    // 2. Obtener el email desde auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userRec.id);

    if (authError || !authData?.user?.email) {
      return NextResponse.json({ error: 'No se pudo encontrar el correo asociado a esta cuenta.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email: authData.user.email,
      username: userRec.username
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al buscar usuario' }, { status: 500 });
  }
}
