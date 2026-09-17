import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { id, email, username } = await req.json();

    if (!id || !email || !username) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const normalized = username.trim().toLowerCase();

    // Comprobar si el username ya está en uso
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('normalized', normalized)
      .single();

    if (existingUser) {
      // Si el nombre de usuario ya existe, podríamos querer revertir el registro en Supabase Auth,
      // pero para mantenerlo simple por ahora, solo devolvemos un error.
      // (Nota: lo ideal es verificar esto antes del signup)
      return NextResponse.json({ error: 'El nombre de usuario ya está en uso.' }, { status: 400 });
    }

    const { data, error } = await supabase.from('users').insert([{
      id,
      username: username.trim(),
      normalized,
      role: 'user',
      is_verified: false,
      banned: false,
      createdAt: new Date().toISOString()
    }]);

    if (error) {
      console.error("Error al sincronizar el usuario:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
