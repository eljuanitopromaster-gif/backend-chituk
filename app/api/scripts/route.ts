import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Permisos CORS para que el HTML de tu compa no sea bloqueado
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('createdAt', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

    // Le agregamos los arrays vacíos de likes y vistas para que el frontend no marque error
    const formattedData = data.map(p => ({
        ...p,
        likes: [],
        shares: 0,
        viewedBy: [],
        unlockedBy: []
    }));

    return NextResponse.json(formattedData, { headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Limpiamos los datos para que coincidan exacto con tu tabla de Supabase
        const projectToSave = {
            id: body.id,
            title: body.title,
            description: body.description,
            script: body.script,
            scriptMode: body.scriptMode,
            kind: body.kind,
            authorId: body.authorId,
            youtubeUrl: body.youtubeUrl || null,
            destinationUrl: body.destinationUrl || null,
            image: body.image || null,
            views: body.views || 0,
            unlocks: body.unlocks || 0,
            createdAt: body.createdAt
        };

        const { data, error } = await supabase.from('projects').insert([projectToSave]).select();
        if (error) throw error;

        return NextResponse.json({ success: true, data }, { headers: corsHeaders });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}