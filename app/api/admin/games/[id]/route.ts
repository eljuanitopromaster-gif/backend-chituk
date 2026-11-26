import { NextResponse } from 'next/server';
import { requireStaff } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_FILE = path.join(process.cwd(), 'data', 'games.json');

function getLocalGames(): any[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveLocalGames(games: any[]) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2), 'utf8');
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const { id } = await props.params;

  try {
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && game) {
      return NextResponse.json({
        game: {
          ...game,
          cover_image_url: game.cover_image_url || game.image || null,
          image: game.cover_image_url || game.image || null
        }
      });
    }

    const localGames = getLocalGames();
    const found = localGames.find(g => g.id === id);
    if (found) {
      return NextResponse.json({
        game: {
          ...found,
          cover_image_url: found.cover_image_url || found.image || null,
          image: found.cover_image_url || found.image || null
        }
      });
    }

    return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const { id } = await props.params;
  const body = await request.json();

  const gameTitle = (body.title || body.name || '').trim();
  if (!gameTitle) {
    return NextResponse.json({ error: 'El título del juego es obligatorio.' }, { status: 400 });
  }

  const localGames = getLocalGames();
  const existingIndex = localGames.findIndex(g => g.id === id);
  const imageVal = body.cover_image_url !== undefined ? body.cover_image_url : body.image;

  const updatedGame: any = {
    id,
    title: gameTitle,
    description: body.description !== undefined ? body.description.trim() : (existingIndex >= 0 ? localGames[existingIndex].description : ''),
    cover_image_url: imageVal !== undefined ? imageVal : (existingIndex >= 0 ? (localGames[existingIndex].cover_image_url || localGames[existingIndex].image) : null),
    image: imageVal !== undefined ? imageVal : (existingIndex >= 0 ? (localGames[existingIndex].cover_image_url || localGames[existingIndex].image) : null),
    place_id: (body.place_id !== undefined ? body.place_id : body.placeId) || (existingIndex >= 0 ? localGames[existingIndex].place_id : null),
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from('games').update(updatedGame).eq('id', id);
  } catch (e) {
    console.warn('Supabase update fallback:', e);
  }

  if (existingIndex >= 0) {
    localGames[existingIndex] = { ...localGames[existingIndex], ...updatedGame };
  } else {
    localGames.unshift(updatedGame);
  }
  saveLocalGames(localGames);

  return NextResponse.json({ success: true, game: updatedGame });
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const { id } = await props.params;

  try {
    await supabase.from('projects').update({ game_id: null }).eq('game_id', id);
    await supabase.from('games').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase delete fallback:', e);
  }

  const localGames = getLocalGames();
  const filtered = localGames.filter(g => g.id !== id);
  saveLocalGames(filtered);

  return NextResponse.json({ success: true, deletedId: id });
}
