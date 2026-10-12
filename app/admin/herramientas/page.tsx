'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth, supabase } from '../../components/AuthProvider';

export interface ToolItem {
  id: string;
  name: string;
  category: 'executors' | 'externals';
  platforms: ('windows' | 'android' | 'mac' | 'ios')[];
  access: 'free' | 'paid';
  priceDisplay: string;
  viewsDisplay: string;
  viewsCount: number;
  rating: number;
  reviewsCount: number;
  status: 'Actualizado' | 'Funcionando' | 'Beta' | 'Mantenimiento' | 'Parcheado';
  description: string;
  features: string[];
  downloadUrl: string;
  imageSrc?: string;
  createdAt?: string;
}

const AVAILABLE_PLATFORMS: { id: 'windows' | 'android' | 'mac' | 'ios'; label: string; icon: string }[] = [
  { id: 'windows', label: 'Windows', icon: '🪟' },
  { id: 'android', label: 'Android', icon: '🤖' },
  { id: 'mac', label: 'Mac / macOS', icon: '🍎' },
  { id: 'ios', label: 'iOS / iPhone', icon: '📱' },
];

const AVAILABLE_STATUSES = [
  'Actualizado',
  'Funcionando',
  'Beta',
  'Mantenimiento',
  'Parcheado'
];

