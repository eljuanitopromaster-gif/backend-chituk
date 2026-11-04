import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Subir imagen en Base64 a Supabase Storage bucket 'covers' si aplica (en memoria, sin tocar disco)
async function handleImageUpload(image: string | null | undefined, toolId: string): Promise<string | null> {
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
      const fileName = `tool-${toolId}-${Date.now()}.${ext}`;

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
    console.warn('Storage upload fallback for tools:', storageErr);
  }

  return image;
}

// Normaliza el objeto devuelto al frontend soportando snake_case y camelCase
function formatTool(row: any) {
  const imageUrl = row.image_url || row.image_src || row.imageSrc || null;
  return {
    id: row.id,
    name: row.name,
    category: row.category || 'executors',
    platforms: Array.isArray(row.platforms) ? row.platforms : ['windows'],
    access: row.access || 'free',
    priceDisplay: row.price_display || row.priceDisplay || 'FREE',
    price_display: row.price_display || row.priceDisplay || 'FREE',
    viewsDisplay: row.views_display || row.viewsDisplay || `${row.views_count || 0}`,
    views_display: row.views_display || row.viewsDisplay || `${row.views_count || 0}`,
    viewsCount: Number(row.views_count || row.viewsCount || 0),
    views_count: Number(row.views_count || row.viewsCount || 0),
    rating: Number(row.rating || 5.0),
    reviewsCount: Number(row.reviews_count || row.reviewsCount || 0),
    reviews_count: Number(row.reviews_count || row.reviewsCount || 0),
    status: row.status || 'Actualizado',
    description: row.description || '',
    features: Array.isArray(row.features) ? row.features : [],
    downloadUrl: row.download_url || row.downloadUrl || row.download_link || row.downloadLink || row.url || '',
    download_url: row.download_url || row.downloadUrl || row.download_link || row.downloadLink || row.url || '',
    downloadLink: row.download_link || row.downloadLink || row.download_url || row.downloadUrl || row.url || '',
    url: row.url || row.download_link || row.downloadLink || row.download_url || row.downloadUrl || '',
    image_url: imageUrl,
    image_src: imageUrl,
    imageSrc: imageUrl,
    createdAt: row.created_at || row.createdAt,
    created_at: row.created_at || row.createdAt
  };
}

