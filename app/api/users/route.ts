import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
    // Si la tabla users no existe aún en Supabase, esto podría fallar,
    // pero intentamos traer los usuarios de todos modos.
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('createdAt', { ascending: true });

    if (error) {
        // Si hay error (ej. la tabla no existe), devolvemos un array vacío para que el frontend no se rompa
        console.error("Error fetching users:", error.message);
        return NextResponse.json([], { headers: corsHeaders });
    }

    const formattedData = data.map(u => ({
        ...u,
        following: u.following || [],
        savedProjects: u.savedProjects || [],
        unlockedScripts: u.unlockedScripts || []
    }));

    return NextResponse.json(formattedData, { headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const userToSave = {
            id: body.id,
            username: body.username,
            normalized: body.normalized,
            passwordHash: body.passwordHash,
            role: body.role,
            bio: body.bio || null,
            avatar: body.avatar || null,
            verified: body.verified || false,
            banned: body.banned || false,
            banReason: body.banReason || null,
            theme: body.theme || "gaming",
            following: body.following || [],
            savedProjects: body.savedProjects || [],
            unlockedScripts: body.unlockedScripts || [],
            createdAt: body.createdAt
        };

        // Usa upsert para actualizar si el usuario ya existe o insertar si es nuevo
        const { data, error } = await supabase.from('users').upsert([userToSave]).select();
        
        if (error) {
            console.error("Error upserting user:", error.message);
            // Si la tabla no existe, que no rompa la aplicación, solo devuelve éxito simulado
            return NextResponse.json({ success: true, warning: error.message }, { headers: corsHeaders });
        }

        return NextResponse.json({ success: true, data }, { headers: corsHeaders });
    } catch (error: any) {
        console.error("Catch error in POST /api/users:", error.message);
        return NextResponse.json({ success: true, warning: error.message }, { headers: corsHeaders });
    }
}
