import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/app/lib/server/auth';
import { supabaseAdmin as supabase } from '@/app/lib/server/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const auth = await requireActiveUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.user.id;

    // 1. Obtener los favoritos del usuario
    const { data: favs, error: favsError } = await supabase
      .from('user_favorites')
      .select('project_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (favsError) {
      return NextResponse.json({ error: favsError.message }, { status: 500 });
    }

    if (!favs || favs.length === 0) {
      return NextResponse.json([]);
    }

    const projectIds = favs.map(f => f.project_id);

    // 2. Obtener los proyectos correspondientes
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds);

    if (projectsError) {
      return NextResponse.json({ error: projectsError.message }, { status: 500 });
    }

    // 3. Obtener nombres de autores
    const authorIds = [...new Set(projects.map(p => p.authorId).filter(Boolean))];
    const userMap: Record<string, string> = {};

    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from('users')
        .select('id, username')
        .in('id', authorIds);

      if (authors) {
        authors.forEach(a => {
          userMap[a.id] = a.username;
        });
      }
    }

    // Ordenar los proyectos en el orden en que fueron guardados en favoritos
    const orderedProjects = favs.map(f => {
      const proj = projects.find(p => p.id === f.project_id);
      if (!proj) return null;

      const descLines = (proj.description || '').split('\n');
      const detectedGame = descLines.length > 1 && descLines[0].trim() ? descLines[0].trim() : (proj.game || 'Universal');
      const cleanDesc = descLines.length > 2 && descLines[1].trim() === '' ? descLines.slice(2).join('\n') : proj.description;

      return {
        ...proj,
        game: detectedGame,
        description: cleanDesc,
        favoritedAt: f.created_at,
        authorName: userMap[proj.authorId] || proj.authorId || 'Comunidad'
      };
    }).filter(Boolean);

    return NextResponse.json(orderedProjects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
