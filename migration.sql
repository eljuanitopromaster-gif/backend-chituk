-- Agrega la columna is_verified y email a la tabla users si no existen
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- Crea la tabla de insignias (badges) para la gamificación del Dashboard
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    badge_name TEXT NOT NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_name)
);

-- Asegura que los usuarios puedan ser eliminados de la cola (por si necesitamos cascada en el futuro, pero por ahora solo esto)
-- No se requieren cambios en projects para eliminar filas.

-- Columnas de perfil de usuario (avatar, descripción / bio, y fecha de último cambio de username)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMP WITH TIME ZONE;

-- Columna opcional para portada / imagen de scripts
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image TEXT;

-- Tabla de comentarios para scripts
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de likes en comentarios (para rastrear qué usuarios dieron like a qué opiniones)
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Tabla para Ejecutores y Herramientas
CREATE TABLE IF NOT EXISTS public.tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'executors',
    platforms TEXT[] NOT NULL DEFAULT '{"windows"}',
    access TEXT NOT NULL DEFAULT 'free',
    price_display TEXT DEFAULT 'FREE',
    views_display TEXT DEFAULT '0',
    views_count INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Actualizado',
    description TEXT NOT NULL,
    features TEXT[] DEFAULT '{}',
    download_url TEXT NOT NULL,
    image_src TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


