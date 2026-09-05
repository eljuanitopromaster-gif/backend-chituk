export const dynamic = 'force-dynamic';

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
    const { data, error } = await supabase.from('users').select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    return NextResponse.json(data, { headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Upsert inserta si no existe, o actualiza si ya existe
        const { data, error } = await supabase.from('users').upsert([body]).select();
        if (error) throw error;

        return NextResponse.json({ success: true, data }, { headers: corsHeaders });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}