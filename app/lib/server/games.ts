import 'server-only';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from './supabaseAdmin';
import { isUuid } from '../scriptPermissions';

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Normaliza una fila de public.games para el frontend. */
export function formatGame(row: any) {
  const cover = row.cover_image_url || null;
  const placeId = row.place_id || '';
  return {
    ...row,
    name: row.title,
    cover_image_url: cover,
    image: cover,
    place_id: placeId,
    placeId,
  };
}

/**
 * Si la portada llega en base64, la sube al bucket `covers` y devuelve su URL pública.
 * Cualquier error de Storage se propaga: nunca se guarda el base64 en la base de datos.
 */
async function resolveCover(image: unknown, gameId: string): Promise<string | null> {
  if (typeof image !== 'string' || !image.trim()) return null;
  if (!image.startsWith('data:')) return image.trim();

  const matches = image.match(/^data:(image\/[A-Za-z0-9+.-]+);base64,(.+)$/);
  if (!matches) throw new InvalidInput('La imagen de portada no es válida.');

  const mimeType = matches[1];
  const fileName = `game-${gameId}-${Date.now()}.${mimeType.split('/')[1]}`;
  const { error } = await supabaseAdmin.storage
    .from('covers')
    .upload(fileName, Buffer.from(matches[2], 'base64'), { contentType: mimeType, upsert: true });
  if (error) throw new Error(`No se pudo subir la portada: ${error.message}`);

  return supabaseAdmin.storage.from('covers').getPublicUrl(fileName).data.publicUrl;
}

class InvalidInput extends Error {}

function failure(context: string, err: any) {
  if (err instanceof InvalidInput) return jsonError(err.message, 400);
  console.error(`${context}:`, err?.message || err);
  return jsonError(err?.message || 'Error interno del servidor.', 500);
}

async function readBody(request: Request): Promise<any> {
  try {
    const body = await request.json();
    if (body && typeof body === 'object') return body;
  } catch {}
  throw new InvalidInput('El cuerpo de la petición no es un JSON válido.');
}

function readTitle(body: any): string {
  const title = String(body.title || body.name || '').trim();
  if (!title) throw new InvalidInput('El título del juego es obligatorio.');
  return title;
}

/** Listado de administración con el número de scripts vinculados a cada juego. */
export async function listGamesWithCounts() {
  try {
    const { data: games, error } = await supabaseAdmin
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('game_id, title, description');
    if (projectsError) throw projectsError;

    const counts: Record<string, number> = {};
    for (const p of projects || []) {
      if (p.game_id) {
        counts[p.game_id] = (counts[p.game_id] || 0) + 1;
        continue;
      }
      // Scripts anteriores a la columna game_id: se relacionan por texto
      const text = `${p.title || ''} ${p.description || ''}`.toLowerCase();
      for (const g of games || []) {
        const gameTitle = String(g.title || '').toLowerCase();
        if (gameTitle && text.includes(gameTitle)) {
          counts[g.id] = (counts[g.id] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      games: (games || []).map(g => ({ ...formatGame(g), scripts_count: counts[g.id] || 0 })),
    });
  } catch (err) {
    return failure('Error al listar juegos', err);
  }
}

export async function getGame(id: string) {
  if (!isUuid(id)) return jsonError('El ID del juego no es válido.', 400);
  try {
    const { data, error } = await supabaseAdmin.from('games').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return jsonError('Juego no encontrado.', 404);
    return NextResponse.json({ game: formatGame(data) });
  } catch (err) {
    return failure('Error al leer el juego', err);
  }
}

export async function createGame(request: Request) {
  try {
    const body = await readBody(request);
    const title = readTitle(body);
    const id = crypto.randomUUID();
    const cover = await resolveCover(body.cover_image_url || body.image, id);
    const placeId = String(body.place_id || body.placeId || '').trim();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('games')
      .insert([{
        id,
        title,
        description: String(body.description || '').trim(),
        cover_image_url: cover,
        ...(placeId ? { place_id: placeId } : {}),
        created_at: now,
        updated_at: now,
      }])
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, game: formatGame(data) });
  } catch (err) {
    return failure('Error al crear el juego', err);
  }
}

/** Actualiza solo los campos enviados. Si `routeId` no llega, el ID sale del cuerpo. */
export async function updateGame(request: Request, routeId?: string) {
  try {
    const body = await readBody(request);
    const id = String(routeId || body.id || '');
    if (!isUuid(id)) return jsonError('El ID del juego no es válido.', 400);

    const changes: Record<string, string | null> = {
      title: readTitle(body),
      updated_at: new Date().toISOString(),
    };
    if (body.description !== undefined) changes.description = String(body.description || '').trim();

    const rawCover = body.cover_image_url !== undefined ? body.cover_image_url : body.image;
    if (rawCover !== undefined) changes.cover_image_url = await resolveCover(rawCover, id);

    const rawPlaceId = body.place_id !== undefined ? body.place_id : body.placeId;
    if (rawPlaceId !== undefined) changes.place_id = String(rawPlaceId || '').trim() || null;

    const { data, error } = await supabaseAdmin
      .from('games')
      .update(changes)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return jsonError('Juego no encontrado.', 404);

    return NextResponse.json({ success: true, game: formatGame(data) });
  } catch (err) {
    return failure('Error al actualizar el juego', err);
  }
}

export async function deleteGame(id: string) {
  if (!isUuid(id)) return jsonError('El ID del juego no es válido.', 400);
  try {
    // Comprobar que existe antes de desvincular scripts
    const { data: game, error: findError } = await supabaseAdmin
      .from('games').select('id').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!game) return jsonError('Juego no encontrado.', 404);

    const { error: unlinkError } = await supabaseAdmin
      .from('projects').update({ game_id: null }).eq('game_id', id);
    if (unlinkError) throw unlinkError;

    const { error } = await supabaseAdmin.from('games').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err) {
    return failure('Error al eliminar el juego', err);
  }
}