// 1. GET: Retorna las herramientas directamente desde Supabase
export async function GET(request: Request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Reintentar sin ordenar en caso de que la columna created_at varíe
      const fallback = await supabase.from('tools').select('*');
      if (fallback.error) {
        throw new Error(fallback.error.message);
      }
      return NextResponse.json({ tools: (fallback.data || []).map(formatTool) });
    }

    return NextResponse.json({ tools: (data || []).map(formatTool) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST: Inserta directamente en la tabla tools de Supabase
export async function POST(request: Request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const {
      name,
      category = 'executors',
      platforms = ['windows'],
      access = 'free',
      priceDisplay,
      price_display,
      viewsDisplay,
      views_display,
      viewsCount,
      views_count,
      rating = 5.0,
      reviewsCount,
      reviews_count,
      status = 'Actualizado',
      description,
      features = [],
      downloadUrl,
      download_url,
      imageSrc,
      image_src,
      image_url,
      imageUrl
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del programa es obligatorio.' }, { status: 400 });
    }

    const targetDownloadUrl = (downloadUrl || download_url || '').trim();
    if (!targetDownloadUrl) {
      return NextResponse.json({ error: 'El enlace de descarga o web es obligatorio.' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'La descripción es obligatoria.' }, { status: 400 });
    }

    // Slug identificador único
    const baseSlug = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const id = baseSlug || `tool-${Date.now()}`;

    // Obtener la URL de imagen (si vino en base64 se sube a Storage en memoria)
    const rawImage = image_url || imageUrl || imageSrc || image_src || null;
    const finalImageUrl = await handleImageUpload(rawImage, id);

    const parsedFeatures = Array.isArray(features)
      ? features.map((f: any) => String(f).trim()).filter(Boolean)
      : String(features).split('\n').map((s: string) => s.trim()).filter(Boolean);

    const toolPayload: any = {
      id,
      name: name.trim(),
      category: category === 'externals' ? 'externals' : 'executors',
      platforms: Array.isArray(platforms) && platforms.length > 0 ? platforms : ['windows'],
      access: access === 'paid' ? 'paid' : 'free',
      price_display: (price_display || priceDisplay || 'FREE').trim(),
      views_display: (views_display || viewsDisplay || '1.0K').trim(),
      views_count: Number(views_count || viewsCount || 1000),
      rating: Number(rating) || 5.0,
      reviews_count: Number(reviews_count || reviewsCount || 1),
      status: status || 'Actualizado',
      description: description.trim(),
      features: parsedFeatures,
      download_url: targetDownloadUrl,
      image_url: finalImageUrl || null,
      image_src: finalImageUrl || null,
      created_at: new Date().toISOString()
    };

    // Inserción directa en Supabase
    let { error: insertError } = await supabase.from('tools').insert([toolPayload]);

    // Resiliencia de esquema si image_url o image_src no existen en la BD
    if (insertError && insertError.message?.includes('image_url')) {
      const fallback = { ...toolPayload };
      delete fallback.image_url;
      const retry = await supabase.from('tools').insert([fallback]);
      insertError = retry.error;
    } else if (insertError && insertError.message?.includes('image_src')) {
      const fallback = { ...toolPayload };
      delete fallback.image_src;
      const retry = await supabase.from('tools').insert([fallback]);
      insertError = retry.error;
    }

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ success: true, tool: formatTool(toolPayload) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. PUT: Actualiza directamente en la tabla tools de Supabase
export async function PUT(request: Request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID de la herramienta requerido.' }, { status: 400 });
    }

    const rawImage = body.image_url ?? body.imageUrl ?? body.imageSrc ?? body.image_src;
    let finalImageUrl: string | null | undefined = undefined;
    if (rawImage !== undefined) {
      finalImageUrl = await handleImageUpload(rawImage, id);
    }

    const parsedFeatures = body.features !== undefined
      ? (Array.isArray(body.features)
          ? body.features.map((f: any) => String(f).trim()).filter(Boolean)
          : String(body.features).split('\n').map((s: string) => s.trim()).filter(Boolean))
      : undefined;

    const updatePayload: any = {};
    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.platforms !== undefined) updatePayload.platforms = body.platforms;
    if (body.access !== undefined) updatePayload.access = body.access;
    if (body.priceDisplay !== undefined || body.price_display !== undefined) {
      updatePayload.price_display = (body.price_display || body.priceDisplay || 'FREE').trim();
    }
    if (body.viewsDisplay !== undefined || body.views_display !== undefined) {
      updatePayload.views_display = (body.views_display || body.viewsDisplay || '1.0K').trim();
    }
    if (body.viewsCount !== undefined || body.views_count !== undefined) {
      updatePayload.views_count = Number(body.views_count || body.viewsCount || 0);
    }
    if (body.rating !== undefined) updatePayload.rating = Number(body.rating);
    if (body.reviewsCount !== undefined || body.reviews_count !== undefined) {
      updatePayload.reviews_count = Number(body.reviews_count || body.reviewsCount || 0);
    }
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.description !== undefined) updatePayload.description = body.description.trim();
    if (parsedFeatures !== undefined) updatePayload.features = parsedFeatures;
    if (body.downloadUrl !== undefined || body.download_url !== undefined) {
      updatePayload.download_url = (body.download_url || body.downloadUrl || '').trim();
    }
    if (finalImageUrl !== undefined) {
      updatePayload.image_url = finalImageUrl;
      updatePayload.image_src = finalImageUrl;
    }

    let { error: updateError, data } = await supabase
      .from('tools')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (updateError && updateError.message?.includes('image_url')) {
      const fallback = { ...updatePayload };
      delete fallback.image_url;
      const retry = await supabase.from('tools').update(fallback).eq('id', id).select('*').maybeSingle();
      updateError = retry.error;
      data = retry.data;
    } else if (updateError && updateError.message?.includes('image_src')) {
      const fallback = { ...updatePayload };
      delete fallback.image_src;
      const retry = await supabase.from('tools').update(fallback).eq('id', id).select('*').maybeSingle();
      updateError = retry.error;
      data = retry.data;
    }

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ success: true, tool: formatTool(data || { id, ...updatePayload }) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. DELETE: Borra directamente la fila en Supabase
export async function DELETE(request: Request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de la herramienta requerido.' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('tools')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
