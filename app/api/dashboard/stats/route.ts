import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Traemos el perfil público para obtener el username
    const { data: publicUser } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();

    const username = publicUser?.username;

    let query = supabase.from('projects').select('id, title, views, copies, likes, createdAt');
    
    if (username) {
      query = query.or(`authorId.eq.${user.id},authorId.eq.${username}`);
    } else {
      query = query.eq('authorId', user.id);
    }

    const { data: projects, error: projectsError } = await query;

    if (projectsError) {
      throw projectsError;
    }

    // Calcular sumas
    let totalViews = 0;
    let totalCopies = 0;
    let totalLikes = 0;

    const chartData = (projects || []).map(p => {
      totalViews += p.views || 0;
      totalCopies += p.copies || 0;
      totalLikes += p.likes || 0;
      
      return {
        name: p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title,
        views: p.views || 0,
        copies: p.copies || 0,
        likes: p.likes || 0,
      };
    });

    // BADGE ENGINE
    // Traer insignias actuales
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_name')
      .eq('user_id', user.id);
    
    const unlockedBadges = (existingBadges || []).map(b => b.badge_name);
    const newBadgesToInsert: any[] = [];

    if (totalViews >= 100000 && !unlockedBadges.includes('100k_views')) {
      newBadgesToInsert.push({ user_id: user.id, badge_name: '100k_views' });
      unlockedBadges.push('100k_views');
    }
    if (totalViews >= 1000000 && !unlockedBadges.includes('1m_views')) {
      newBadgesToInsert.push({ user_id: user.id, badge_name: '1m_views' });
      unlockedBadges.push('1m_views');
    }
    if (totalViews >= 10000000 && !unlockedBadges.includes('10m_views')) {
      newBadgesToInsert.push({ user_id: user.id, badge_name: '10m_views' });
      unlockedBadges.push('10m_views');
    }

    if (newBadgesToInsert.length > 0) {
      await supabase.from('user_badges').insert(newBadgesToInsert);
    }

    return NextResponse.json({
      success: true,
      totals: {
        views: totalViews,
        copies: totalCopies,
        likes: totalLikes,
      },
      badges: unlockedBadges,
      chartData
    });

  } catch (error: any) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
