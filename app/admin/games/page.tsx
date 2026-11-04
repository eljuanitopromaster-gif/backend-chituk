'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth, supabase } from '../../components/AuthProvider';

export interface GameItem {
  id: string;
  title: string;
  name?: string;
  description: string;
  cover_image_url?: string | null;
  image?: string | null;
  place_id?: string | null;
  placeId?: string | null;
  scripts_count?: number;
  created_at?: string;
  updated_at?: string;
}

export default function AdminGamesPage() {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields (title, description, cover_image_url, place_id)
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverImageUrl, setFormCoverImageUrl] = useState('');
  const [formPlaceId, setFormPlaceId] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage = user && ['owner', 'admin', 'creator', 'mod'].includes(user.role);

  const fetchGames = async () => {
    if (authLoading || !user || !canManage) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'X-User-Id': user.id
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/admin/games', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener los juegos');

      setGames(data.games || []);
    } catch (err: any) {
      console.error('Error fetching admin games:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al cargar los juegos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canManage) {
      fetchGames();
    }
  }, [user, authLoading, canManage]);

  const openCreateModal = () => {
    setEditingGame(null);
    setFormTitle('');
    setFormDescription('');
    setFormCoverImageUrl('');
    setFormPlaceId('');
    setImagePreview(null);
    setIsModalOpen(true);
    setFeedbackMsg(null);
  };

  const openEditModal = (game: GameItem) => {
    setEditingGame(game);
    setFormTitle(game.title || game.name || '');
    setFormDescription(game.description || '');
    const img = game.cover_image_url || game.image || '';
    setFormCoverImageUrl(img);
    setFormPlaceId(game.place_id || game.placeId || '');
    setImagePreview(img || null);
    setIsModalOpen(true);
    setFeedbackMsg(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGame(null);
    setIsSubmitting(false);
    setImagePreview(null);
  };

  // Manejo de carga de imagen local (File -> DataURL Base64)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormCoverImageUrl(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canManage) return;

    if (!formTitle.trim()) {
      alert('Por favor ingresa el título del juego.');
      return;
    }

    if (!formDescription.trim()) {
      alert('Por favor ingresa una breve descripción del juego.');
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Id': user.id
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const imgVal = formCoverImageUrl.trim() || null;
      const payload = {
        id: editingGame ? editingGame.id : undefined,
        title: formTitle.trim(),
        description: formDescription.trim(),
        cover_image_url: imgVal,
        image: imgVal,
        place_id: formPlaceId.trim() || null
      };

      const endpoint = '/api/admin/games';
      const method = editingGame ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el juego');

      setFeedbackMsg({
        type: 'success',
        text: editingGame
          ? `¡Juego "${payload.title}" actualizado con éxito!`
          : `¡Juego "${payload.title}" agregado al catálogo con éxito!`
      });

      closeModal();
      await fetchGames();
    } catch (err: any) {
      console.error('Error saving game:', err);
      alert(err.message || 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGame = async (gameId: string, gameTitle: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${gameTitle}" del catálogo? Los scripts asociados en 'projects' perderán su vinculación pero no serán borrados.`)) {
      return;
    }

    setDeletingId(gameId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'X-User-Id': user.id
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/admin/games?id=${encodeURIComponent(gameId)}`, {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');

      setFeedbackMsg({
        type: 'success',
        text: `Juego "${gameTitle}" eliminado del catálogo.`
      });

      setGames(prev => prev.filter(g => g.id !== gameId));
    } catch (err: any) {
      console.error('Error deleting game:', err);
      alert(err.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const q = search.toLowerCase();
      const matchTitle = (g.title || g.name || '').toLowerCase().includes(q);
      const matchDesc = (g.description || '').toLowerCase().includes(q);
      const matchPlace = (g.place_id || g.placeId || '').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchPlace;
    });
  }, [games, search]);

  const totalScriptsLinked = useMemo(() => {
    return games.reduce((acc, g) => acc + (g.scripts_count || 0), 0);
  }, [games]);

  const gamesWithScripts = useMemo(() => {
    return games.filter(g => (g.scripts_count || 0) > 0).length;
  }, [games]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted">Verificando credenciales de administración...</p>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-8 bg-card border border-danger/30 rounded-2xl text-center max-w-xl mx-auto my-12">
        <h2 className="text-xl font-bold text-danger mb-2">Acceso Restringido</h2>
        <p className="text-muted text-sm">
          Esta sección está reservada exclusivamente para Administradores de Chituk.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Catálogo Oficial</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <span>🎮</span> Gestión de Juegos
          </h1>
          <p className="text-sm text-muted">
            Administra los títulos en la tabla <code className="text-accent font-mono text-xs">games</code> de Supabase para clasificar scripts de <code className="text-accent font-mono text-xs">projects</code>.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-contrast font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Juego
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs opacity-80 hover:opacity-100 uppercase font-bold ml-4 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-card border border-border-theme rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold text-xl">
            🕹️
          </div>
          <div>
            <p className="text-xs text-muted uppercase font-semibold">Juegos Registrados</p>
            <p className="text-2xl font-black text-foreground">{games.length}</p>
          </div>
        </div>

        <div className="p-4 bg-card border border-border-theme rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-success/15 text-success flex items-center justify-center font-bold text-xl">
            📈
          </div>
          <div>
            <p className="text-xs text-muted uppercase font-semibold">Con Scripts Activos</p>
            <p className="text-2xl font-black text-foreground">{gamesWithScripts}</p>
          </div>
        </div>

        <div className="p-4 bg-card border border-border-theme rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-info/15 text-info flex items-center justify-center font-bold text-xl">
            📜
          </div>
          <div>
            <p className="text-xs text-muted uppercase font-semibold">Scripts Vinculados</p>
            <p className="text-2xl font-black text-foreground">{totalScriptsLinked}</p>
          </div>
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card border border-border-theme p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, Place ID o descripción..."
            className="w-full bg-base border border-border-theme text-foreground placeholder:text-muted rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-base border-border-theme text-muted hover:text-foreground'
            }`}
            title="Vista de Tabla"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="hidden md:inline">Tabla</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-base border-border-theme text-muted hover:text-foreground'
            }`}
            title="Vista de Cuadrícula"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden md:inline">Tarjetas</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-muted text-sm flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando juegos del catálogo...</span>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border-theme rounded-2xl text-muted text-sm space-y-3">
          <p className="text-2xl">🔍</p>
          <p className="font-semibold text-foreground">No se encontraron juegos</p>
          <p className="text-xs max-w-sm mx-auto">
            {search ? `No hay coincidencias para "${search}".` : 'Aún no se han agregado juegos al catálogo.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="px-3 py-1.5 rounded-xl bg-base border border-border-theme text-xs font-semibold text-accent hover:border-accent cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-card border border-border-theme rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-base border-b border-border-theme text-xs font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-3.5 px-4">Juego (title)</th>
                  <th className="py-3.5 px-4">Place ID</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Descripción (description)</th>
                  <th className="py-3.5 px-4 text-center">Scripts (projects)</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme">
                {filteredGames.map(game => {
                  const cover = game.cover_image_url || game.image;
                  return (
                    <tr key={game.id} className="hover:bg-card-hover/60 transition-colors group">
                      {/* Game Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-base border border-border-theme overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                            {cover ? (
                              <img
                                src={cover}
                                alt={game.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-xl">🎮</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-foreground group-hover:text-accent transition-colors">
                              {game.title}
                            </div>
                            <span className="text-[10px] text-muted font-mono">
                              ID: {game.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Place ID */}
                      <td className="py-3 px-4">
                        {game.place_id ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-md bg-base border border-border-theme text-foreground">
                            {game.place_id}
                          </span>
                        ) : (
                          <span className="text-xs text-muted italic">No asignado</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 hidden md:table-cell max-w-xs">
                        <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                          {game.description || 'Sin descripción'}
                        </p>
                      </td>

                      {/* Associated scripts count */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          (game.scripts_count || 0) > 0
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : 'bg-base text-muted border border-border-theme'
                        }`}>
                          {game.scripts_count || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(game)}
                            className="px-3 py-1.5 rounded-lg bg-base border border-border-theme text-xs font-semibold text-foreground hover:border-accent hover:text-accent transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            disabled={deletingId === game.id}
                            onClick={() => handleDeleteGame(game.id, game.title)}
                            className="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/30 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === game.id ? '...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGames.map(game => {
            const cover = game.cover_image_url || game.image;
            return (
              <div
                key={game.id}
                className="bg-card border border-border-theme rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm hover:border-accent/40 transition-all group"
              >
                <div>
                  <div className="aspect-video w-full rounded-xl bg-base border border-border-theme overflow-hidden relative mb-3 flex items-center justify-center shadow-inner">
                    {cover ? (
                      <img
                        src={cover}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-3xl">🎮</span>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-card/90 text-accent border border-accent/30 shadow-md backdrop-blur-md">
                        {game.scripts_count || 0} scripts
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-foreground group-hover:text-accent transition-colors line-clamp-1 mb-1">
                    {game.title}
                  </h3>

                  {game.place_id && (
                    <p className="text-[11px] text-muted font-mono mb-2">
                      Place ID: {game.place_id}
                    </p>
                  )}

                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {game.description || 'Sin descripción disponible.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-border-theme flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-muted truncate">
                    ID: {game.id.slice(0, 8)}...
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(game)}
                      className="px-2.5 py-1 bg-base border border-border-theme text-foreground rounded-lg text-xs font-semibold hover:border-accent hover:text-accent transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      disabled={deletingId === game.id}
                      onClick={() => handleDeleteGame(game.id, game.title)}
                      className="px-2.5 py-1 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs font-semibold hover:bg-danger/20 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === game.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT GAME MODAL (title, description, cover_image_url) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border-theme rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-theme flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {editingGame ? `Editar Juego "${editingGame.title}"` : 'Agregar Nuevo Juego al Catálogo'}
                </h2>
                <p className="text-xs text-muted">
                  Configura los detalles del juego (title, description, cover_image_url).
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-muted hover:text-foreground p-2 rounded-lg hover:bg-base text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGame} className="p-6 overflow-y-auto flex flex-col gap-4 flex-1">
              {/* 1. Título del Juego (title) */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Título del Juego (title) *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ej. Blox Fruits, Da Hood, Blade Ball..."
                  className="w-full bg-base border border-border-theme text-foreground placeholder:text-muted rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* 2. Descripción del Juego (description) */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Descripción (description) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Breve resumen de la temática del juego, mecánicas principales o detalles..."
                  className="w-full bg-base border border-border-theme text-foreground placeholder:text-muted rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent resize-y"
                />
              </div>

              {/* 3. URL de Portada (cover_image_url) */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>URL de Portada (cover_image_url)</span>
                  <span className="text-[10px] text-accent lowercase">URL o subida de archivo</span>
                </label>

                {/* Input URL direct */}
                <input
                  type="text"
                  value={formCoverImageUrl}
                  onChange={e => {
                    setFormCoverImageUrl(e.target.value);
                    setImagePreview(e.target.value || null);
                  }}
                  placeholder="https://... o /games/bloxfruits.png"
                  className="w-full bg-base border border-border-theme text-foreground placeholder:text-muted rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-accent mb-2"
                />

                {/* Drag and Drop Box */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingImage(false); }}
                  onDrop={handleImageDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDraggingImage
                      ? 'border-accent bg-accent/10'
                      : 'border-border-theme hover:border-accent/50 bg-base/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processImageFile(file);
                    }}
                  />

                  {imagePreview ? (
                    <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border border-border-theme mx-auto shadow-md">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormCoverImageUrl('');
                          setImagePreview(null);
                        }}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 text-[10px] cursor-pointer"
                        title="Quitar imagen"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-2xl">🖼️</span>
                      <p className="text-xs text-foreground font-semibold">
                        Haz clic para subir o arrastra una imagen aquí
                      </p>
                      <p className="text-[10px] text-muted">
                        Formatos soportados: PNG, JPG, WEBP (Máx. 5MB)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* 4. Roblox Place ID (opcional) */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Place ID de Roblox (Opcional)
                </label>
                <input
                  type="text"
                  value={formPlaceId}
                  onChange={e => setFormPlaceId(e.target.value)}
                  placeholder="Ej. 2753915549"
                  className="w-full bg-base border border-border-theme text-foreground placeholder:text-muted rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent font-mono"
                />
                <p className="text-[11px] text-muted mt-1">
                  ID numérico de la experiencia en Roblox para autocompletado en scripts.
                </p>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-border-theme flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-border-theme text-foreground text-sm font-semibold hover:bg-base transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-accent text-accent-contrast font-bold text-sm hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-accent-contrast border-t-transparent rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingGame ? 'Actualizar Juego' : 'Guardar Juego'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
