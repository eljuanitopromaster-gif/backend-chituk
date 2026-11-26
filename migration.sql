-- ============================================================================
-- Chituk — esquema `public` de Supabase
-- Idempotente: puede ejecutarse varias veces sobre una base nueva o existente.
-- No contiene datos (el catálogo de juegos vive en public.games).
-- ============================================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'script_status'
    ) THEN
        CREATE TYPE public.script_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Usuarios (perfiles y roles). `id` es TEXT; auth.uid() es UUID.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT,
    normalized TEXT,
    "passwordHash" TEXT, -- legado: ningún código la usa
    role TEXT,
    bio TEXT,
    avatar TEXT,
    verified BOOLEAN,
    banned BOOLEAN,
    "banReason" TEXT,
    "createdAt" TEXT,
    following JSONB,
    "savedProjects" JSONB,
    "unlockedScripts" JSONB,
    theme TEXT
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS theme TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ----------------------------------------------------------------------------
-- Catálogo de juegos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS place_id TEXT;

-- ----------------------------------------------------------------------------
-- Scripts publicados (NO existe la tabla public.scripts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    script TEXT,
    "scriptMode" TEXT,
    kind TEXT,
    "authorId" TEXT, -- UUID de Supabase o username en registros legacy
    "youtubeUrl" TEXT,
    "destinationUrl" TEXT,
    image TEXT,
    views INTEGER DEFAULT 0,
    unlocks INTEGER DEFAULT 0,
    "createdAt" TEXT,
    likes JSONB DEFAULT '[]'::jsonb,
    shares INTEGER DEFAULT 0,
    "viewedBy" JSONB DEFAULT '[]'::jsonb,
    "unlockedBy" JSONB DEFAULT '[]'::jsonb,
    language TEXT
);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status public.script_status DEFAULT 'pending';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS copies INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_mobile_friendly BOOLEAN DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS game_id UUID;

-- game_id debe ser UUID con FK hacia games (normaliza vacíos antes del cast)
DO $$ BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'game_id') = 'text' THEN
        UPDATE public.projects SET game_id = NULL WHERE btrim(game_id) = '';
        ALTER TABLE public.projects ALTER COLUMN game_id TYPE uuid USING game_id::uuid;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'projects_game_id_fkey' AND conrelid = 'public.projects'::regclass
    ) THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_game_id_fkey
            FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_game_id ON public.projects(game_id);

-- ----------------------------------------------------------------------------
-- Ejecutores y herramientas (`id` es un slug de texto)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'executors',
    platforms TEXT[] NOT NULL DEFAULT '{windows}',
    access TEXT NOT NULL DEFAULT 'free',
    price_display TEXT DEFAULT 'FREE',
    views_display TEXT DEFAULT '0',
    views_count BIGINT DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Actualizado',
    description TEXT NOT NULL,
    features TEXT[] DEFAULT '{}',
    download_url TEXT NOT NULL,
    image_src TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS image_src TEXT;
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ----------------------------------------------------------------------------
-- Tablas relacionales
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_likes (
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS public.user_favorites (
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SEGURIDAD: RLS y permisos de cliente
-- Las rutas /api usan service_role, que ignora RLS.
-- ============================================================================
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    public.users, public.projects, public.games, public.tools, public.comments,
    public.comment_likes, public.user_badges, public.user_likes,
    public.user_favorites, public.notifications
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.games, public.tools TO anon, authenticated;
GRANT SELECT ON public.users, public.user_likes, public.user_favorites TO authenticated;
GRANT INSERT (id, username, normalized, role, is_verified, banned, "createdAt") ON public.users TO authenticated;
-- Única columna editable desde el cliente: role y banned quedan fuera
GRANT UPDATE (theme) ON public.users TO authenticated;

-- games: solo lectura pública
DROP POLICY IF EXISTS "Permitir administracion completa de juegos" ON public.games;
DROP POLICY IF EXISTS "Permitir gestion a admin/mod" ON public.games;
DROP POLICY IF EXISTS "Permitir lectura publica" ON public.games;
DROP POLICY IF EXISTS "Permitir lectura publica de juegos" ON public.games;
CREATE POLICY "Permitir lectura publica de juegos" ON public.games
    FOR SELECT TO anon, authenticated USING (true);

-- tools: solo lectura pública
DROP POLICY IF EXISTS "Permitir gestion completa a administradores y backend" ON public.tools;
DROP POLICY IF EXISTS "Gestion de herramientas por admin/mod" ON public.tools;
DROP POLICY IF EXISTS "Permitir lectura publica" ON public.tools;
DROP POLICY IF EXISTS "Lectura publica de herramientas" ON public.tools;
CREATE POLICY "Lectura publica de herramientas" ON public.tools
    FOR SELECT TO anon, authenticated USING (true);

-- users: cada quien solo su fila
DROP POLICY IF EXISTS "Usuario lee su perfil" ON public.users;
CREATE POLICY "Usuario lee su perfil" ON public.users
    FOR SELECT TO authenticated
    USING (id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Usuario crea su perfil basico" ON public.users;
CREATE POLICY "Usuario crea su perfil basico" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (
        id::text = auth.uid()::text
        AND role = 'user'
        AND COALESCE(banned, false) = false
        AND COALESCE(is_verified, false) = false
        AND normalized = lower(username)
        AND username !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    );

DROP POLICY IF EXISTS "Usuario actualiza su tema" ON public.users;
CREATE POLICY "Usuario actualiza su tema" ON public.users
    FOR UPDATE TO authenticated
    USING (id::text = auth.uid()::text)
    WITH CHECK (id::text = auth.uid()::text);

-- likes y favoritos: el cliente solo lee los propios
DROP POLICY IF EXISTS "Usuario lee sus likes" ON public.user_likes;
CREATE POLICY "Usuario lee sus likes" ON public.user_likes
    FOR SELECT TO authenticated
    USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Usuario lee sus favoritos" ON public.user_favorites;
CREATE POLICY "Usuario lee sus favoritos" ON public.user_favorites
    FOR SELECT TO authenticated
    USING (user_id::text = auth.uid()::text);

-- projects: sin permiso DELETE para clientes, esta política queda como segunda barrera
DROP POLICY IF EXISTS "Permitir eliminacion de scripts a autor o staff" ON public.projects;
CREATE POLICY "Permitir eliminacion de scripts a autor o staff" ON public.projects
    FOR DELETE TO authenticated
    USING (
        auth.uid()::text = "authorId"::text
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id::text = auth.uid()::text
              AND lower(u.role) IN ('admin', 'moderator', 'mod', 'owner', 'creator')
        )
    );

-- comments, comment_likes, user_badges y notifications: sin acceso de cliente.

-- ============================================================================
-- STORAGE: bucket público de portadas (las subidas se hacen con service_role)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Lectura publica de covers" ON storage.objects;
CREATE POLICY "Lectura publica de covers" ON storage.objects
    FOR SELECT USING (bucket_id = 'covers');

COMMIT;
