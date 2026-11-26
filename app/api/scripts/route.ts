export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Permisos CORS para que el HTML de tu compa no sea bloqueado
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'approved')
        .order('createdAt', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const authorIds = data.map(p => p.authorId).filter(id => uuidRegex.test(id));
    const usersMap: Record<string, string> = {};
    if (authorIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('id, username').in('id', authorIds);
        if (usersData) {
            usersData.forEach(u => usersMap[u.id] = u.username);
        }
    }

    // Le agregamos los arrays vacíos de likes y vistas para que el frontend no marque error
    const formattedData = data.map(p => ({
        ...p,
        authorName: usersMap[p.authorId] || p.authorId,
        likesCount: p.likes || 0, // Real like count for new React UI
        likes: [], // Legacy array format so old scripts don't crash
        shares: 0,
        viewedBy: [],
        unlockedBy: []
    }));

    return NextResponse.json(formattedData, { headers: corsHeaders });
}

// La publicación comparte la implementación autenticada (con captcha) de /api/scripts/create
export { POST } from './create/route';
