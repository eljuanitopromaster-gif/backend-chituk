import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_FILE = path.join(process.cwd(), 'data', 'games.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function getLocalGames(): any[] {
  try {
    ensureDataFile();
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading data/games.json:', err);
    return [];
  }
}

function saveLocalGames(games: any[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(games, null, 2), 'utf8');
}

// Authentication & Role verification helper
async function checkAdminAuth(request: Request) {
  let userId = request.headers.get('X-User-Id');
  const authHeader = request.headers.get('authorization');

  if (!userId && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user: authUser } } = await supabase.auth.getUser(token);
    if (authUser) userId = authUser.id;
  }

  if (!userId) {
    return { authorized: false, error: 'No autorizado. Se requiere iniciar sesión.', status: 401 };
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  const allowedRoles = ['owner', 'admin', 'creator', 'mod'];
  if (userError || !user || !allowedRoles.includes(user.role)) {
    return { authorized: false, error: 'Acceso denegado. Se requieren permisos de administrador.', status: 403 };
  }

  return { authorized: true, userId, userRole: user.role };
}

// Subir imagen en Base64 a Supabase Storage bucket 'covers' si aplica
async function handleImageUpload(image: string | null | undefined, gameId: string): Promise<string | null> {
  if (!image) return null;
  if (!image.startsWith('data:image')) {
    return image.trim();
  }

  try {
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const ext = mimeType.split('/')[1] || 'jpeg';
      const buffer = Buffer.from(matches[2], 'base64');
      const fileName = `game-${gameId}-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('covers')
        .upload(fileName, buffer, { contentType: mimeType, upsert: true });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    }
  } catch (storageErr) {
    console.warn('Storage upload fallback:', storageErr);
  }

  return image;
}

// 1. GET: Listar todos los juegos con recuento de scripts asociados
export async function GET(request: Request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let games: any[] = [];
    const localGames = getLocalGames();

    // Intentar consultar Supabase tabla 'games'
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        games = data;
        saveLocalGames(data);
      } else if (localGames.length > 0) {
        games = localGames;
      }
    } catch {
      games = localGames;
    }

    if (games.length === 0) {
      games = localGames;
    }

    // Obtener recuento de scripts vinculados por game_id en la tabla 'projects'
    const scriptCounts: Record<string, number> = {};
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, game_id, title, description');

      if (projects && Array.isArray(projects)) {
        projects.forEach(p => {
          if (p.game_id && scriptCounts[p.game_id] !== undefined) {
            scriptCounts[p.game_id] = (scriptCounts[p.game_id] || 0) + 1;
          } else if (p.game_id) {
            scriptCounts[p.game_id] = 1;
          } else {
            // Intentar matchear por texto en caso de scripts creados antes de la columna game_id
            const fullText = `${p.title || ''} ${p.description || ''}`.toLowerCase();
            games.forEach(g => {
              const gameTitle = (g.title || g.name || '').toLowerCase();
              if (gameTitle && fullText.includes(gameTitle)) {
                scriptCounts[g.id] = (scriptCounts[g.id] || 0) + 1;
              }
            });
          }
        });
      }
    } catch (e) {
      console.warn('Could not calculate script counts for games:', e);
    }

    const formattedGames = games.map(g => {
      const coverUrl = g.cover_image_url || g.image || null;
      return {
        ...g,
        title: g.title || g.name || '',
        name: g.title || g.name || '',
        cover_image_url: coverUrl,
        image: coverUrl,
        placeId: g.place_id || g.placeId || '',
        place_id: g.place_id || g.placeId || '',
        scripts_count: scriptCounts[g.id] || 0
      };
    });

    return NextResponse.json({ games: formattedGames });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST: Crear un nuevo juego (title, description, cover_image_url)
export async function POST(request: Request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { title, name, description, cover_image_url, image, place_id, placeId } = body;

    const gameTitle = (title || name || '').trim();
    if (!gameTitle) {
      return NextResponse.json({ error: 'El título del juego es obligatorio.' }, { status: 400 });
    }

    const newId = crypto.randomUUID();
    const rawImage = cover_image_url || image || null;
    const finalImage = await handleImageUpload(rawImage, newId);

    const newGame: any = {
      id: newId,
      title: gameTitle,
      description: description ? description.trim() : '',
      cover_image_url: finalImage || null,
      image: finalImage || null,
      place_id: place_id || placeId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Guardar en Supabase tabla 'games'
    try {
      let { error: sbError } = await supabase.from('games').insert([newGame]);
      
      // Fallback si la columna cover_image_url aún no existe en la BD
      if (sbError && sbError.message?.includes('cover_image_url')) {
        const fallbackGame = { ...newGame };
        delete fallbackGame.cover_image_url;
        const retry = await supabase.from('games').insert([fallbackGame]);
        sbError = retry.error;
      }

      if (sbError) {
        console.warn('Supabase insert warning in games:', sbError.message);
      }
    } catch (sbErr) {
      console.warn('Could not insert game to Supabase table:', sbErr);
    }

    // 2. Guardar en respaldo local
    const localGames = getLocalGames();
    localGames.unshift(newGame);
    saveLocalGames(localGames);

    return NextResponse.json({
      success: true,
      game: {
        ...newGame,
        name: newGame.title,
        cover_image_url: newGame.cover_image_url,
        placeId: newGame.place_id
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. PUT: Actualizar un juego existente
export async function PUT(request: Request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, title, name, description, cover_image_url, image, place_id, placeId } = body;

    if (!id) {
      return NextResponse.json({ error: 'El ID del juego es obligatorio para actualizar.' }, { status: 400 });
    }

    const gameTitle = (title || name || '').trim();
    if (!gameTitle) {
      return NextResponse.json({ error: 'El título del juego es obligatorio.' }, { status: 400 });
    }

    const localGames = getLocalGames();
    const existingIndex = localGames.findIndex(g => g.id === id);

    let rawImage = cover_image_url !== undefined ? cover_image_url : image;
    let finalImage = rawImage;
    if (rawImage && rawImage.startsWith('data:image')) {
      finalImage = await handleImageUpload(rawImage, id);
    }

    const updatedGame: any = {
      id,
      title: gameTitle,
      description: description !== undefined ? description.trim() : (existingIndex >= 0 ? localGames[existingIndex].description : ''),
      cover_image_url: finalImage !== undefined ? finalImage : (existingIndex >= 0 ? (localGames[existingIndex].cover_image_url || localGames[existingIndex].image) : null),
      image: finalImage !== undefined ? finalImage : (existingIndex >= 0 ? (localGames[existingIndex].cover_image_url || localGames[existingIndex].image) : null),
      place_id: (place_id !== undefined ? place_id : placeId) || (existingIndex >= 0 ? localGames[existingIndex].place_id : null),
      updated_at: new Date().toISOString()
    };

    // Actualizar en Supabase
    try {
      let { error: sbUpdateErr } = await supabase
        .from('games')
        .update({
          title: updatedGame.title,
          description: updatedGame.description,
          cover_image_url: updatedGame.cover_image_url,
          image: updatedGame.image,
          place_id: updatedGame.place_id,
          updated_at: updatedGame.updated_at
        })
        .eq('id', id);

      if (sbUpdateErr && sbUpdateErr.message?.includes('cover_image_url')) {
        await supabase
          .from('games')
          .update({
            title: updatedGame.title,
            description: updatedGame.description,
            image: updatedGame.image,
            place_id: updatedGame.place_id,
            updated_at: updatedGame.updated_at
          })
          .eq('id', id);
      }
    } catch (sbErr) {
      console.warn('Could not update game in Supabase:', sbErr);
    }

    // Actualizar en respaldo local
    if (existingIndex >= 0) {
      localGames[existingIndex] = {
        ...localGames[existingIndex],
        ...updatedGame
      };
    } else {
      localGames.unshift(updatedGame);
    }
    saveLocalGames(localGames);

    return NextResponse.json({
      success: true,
      game: {
        ...updatedGame,
        name: updatedGame.title,
        cover_image_url: updatedGame.cover_image_url,
        placeId: updatedGame.place_id
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. DELETE: Eliminar un juego del catálogo
export async function DELETE(request: Request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        if (body?.id) id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'El ID del juego es obligatorio.' }, { status: 400 });
    }

    // Desvincular scripts asociados en la tabla 'projects'
    try {
      await supabase.from('projects').update({ game_id: null }).eq('game_id', id);
    } catch (e) {
      console.warn('Could not nullify game_id on projects:', e);
    }

    // Eliminar de Supabase tabla 'games'
    try {
      const { error: sbDelErr } = await supabase.from('games').delete().eq('id', id);
      if (sbDelErr) {
        console.warn('Supabase delete warning in games:', sbDelErr.message);
      }
    } catch (sbErr) {
      console.warn('Could not delete game from Supabase:', sbErr);
    }

    // Eliminar de respaldo local
    const localGames = getLocalGames();
    const filtered = localGames.filter(g => g.id !== id);
    saveLocalGames(filtered);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
