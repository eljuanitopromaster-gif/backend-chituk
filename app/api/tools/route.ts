import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_FILE = path.join(process.cwd(), 'data', 'tools.json');

function getLocalTools() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading data/tools.json:', err);
  }
  return [];
}

export async function GET() {
  try {
    // 1. Intentar consultar Supabase si la tabla existe
    try {
      const { data: dbTools, error } = await supabase
        .from('tools')
        .select('*')
        .order('views_count', { ascending: false });

      if (!error && dbTools && dbTools.length > 0) {
        // Formatear al esquema de ToolItem
        const formatted = dbTools.map((t: any) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          platforms: t.platforms || [],
          access: t.access,
          priceDisplay: t.price_display || t.priceDisplay || 'FREE',
          viewsDisplay: t.views_display || t.viewsDisplay || `${t.views_count || 0}`,
          viewsCount: t.views_count || t.viewsCount || 0,
          rating: Number(t.rating || 5.0),
          reviewsCount: t.reviews_count || t.reviewsCount || 0,
          status: t.status || 'Actualizado',
          description: t.description || '',
          features: t.features || [],
          downloadUrl: t.download_url || t.downloadUrl || t.download_link || t.downloadLink || t.url || '',
          downloadLink: t.download_link || t.downloadLink || t.download_url || t.downloadUrl || t.url || '',
          url: t.url || t.download_link || t.downloadLink || t.download_url || t.downloadUrl || '',
          imageSrc: t.image_src || t.imageSrc || undefined
        }));
        return NextResponse.json({ tools: formatted });
      }
    } catch (e) {
      // Ignorar error si la tabla no existe en Supabase y recurrir a data/tools.json
    }

    // 2. Fallback a data/tools.json
    const tools = getLocalTools();
    return NextResponse.json({ tools });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, tools: [] }, { status: 500 });
  }
}
