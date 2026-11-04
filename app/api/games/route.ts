import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_FILE = path.join(process.cwd(), 'data', 'games.json');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
};

function getLocalGames(): any[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    let games: any[] = [];
    const localGames = getLocalGames();

    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('title', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        games = data;
      } else {
        games = localGames;
      }
    } catch {
      games = localGames;
    }

    if (!games || games.length === 0) {
      games = localGames;
    }

    const formatted = games.map(g => {
      const coverUrl = g.cover_image_url || g.image || null;
      return {
        id: g.id,
        title: g.title || g.name || '',
        name: g.title || g.name || '',
        description: g.description || '',
        cover_image_url: coverUrl,
        image: coverUrl,
        place_id: g.place_id || g.placeId || '',
        placeId: g.place_id || g.placeId || '',
        created_at: g.created_at || null
      };
    });

    return NextResponse.json({ games: formatted }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
