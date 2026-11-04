import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function formatTool(t: any) {
  const imageUrl = t.image_url || t.image_src || t.imageSrc || null;
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    platforms: Array.isArray(t.platforms) ? t.platforms : ['windows'],
    access: t.access,
    priceDisplay: t.price_display || t.priceDisplay || 'FREE',
    price_display: t.price_display || t.priceDisplay || 'FREE',
    viewsDisplay: t.views_display || t.viewsDisplay || `${t.views_count || 0}`,
    views_display: t.views_display || t.viewsDisplay || `${t.views_count || 0}`,
    viewsCount: Number(t.views_count || t.viewsCount || 0),
    views_count: Number(t.views_count || t.viewsCount || 0),
    rating: Number(t.rating || 5.0),
    reviewsCount: Number(t.reviews_count || t.reviewsCount || 0),
    reviews_count: Number(t.reviews_count || t.reviewsCount || 0),
    status: t.status || 'Actualizado',
    description: t.description || '',
    features: Array.isArray(t.features) ? t.features : [],
    downloadUrl: t.download_url || t.downloadUrl || t.download_link || t.downloadLink || t.url || '',
    download_url: t.download_url || t.downloadUrl || t.download_link || t.downloadLink || t.url || '',
    downloadLink: t.download_link || t.downloadLink || t.download_url || t.downloadUrl || t.url || '',
    url: t.url || t.download_link || t.downloadLink || t.download_url || t.downloadUrl || '',
    image_url: imageUrl,
    image_src: imageUrl,
    imageSrc: imageUrl
  };
}

export async function GET() {
  try {
    const { data: dbTools, error } = await supabase
      .from('tools')
      .select('*')
      .order('views_count', { ascending: false });

    if (error) {
      // Reintentar sin orden si views_count no estuviera indexado
      const fallback = await supabase.from('tools').select('*');
      if (fallback.error) {
        throw new Error(fallback.error.message);
      }
      return NextResponse.json({ tools: (fallback.data || []).map(formatTool) });
    }

    return NextResponse.json({ tools: (dbTools || []).map(formatTool) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, tools: [] }, { status: 500 });
  }
}
