'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, supabase } from '../components/AuthProvider';

interface FavoriteScript {
  id: string;
  title: string;
  game?: string;
  description?: string;
  script: string;
  views?: number;
  likes?: number;
  favorites?: number;
  authorName?: string;
  favoritedAt?: string;
  image?: string;
}

export default function FavoritosPage() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'X-User-Id': user.id
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/user/favorites', {
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setFavorites(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al cargar favoritos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleCopy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      fetch(`/api/scripts/${id}/copy`, { method: 'POST' }).catch(() => {});
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFavorite = async (scriptId: string) => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Id': user.id
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Optimistic update
      setFavorites(prev => prev.filter(f => f.id !== scriptId));

      await fetch(`/api/scripts/${scriptId}/favorite`, {
        method: 'POST',
        headers
      });
    } catch (e) {
      console.error("Error removing favorite:", e);
      fetchFavorites();
    }
  };

  const filteredFavorites = favorites.filter(fav => {
    const q = search.toLowerCase();
    return (
      fav.title.toLowerCase().includes(q) ||
      (fav.game || '').toLowerCase().includes(q) ||
      (fav.authorName || '').toLowerCase().includes(q)
    );
  });

  if (authLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted">Cargando tus favoritos...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-card border border-border-theme rounded-2xl text-center shadow-2xl flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent border border-accent/30 flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Inicia Sesión para Guardar Favoritos</h2>
        <p className="text-sm text-muted leading-relaxed">
          Guarda tus scripts preferidos para acceder a ellos rápidamente en cualquier momento y copiar su código con un solo clic.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="mt-2 px-6 py-3 bg-accent text-accent-contrast font-bold rounded-xl hover:opacity-90 transition-opacity shadow-md cursor-pointer"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-4 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Colección Personal</span>
            <span className="text-xs text-muted">• {favorites.length} guardados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mis Scripts Favoritos</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Accede rápidamente a tus scripts guardados, copia su código o explóralos en la comunidad.
          </p>
        </div>

        {/* Buscador de favoritos */}
        {favorites.length > 0 && (
          <div className="w-full md:w-72">
            <div className="relative">
              <svg className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar en mis favoritos..."
                className="w-full bg-card border border-border-theme rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="p-12 sm:p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted">Cargando colección...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="p-6 sm:p-12 text-center bg-card border border-border-theme rounded-2xl flex flex-col items-center gap-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-base border border-border-theme flex items-center justify-center text-muted">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">Aún no tienes favoritos guardados</h3>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Cuando encuentres un script útil en la biblioteca, dale clic al ícono de Favoritos para tenerlo guardado aquí.
          </p>
          <Link
            href="/scripts"
            className="mt-2 px-5 py-2.5 bg-accent text-accent-contrast font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-md"
          >
            Explorar Scripts
          </Link>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="p-12 text-center text-muted text-sm">
          No se encontraron favoritos que coincidan con &ldquo;{search}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredFavorites.map(script => (
            <div
              key={script.id}
              className="bg-card border border-border-theme hover:border-accent/50 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between gap-4 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col gap-3">
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                      {script.game || 'Universal'}
                    </span>
                    <Link
                      href={`/scripts/${script.id}`}
                      className="text-base font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1 mt-0.5"
                    >
                      {script.title}
                    </Link>
                    <span className="text-xs text-muted mt-0.5">
                      Por: <span className="text-foreground font-medium">{script.authorName}</span>
                    </span>
                  </div>

                  {/* Botón para remover de favoritos */}
                  <button
                    onClick={() => handleRemoveFavorite(script.id)}
                    className="text-yellow-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-base border border-transparent hover:border-border-theme transition-colors cursor-pointer shrink-0"
                    title="Quitar de favoritos"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>

                {/* Descripción */}
                <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                  {script.description || 'Sin descripción disponible.'}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-3 border-t border-border-theme">
                <button
                  onClick={() => handleCopy(script.id, script.script)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    copiedId === script.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-accent text-accent-contrast hover:opacity-90'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {copiedId === script.id ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    )}
                  </svg>
                  {copiedId === script.id ? '¡Copiado!' : 'Copiar Script'}
                </button>

                <Link
                  href={`/scripts/${script.id}`}
                  className="p-2 bg-base hover:bg-card-hover border border-border-theme rounded-xl text-muted hover:text-foreground transition-colors shrink-0"
                  title="Ver detalles completos"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
