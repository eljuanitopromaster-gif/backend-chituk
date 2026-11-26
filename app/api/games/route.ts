import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabaseAdmin';
import { formatGame } from '@/app/lib/server/games';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Catálogo público
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('games')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error en GET /api/games:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }

  return NextResponse.json({ games: (data || []).map(formatGame) }, { headers: corsHeaders });
}
