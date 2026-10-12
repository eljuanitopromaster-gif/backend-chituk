import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_FILE = path.join(process.cwd(), 'data', 'tools.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function getLocalTools(): any[] {
  try {
    ensureDataFile();
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading data/tools.json:', err);
    return [];
  }
}

function saveLocalTools(tools: any[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tools, null, 2), 'utf8');
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
    return { authorized: false, error: 'No autorizado', status: 401 };
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  const allowedRoles = ['owner', 'admin', 'creator'];
  if (userError || !user || !allowedRoles.includes(user.role)) {
    return { authorized: false, error: 'Acceso denegado. Se requieren permisos de administrador u owner.', status: 403 };
  }

  return { authorized: true, userId, userRole: user.role };
}

// 1. GET: List all tools
export async function GET(request: Request) {
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const tools = getLocalTools();
    return NextResponse.json({ tools });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. POST: Create a new tool
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
      priceDisplay = 'FREE',
      viewsDisplay = '1.0K',
      viewsCount = 1000,
      rating = 5.0,
      reviewsCount = 1,
      status = 'Actualizado',
      description,
      features = [],
      downloadUrl,
      imageSrc
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del programa es obligatorio.' }, { status: 400 });
    }

    if (!downloadUrl || !downloadUrl.trim()) {
      return NextResponse.json({ error: 'El enlace de descarga o web es obligatorio.' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'La descripción es obligatoria.' }, { status: 400 });
    }

    // Generate unique slug id
    const baseSlug = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const id = baseSlug || `tool-${Date.now()}`;

    const tools = getLocalTools();
    if (tools.some((t: any) => t.id === id)) {
      return NextResponse.json({ error: `Ya existe una herramienta con el identificador "${id}". Cambia el nombre o edítala.` }, { status: 400 });
    }

    const parsedFeatures = Array.isArray(features) 
      ? features.map((f: any) => String(f).trim()).filter(Boolean)
      : String(features).split('\n').map(s => s.trim()).filter(Boolean);

    const newTool = {
      id,
      name: name.trim(),
      category: category === 'externals' ? 'externals' : 'executors',
      platforms: Array.isArray(platforms) && platforms.length > 0 ? platforms : ['windows'],
      access: access === 'paid' ? 'paid' : 'free',
      priceDisplay: priceDisplay || 'FREE',
      viewsDisplay: viewsDisplay || '1.0K',
      viewsCount: Number(viewsCount) || 1000,
      rating: Number(rating) || 5.0,
      reviewsCount: Number(reviewsCount) || 1,
      status: status || 'Actualizado',
      description: description.trim(),
      features: parsedFeatures,
      downloadUrl: downloadUrl.trim(),
      imageSrc: imageSrc?.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    tools.unshift(newTool);
    saveLocalTools(tools);

    // Intentar replicar en Supabase si la tabla existe
    try {
      await supabase.from('tools').insert([{
        id: newTool.id,
        name: newTool.name,
        category: newTool.category,
        platforms: newTool.platforms,
        access: newTool.access,
        price_display: newTool.priceDisplay,
        views_display: newTool.viewsDisplay,
        views_count: newTool.viewsCount,
        rating: newTool.rating,
        reviews_count: newTool.reviewsCount,
        status: newTool.status,
        description: newTool.description,
        features: newTool.features,
        download_url: newTool.downloadUrl,
        image_src: newTool.imageSrc
      }]);
    } catch (e) {
      // Ignorar si la tabla no existe en la BD
    }

    return NextResponse.json({ success: true, tool: newTool });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. PUT: Update an existing tool
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

    const tools = getLocalTools();
    const index = tools.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Herramienta no encontrada.' }, { status: 404 });
    }

    const current = tools[index];
    const parsedFeatures = body.features !== undefined
      ? (Array.isArray(body.features) 
          ? body.features.map((f: any) => String(f).trim()).filter(Boolean)
          : String(body.features).split('\n').map((s: string) => s.trim()).filter(Boolean))
      : current.features;

    const updated = {
      ...current,
      name: body.name !== undefined ? body.name.trim() : current.name,
      category: body.category !== undefined ? body.category : current.category,
      platforms: body.platforms !== undefined ? body.platforms : current.platforms,
      access: body.access !== undefined ? body.access : current.access,
      priceDisplay: body.priceDisplay !== undefined ? body.priceDisplay : current.priceDisplay,
      viewsDisplay: body.viewsDisplay !== undefined ? body.viewsDisplay : current.viewsDisplay,
      viewsCount: body.viewsCount !== undefined ? Number(body.viewsCount) : current.viewsCount,
      rating: body.rating !== undefined ? Number(body.rating) : current.rating,
      reviewsCount: body.reviewsCount !== undefined ? Number(body.reviewsCount) : current.reviewsCount,
      status: body.status !== undefined ? body.status : current.status,
      description: body.description !== undefined ? body.description.trim() : current.description,
      features: parsedFeatures,
      downloadUrl: body.downloadUrl !== undefined ? body.downloadUrl.trim() : current.downloadUrl,
      imageSrc: body.imageSrc !== undefined ? (body.imageSrc.trim() || undefined) : current.imageSrc,
      updatedAt: new Date().toISOString()
    };

    tools[index] = updated;
    saveLocalTools(tools);

    // Intentar actualizar en Supabase si la tabla existe
    try {
      await supabase.from('tools').upsert([{
        id: updated.id,
        name: updated.name,
        category: updated.category,
        platforms: updated.platforms,
        access: updated.access,
        price_display: updated.priceDisplay,
        views_display: updated.viewsDisplay,
        views_count: updated.viewsCount,
        rating: updated.rating,
        reviews_count: updated.reviewsCount,
        status: updated.status,
        description: updated.description,
        features: updated.features,
        download_url: updated.downloadUrl,
        image_src: updated.imageSrc
      }]);
    } catch (e) {}

    return NextResponse.json({ success: true, tool: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 4. DELETE: Remove a tool
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

    const tools = getLocalTools();
    const filtered = tools.filter((t: any) => t.id !== id);

    if (tools.length === filtered.length) {
      return NextResponse.json({ error: 'Herramienta no encontrada.' }, { status: 404 });
    }

    saveLocalTools(filtered);

    // Intentar eliminar de Supabase si la tabla existe
    try {
      await supabase.from('tools').delete().eq('id', id);
    } catch (e) {}

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
