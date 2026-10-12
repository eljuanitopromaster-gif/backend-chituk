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

    // Traemos el perfil público para obtener detalles
    const { data: publicUser } = await supabase
      .from('users')
      .select('username, is_verified, avatar, bio, theme')
      .eq('id', user.id)
      .maybeSingle();

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

    const projectsCount = (projects || []).length;

    // BADGE ENGINE - Traer insignias actuales
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_name')
      .eq('user_id', user.id);
    
    const unlockedBadges: string[] = (existingBadges || []).map(b => b.badge_name);
    const newBadgesToInsert: any[] = [];

    const badgeRules = [
      { id: 'first_script', condition: projectsCount >= 1 },
      { id: '5_scripts', condition: projectsCount >= 5 },
      { id: '1k_views', condition: totalViews >= 1000 },
      { id: '10k_views', condition: totalViews >= 10000 },
      { id: '100k_views', condition: totalViews >= 100000 },
      { id: '1m_views', condition: totalViews >= 1000000 },
      { id: '10m_views', condition: totalViews >= 10000000 },
      { id: 'first_like', condition: totalLikes >= 1 },
      { id: '50_likes', condition: totalLikes >= 50 },
      { id: '100_copies', condition: totalCopies >= 100 },
      { id: 'verified_badge', condition: Boolean(publicUser?.is_verified) },
      { id: 'customizer', condition: Boolean(publicUser?.avatar || publicUser?.bio || (publicUser?.theme && publicUser.theme !== 'predeterminado')) },
    ];

    for (const rule of badgeRules) {
      if (rule.condition && !unlockedBadges.includes(rule.id)) {
        newBadgesToInsert.push({ user_id: user.id, badge_name: rule.id });
        unlockedBadges.push(rule.id);
      }
    }

    if (newBadgesToInsert.length > 0) {
      try {
        await supabase.from('user_badges').insert(newBadgesToInsert);
      } catch (badgeErr) {
        console.warn("Could not persist user badge:", badgeErr);
      }
    }

    return NextResponse.json({
      success: true,
      totals: {
        views: totalViews,
        copies: totalCopies,
        likes: totalLikes,
        projectsCount
      },
      badges: unlockedBadges,
      chartData
    });

  } catch (error: any) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