export default function AdminHerramientasPage() {
  const { user, loading: authLoading } = useAuth();
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'executors' | 'externals'>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'executors' | 'externals'>('executors');
  const [formPlatforms, setFormPlatforms] = useState<('windows' | 'android' | 'mac' | 'ios')[]>(['windows']);
  const [formAccess, setFormAccess] = useState<'free' | 'paid'>('free');
  const [formPriceDisplay, setFormPriceDisplay] = useState('FREE');
  const [formStatus, setFormStatus] = useState<ToolItem['status']>('Actualizado');
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formDownloadUrl, setFormDownloadUrl] = useState('');
  const [formImageSrc, setFormImageSrc] = useState('');
  const [formViewsDisplay, setFormViewsDisplay] = useState('50.0K');
  const [formRating, setFormRating] = useState('4.8');

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage = user && ['owner', 'admin', 'creator'].includes(user.role);

  const fetchTools = async () => {
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

      const res = await fetch('/api/admin/tools', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener herramientas');

      setTools(data.tools || []);
    } catch (err: any) {
      console.error('Error fetching admin tools:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al cargar herramientas' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canManage) {
      fetchTools();
    }
  }, [user, authLoading, canManage]);

  const openCreateModal = () => {
    setEditingTool(null);
    setFormName('');
    setFormCategory('executors');
    setFormPlatforms(['windows']);
    setFormAccess('free');
    setFormPriceDisplay('FREE');
    setFormStatus('Actualizado');
    setFormDescription('');
    setFormFeatures('Inyección rápida\nSin claves tediosas\nSoporte Luau');
    setFormDownloadUrl('');
    setFormImageSrc('');
    setFormViewsDisplay('25.0K');
    setFormRating('4.5');
    setIsModalOpen(true);
    setFeedbackMsg(null);
  };

  const openEditModal = (tool: ToolItem) => {
    setEditingTool(tool);
    setFormName(tool.name);
    setFormCategory(tool.category);
    setFormPlatforms(tool.platforms || ['windows']);
    setFormAccess(tool.access);
    setFormPriceDisplay(tool.priceDisplay || 'FREE');
    setFormStatus(tool.status || 'Actualizado');
    setFormDescription(tool.description || '');
    setFormFeatures((tool.features || []).join('\n'));
    setFormDownloadUrl(tool.downloadUrl || '');
    setFormImageSrc(tool.imageSrc || '');
    setFormViewsDisplay(tool.viewsDisplay || '25.0K');
    setFormRating(String(tool.rating || 4.5));
    setIsModalOpen(true);
    setFeedbackMsg(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
    setIsSubmitting(false);
  };

  const togglePlatform = (p: 'windows' | 'android' | 'mac' | 'ios') => {
    if (formPlatforms.includes(p)) {
      if (formPlatforms.length === 1) return; // Keep at least one platform
      setFormPlatforms(formPlatforms.filter(item => item !== p));
    } else {
      setFormPlatforms([...formPlatforms, p]);
    }
  };

  const handleSaveTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canManage) return;

    if (!formName.trim()) {
      alert('Por favor ingresa el nombre del programa.');
      return;
    }

    if (!formDownloadUrl.trim()) {
      alert('Por favor ingresa la URL de descarga o sitio web.');
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

      const payload = {
        id: editingTool ? editingTool.id : undefined,
        name: formName.trim(),
        category: formCategory,
        platforms: formPlatforms,
        access: formAccess,
        priceDisplay: formPriceDisplay.trim() || 'FREE',
        status: formStatus,
        description: formDescription.trim(),
        features: formFeatures.split('\n').map(s => s.trim()).filter(Boolean),
        downloadUrl: formDownloadUrl.trim(),
        imageSrc: formImageSrc.trim() || undefined,
        viewsDisplay: formViewsDisplay.trim() || '25.0K',
        rating: parseFloat(formRating) || 4.5
      };

      const endpoint = '/api/admin/tools';
      const method = editingTool ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la herramienta');

      setFeedbackMsg({
        type: 'success',
        text: editingTool ? `¡"${payload.name}" actualizada con éxito!` : `¡"${payload.name}" agregada con éxito!`
      });

      closeModal();
      await fetchTools();
    } catch (err: any) {
      console.error('Error saving tool:', err);
      alert(err.message || 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTool = async (toolId: string, toolName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente "${toolName}"?`)) {
      return;
    }

    setDeletingId(toolId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'X-User-Id': user.id
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/admin/tools?id=${encodeURIComponent(toolId)}`, {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');

      setFeedbackMsg({
        type: 'success',
        text: `Herramienta "${toolName}" eliminada correctamente.`
      });

      setTools(prev => prev.filter(t => t.id !== toolId));
    } catch (err: any) {
      console.error('Error deleting tool:', err);
      alert(err.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.platforms || []).some(p => p.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [tools, search, categoryFilter]);

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
      <div className="p-8 bg-card border border-red-500/30 rounded-2xl text-center max-w-xl mx-auto my-12">
        <h2 className="text-xl font-bold text-red-400 mb-2">Acceso Restringido</h2>
        <p className="text-muted text-sm">
          Esta sección está reservada exclusivamente para Owners, Creadores y Administradores de Chituk.
        </p>
      </div>
    );
  }

  const executorsCount = tools.filter(t => t.category === 'executors').length;
  const externalsCount = tools.filter(t => t.category === 'externals').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Catálogo Oficial</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Gestión de Ejecutores y Herramientas
          </h1>
          <p className="text-sm text-muted">
            Administra los ejecutores y herramientas externas que se muestran en la sección pública.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-contrast font-bold text-sm rounded-xl hover:opacity-90 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Herramienta
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs opacity-75 hover:opacity-100 uppercase font-bold ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-card border border-border-theme rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold text-xl">
            ⚡
          </div>
          <div>
            <p className="text-xs text-muted uppercase font-semibold">Total en Catálogo</p>
            <p className="text-2xl font-black text-foreground">{tools.length}</p>
          </div>
        </div>

        <div className="p-4 bg-card border border-border-theme rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xl">
            💻
          </div>
          <div>
            <p className="text-xs text-muted uppercase font-semibold">Ejecutores (Executors)</p>
            <p className="text-2xl font-black text-foreground">{executorsCount}</p>
          </div>
        </div>

        <div className="p-4 bg-card border border-border-theme rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xl">
            🛠️
          </div>
          <div>
            <p className="text-xs text-muted uppercase font-semibold">Herramientas Externas</p>
            <p className="text-2xl font-black text-foreground">{externalsCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card border border-border-theme p-4 rounded-2xl">
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
            placeholder="Buscar por nombre, plataforma o descripción..."
            className="w-full bg-base border border-border-theme text-foreground rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              categoryFilter === 'all'
                ? 'bg-accent text-accent-contrast'
                : 'bg-base text-muted hover:text-foreground border border-border-theme'
            }`}
          >
            Todos ({tools.length})
          </button>
          <button
            onClick={() => setCategoryFilter('executors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              categoryFilter === 'executors'
                ? 'bg-accent text-accent-contrast'
                : 'bg-base text-muted hover:text-foreground border border-border-theme'
            }`}
          >
            Ejecutores ({executorsCount})
          </button>
          <button
            onClick={() => setCategoryFilter('externals')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              categoryFilter === 'externals'
                ? 'bg-accent text-accent-contrast'
                : 'bg-base text-muted hover:text-foreground border border-border-theme'
            }`}
          >
            Externos ({externalsCount})
          </button>
        </div>
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted text-sm">Cargando catálogo...</div>
      ) : filteredTools.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border-theme rounded-2xl text-muted text-sm">
          No se encontraron programas con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map(tool => (
            <div
              key={tool.id}
              className="bg-card border border-border-theme rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-accent/40 transition-all group"
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {tool.imageSrc ? (
                      <img
                        src={tool.imageSrc}
                        alt={tool.name}
                        className="w-12 h-12 rounded-xl object-cover border border-border-theme shrink-0 bg-neutral-900"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 text-accent font-black text-lg flex items-center justify-center shrink-0">
                        {tool.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-accent transition-colors flex items-center gap-2">
                        {tool.name}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold uppercase">
                          {tool.status}
                        </span>
                      </h3>
                      <p className="text-xs text-muted capitalize">
                        {tool.category === 'executors' ? 'Ejecutor' : 'Herramienta Externa'} • {tool.priceDisplay}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Platforms Chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(tool.platforms || []).map(p => {
                    const info = AVAILABLE_PLATFORMS.find(ap => ap.id === p);
                    return (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-base border border-border-theme text-foreground"
                      >
                        <span>{info?.icon || '•'}</span>
                        <span className="capitalize">{p}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Description */}
                <p className="text-xs text-muted line-clamp-3 leading-relaxed mb-3">
                  {tool.description}
                </p>

                {/* Features highlights */}
                {tool.features && tool.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tool.features.slice(0, 3).map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-neutral-800/60 rounded text-neutral-300 border border-neutral-700/50"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                    {tool.features.length > 3 && (
                      <span className="text-[10px] text-muted self-center">
                        +{tool.features.length - 3} más
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-border-theme flex items-center justify-between gap-2">
                <a
                  href={tool.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold truncate max-w-[140px]"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visitar Web
                </a>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(tool)}
                    className="px-3 py-1.5 bg-base border border-border-theme text-foreground rounded-lg text-xs font-semibold hover:border-accent hover:text-accent transition-colors cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    disabled={deletingId === tool.id}
                    onClick={() => handleDeleteTool(tool.id, tool.name)}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === tool.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border-theme rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-theme flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {editingTool ? `Editar "${editingTool.name}"` : 'Agregar Nuevo Programa / Ejecutor'}
                </h2>
                <p className="text-xs text-muted">
                  Ingresa todos los detalles relevantes para los usuarios de la comunidad.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-muted hover:text-foreground p-2 rounded-lg hover:bg-base text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTool} className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
              {/* Row 1: Nombre & Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Nombre del Programa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ej. Solara, Delta, Arceus X"
                    className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Categoría *
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as 'executors' | 'externals')}
                    className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="executors">Ejecutores (Executors)</option>
                    <option value="externals">Herramientas Externas (Externals)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Plataformas */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Plataformas Compatibles *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AVAILABLE_PLATFORMS.map(p => {
                    const isSelected = formPlatforms.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent/15 border-accent text-accent shadow-sm'
                            : 'bg-base border-border-theme text-muted hover:text-foreground'
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Estado, Acceso y Precio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Estado Actual
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as ToolItem['status'])}
                    className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  >
                    {AVAILABLE_STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Tipo de Acceso
                  </label>
                  <select
                    value={formAccess}
                    onChange={e => {
                      const val = e.target.value as 'free' | 'paid';
                      setFormAccess(val);
                      if (val === 'free') setFormPriceDisplay('FREE');
                    }}
                    className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="free">Gratuito (Free)</option>
                    <option value="paid">De Pago (Paid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Etiqueta de Precio
                  </label>
                  <input
                    type="text"
                    value={formPriceDisplay}
                    onChange={e => setFormPriceDisplay(e.target.value)}
                    placeholder="FREE o $9.99/mes"
                    className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Row 4: Enlace y Portada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Enlace Oficial de Descarga / Web *
                  </label>
                  <input
                    type="url"
                    required
                    value={formDownloadUrl}
                    onChange={e => setFormDownloadUrl(e.target.value)}
                    placeholder="https://deltaexploits.net/"
                    className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    URL de Portada o Imagen (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formImageSrc}
                    onChange={e => setFormImageSrc(e.target.value)}
                    placeholder="/assets/Executors Tools/Solara.jpg o https://..."
                    className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Row 5: Descripción */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Descripción Detallada *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Explica qué hace este ejecutor o herramienta, compatibilidad y detalles clave..."
                  className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent resize-y"
                ></textarea>
              </div>

              {/* Row 6: Características (Features) */}
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Características Destacadas (Una por línea)
                </label>
                <textarea
                  rows={3}
                  value={formFeatures}
                  onChange={e => setFormFeatures(e.target.value)}
                  placeholder="Inyección en 0.5s&#10;Anti-ban integrado&#10;Soporte Luau full"
                  className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent resize-y font-mono text-xs"
                ></textarea>
              </div>

              {/* Row 7: Vistas y Calificación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Vistas Mostradas
                  </label>
                  <input
                    type="text"
                    value={formViewsDisplay}
                    onChange={e => setFormViewsDisplay(e.target.value)}
                    placeholder="Ej. 136.7K"
                    className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                    Calificación Inicial (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formRating}
                    onChange={e => setFormRating(e.target.value)}
                    className="w-full bg-base border border-border-theme text-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
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
                  {isSubmitting ? 'Guardando...' : (editingTool ? 'Actualizar Herramienta' : 'Publicar Herramienta')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
