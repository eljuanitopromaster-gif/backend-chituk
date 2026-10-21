'use client';

import React, { useState, useRef, useEffect } from 'react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
export interface GameOption {
  id: string | number;
  name: string;
  placeId: string;
  universeId?: string;
  icon: string;
  category: string;
}

export interface ScriptFormState {
  targetType: 'specific' | 'universal';
  gameName: string;
  placeId: string;
  selectedGame: GameOption | null;
  title: string;
  thumbnailUrl: string | null;
  description: string;
  scriptLua: string;
  hasCredits: boolean;
  creditsText: string;
  properties: {
    paid: boolean;
    keySystem: boolean;
    mobileFriendly: boolean;
    openSource: boolean;
  };
  tags: string[];
  links: {
    discord: string;
    youtube: string;
    roblox: string;
    website: string;
  };
}

interface SubmitScriptFormProps {
  initialData?: Partial<ScriptFormState>;
  onSubmit?: (data: ScriptFormState) => Promise<void> | void;
  isSubmitting?: boolean;
  securityWidget?: React.ReactNode;
}

// Lista de juegos populares precargados para el buscador rápido de Roblox
const POPULAR_ROBLOX_GAMES: GameOption[] = [
  { id: '2753915549', name: 'Blox Fruits', placeId: '2753915549', icon: '🍇', category: 'Anime / RPG' },
  { id: '2788229376', name: 'Da Hood', placeId: '2788229376', icon: '👊', category: 'PVP / Ciudad' },
  { id: '13772394625', name: 'Blade Ball', placeId: '13772394625', icon: '⚔️', category: 'Acción / Minijuego' },
  { id: '8737899170', name: 'Pet Simulator 99', placeId: '8737899170', icon: '🐱', category: 'Colección / Granja' },
  { id: '16732694052', name: 'Fisch', placeId: '16732694052', icon: '🎣', category: 'Aventura / Pesca' },
  { id: '6516141723', name: 'Doors [Floor 2]', placeId: '6516141723', icon: '👁️', category: 'Terror / Escape' },
  { id: '286090429', name: 'Arsenal', placeId: '286090429', icon: '🔫', category: 'FPS / Disparos' },
  { id: '17625359962', name: 'Rivals', placeId: '17625359962', icon: '🎯', category: 'FPS Competitivo' },
  { id: '4924922222', name: 'Brookhaven RP', placeId: '4924922222', icon: '🏠', category: 'Roleplay' },
  { id: '92898409', name: 'Adopt Me!', placeId: '92898409', icon: '🐶', category: 'Roleplay / Mascotas' },
  { id: '142823291', name: 'Murder Mystery 2', placeId: '142823291', icon: '🔪', category: 'Supervivencia' },
  { id: '15532962292', name: "Sol's RNG", placeId: '15532962292', icon: '🎲', category: 'RNG / Auras' },
];

const SUGGESTED_TAGS = [
  'Auto Farm',
  'Aimbot',
  'ESP',
  'Teleport',
  'God Mode',
  'Speed Hack',
  'Kill Aura',
  'Infinite Yield',
  'Rayfield UI',
  'Anti-AFK',
];

export default function SubmitScriptForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  securityWidget,
}: SubmitScriptFormProps) {
  // ============================================================================
  // ESTADOS DEL FORMULARIO
  // ============================================================================
  const [targetType, setTargetType] = useState<'specific' | 'universal'>(
    initialData?.targetType || 'specific'
  );
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(
    initialData?.selectedGame || POPULAR_ROBLOX_GAMES[0]
  );
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);

  const [title, setTitle] = useState(initialData?.title || '');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    initialData?.thumbnailUrl || null
  );
  const [isDragging, setIsDragging] = useState(false);

  const [description, setDescription] = useState(initialData?.description || '');
  const [scriptLua, setScriptLua] = useState(initialData?.scriptLua || '');
  const [hasCredits, setHasCredits] = useState(initialData?.hasCredits || false);
  const [creditsText, setCreditsText] = useState(initialData?.creditsText || '');

  const [properties, setProperties] = useState({
    paid: initialData?.properties?.paid ?? false,
    keySystem: initialData?.properties?.keySystem ?? false,
    mobileFriendly: initialData?.properties?.mobileFriendly ?? true,
    openSource: initialData?.properties?.openSource ?? true,
  });

  const [tags, setTags] = useState<string[]>(
    initialData?.tags || ['Auto Farm', 'Undetected']
  );
  const [tagInput, setTagInput] = useState('');

  const [links, setLinks] = useState({
    discord: initialData?.links?.discord || '',
    youtube: initialData?.links?.youtube || '',
    roblox: initialData?.links?.roblox || '',
    website: initialData?.links?.website || '',
  });

  // Feedback UI states
  const [copiedScript, setCopiedScript] = useState(false);
  const [pastedNotice, setPastedNotice] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const gameSearchContainerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        gameSearchContainerRef.current &&
        !gameSearchContainerRef.current.contains(event.target as Node)
      ) {
        setIsGameDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar juegos según la búsqueda
  const filteredGames = POPULAR_ROBLOX_GAMES.filter((g) => {
    const q = gameSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.placeId.includes(q) ||
      g.category.toLowerCase().includes(q)
    );
  });

  // Manejo de drag and drop para miniatura
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('El archivo debe ser una imagen válida (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('La imagen excede el límite de 5MB.');
      return;
    }
    setFormError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  // Pegar código Lua desde el portapapeles
  const handlePasteScript = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setScriptLua(text);
        setPastedNotice(true);
        setTimeout(() => setPastedNotice(false), 2000);
      }
    } catch {
      codeTextareaRef.current?.focus();
    }
  };

  // Copiar código Lua
  const handleCopyScript = () => {
    if (!scriptLua) return;
    navigator.clipboard.writeText(scriptLua);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Insertar Markdown en la descripción
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = descriptionTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = textarea.value;
    const selected = previousText.substring(start, end);

    const replacement = `${prefix}${selected || 'texto'}${suffix}`;
    const newText =
      previousText.substring(0, start) +
      replacement +
      previousText.substring(end);

    setDescription(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 5)
      );
    }, 10);
  };

  // Manejo de etiquetas personalizadas
  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim().replace(/^#/, '');
    if (!clean) return;
    if (tags.length >= 8) {
      setFormError('Límite máximo de 8 etiquetas alcanzado.');
      return;
    }
    if (!tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTags([...tags, clean]);
      setFormError(null);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  // Toggle de propiedades
  const toggleProperty = (key: keyof typeof properties) => {
    setProperties((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFormError('Por favor ingresa un título para el script.');
      return;
    }
    if (targetType === 'specific' && !selectedGame) {
      setFormError('Por favor selecciona o define el juego correspondiente.');
      return;
    }
    if (!scriptLua.trim()) {
      setFormError('Por favor ingresa o pega el código Lua del script.');
      return;
    }

    setFormError(null);

    const payload: ScriptFormState = {
      targetType,
      gameName:
        targetType === 'specific' ? selectedGame?.name || 'Juego Específico' : 'Universal',
      placeId: targetType === 'specific' ? selectedGame?.placeId || '' : '',
      selectedGame: targetType === 'specific' ? selectedGame : null,
      title: title.trim(),
      thumbnailUrl,
      description: description.trim(),
      scriptLua: scriptLua.trim(),
      hasCredits,
      creditsText: hasCredits ? creditsText.trim() : '',
      properties,
      tags,
      links,
    };

    if (onSubmit) {
      await onSubmit(payload);
    } else {
      console.log('Script publicado listo para Supabase:', payload);
      alert('¡Script preparado con éxito! Revisa la consola para ver el payload completo.');
    }
  };

  // Estadísticas del código
  const lineCount = scriptLua ? scriptLua.split('\n').length : 0;
  const scriptSizeKb = (new Blob([scriptLua]).size / 1024).toFixed(1);

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 md:py-10 space-y-8 animate-fadeIn text-foreground">
      {/* ==================================================================== */}
      {/* CABECERA PRINCIPAL CON ESTILO GLASSMORPHISM ADAPTABLE */}
      {/* ==================================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-border-theme bg-card p-6 sm:p-8 md:p-10 shadow-xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Chituk Creator Studio
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Publicar Nuevo Script
            </h1>
            <p className="text-sm sm:text-base text-foreground max-w-xl leading-relaxed">
              Comparte tus ejecutables, hubs y utilidades Lua con la comunidad. Todos los envíos se validan con moderación transparente.
            </p>
          </div>

          {/* Selector de modo Vista Previa / Formulario */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-base p-1.5 rounded-2xl border border-border-theme">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${!previewMode
                  ? 'bg-accent text-accent-contrast shadow-md'
                  : 'text-muted hover:text-foreground'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editor
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${previewMode
                  ? 'bg-accent text-accent-contrast shadow-md'
                  : 'text-muted hover:text-foreground'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Vista Previa
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Error si existe */}
      {formError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 backdrop-blur-md">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">{formError}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODO VISTA PREVIA INTERACTIVA */}
      {/* ==================================================================== */}
      {previewMode && (
        <div className="rounded-3xl border border-border-theme bg-card p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider">Preview Card</span>
              <h3 className="text-xl font-bold text-foreground">Cómo se verá en la lista de Chituk</h3>
            </div>
            <button
              onClick={() => setPreviewMode(false)}
              className="px-3.5 py-1.5 rounded-xl bg-base text-xs font-bold text-muted hover:text-foreground border border-border-theme cursor-pointer"
            >
              Volver al editor
            </button>
          </div>

          {/* Tarjeta de visualización adaptable */}
          <div className="max-w-md mx-auto rounded-2xl border border-border-theme bg-base overflow-hidden shadow-2xl group transition-all hover:border-accent">
            <div className="relative aspect-video w-full bg-card overflow-hidden">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-2 bg-card">
                  <span className="text-3xl">🎮</span>
                  <span className="text-xs font-mono text-muted">Sin miniatura subida</span>
                </div>
              )}
              {/* Badges superiores sobre la imagen */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-accent text-accent-contrast shadow-md">
                  {targetType === 'universal' ? 'Universal' : selectedGame?.name || 'Roblox'}
                </span>
                {properties.mobileFriendly && (
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 backdrop-blur-md shadow-md">
                    📱 Mobile
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-3">
              <h4 className="font-extrabold text-foreground text-lg line-clamp-1">
                {title || 'Título del Script de Ejemplo'}
              </h4>
              <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                {description || 'Aquí aparecerá la descripción detallada de tu script cuando sea publicado.'}
              </p>

              {/* Badges de propiedades adaptables */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {properties.keySystem && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    🔑 Key System
                  </span>
                )}
                {properties.paid ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    💎 Paid
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent border border-accent/30">
                    Gratis
                  </span>
                )}
                {properties.openSource && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                    🔓 Open Source
                  </span>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-border-theme">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[11px] text-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FORMULARIO PRINCIPAL */}
      {/* ==================================================================== */}
      <form
        onSubmit={handleFormSubmit}
        className={`space-y-8 ${previewMode ? 'hidden' : 'block'}`}
      >
        {/* ================================================================== */}
        {/* SECCIÓN 1: SELECTOR DE DESTINO (ESPECÍFICO VS UNIVERSAL) */}
        {/* ================================================================== */}
        <section className="rounded-3xl border border-border-theme bg-card p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent border border-accent/30 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Destino del Script</h2>
              <p className="text-xs sm:text-sm text-muted">
                Define si tu script funciona en un juego en concreto o si es universal.
              </p>
            </div>
          </div>

          {/* Grid de opciones visuales grandes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opción A: Juego Específico */}
            <div
              onClick={() => setTargetType('specific')}
              className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex items-start gap-4 ${targetType === 'specific'
                  ? 'border-accent bg-accent/10 shadow-[0_0_20px_var(--color-accent)]'
                  : 'border-border-theme bg-base/60 hover:bg-card-hover hover:border-border-theme'
                }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform ${targetType === 'specific'
                    ? 'bg-accent text-accent-contrast scale-105'
                    : 'bg-card text-foreground border border-border-theme'
                  }`}
              >
                🎮
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-foreground text-base">
                    Juego Específico
                  </h3>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${targetType === 'specific'
                        ? 'border-accent bg-accent text-accent-contrast'
                        : 'border-muted/50'
                      }`}
                  >
                    {targetType === 'specific' && (
                      <div className="w-2 h-2 rounded-full bg-accent-contrast" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Diseñado para una experiencia de Roblox en particular (Blox Fruits, Da Hood, etc.)
                </p>
              </div>
            </div>

            {/* Opción B: Script Universal */}
            <div
              onClick={() => setTargetType('universal')}
              className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex items-start gap-4 ${targetType === 'universal'
                  ? 'border-accent bg-accent/10 shadow-[0_0_20px_var(--color-accent)]'
                  : 'border-border-theme bg-base/60 hover:bg-card-hover hover:border-border-theme'
                }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform ${targetType === 'universal'
                    ? 'bg-accent text-accent-contrast scale-105'
                    : 'bg-card text-foreground border border-border-theme'
                  }`}
              >
                🌐
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-foreground text-base">
                    Universal Script
                  </h3>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${targetType === 'universal'
                        ? 'border-accent bg-accent text-accent-contrast'
                        : 'border-muted/50'
                      }`}
                  >
                    {targetType === 'universal' && (
                      <div className="w-2 h-2 rounded-full bg-accent-contrast" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Herramienta global que funciona en cualquier juego (ej: Fly, Admin Commands, Dex, ESP general).
                </p>
              </div>
            </div>
          </div>

          {/* Sub-bloque condicional para Juego Específico */}
          {targetType === 'specific' && (
            <div className="pt-4 border-t border-border-theme space-y-4 animate-fadeIn">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                Selecciona o Busca el Juego de Roblox
              </label>

              {/* Barra de búsqueda interactiva */}
              <div className="relative" ref={gameSearchContainerRef}>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-muted pointer-events-none">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={gameSearchQuery}
                    onFocus={() => setIsGameDropdownOpen(true)}
                    onChange={(e) => {
                      setGameSearchQuery(e.target.value);
                      setIsGameDropdownOpen(true);
                    }}
                    placeholder="Buscar por nombre (ej: Blox Fruits) o pegar Place ID..."
                    className="w-full bg-base border border-border-theme rounded-2xl pl-12 pr-10 py-3.5 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  {gameSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGameSearchQuery('')}
                      className="absolute right-4 text-muted hover:text-foreground text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown flotante con resultados */}
                {isGameDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border-theme bg-card shadow-2xl z-30 p-2 space-y-1">
                    {filteredGames.length > 0 ? (
                      filteredGames.map((game) => (
                        <div
                          key={game.id}
                          onClick={() => {
                            setSelectedGame(game);
                            setIsGameDropdownOpen(false);
                            setGameSearchQuery('');
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedGame?.placeId === game.placeId
                              ? 'bg-accent/15 border border-accent/40 text-foreground font-semibold'
                              : 'hover:bg-card-hover text-muted hover:text-foreground'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{game.icon}</span>
                            <div>
                              <p className="font-bold text-sm text-foreground">{game.name}</p>
                              <p className="text-[11px] text-muted">{game.category}</p>
                            </div>
                          </div>
                          <span className="font-mono text-xs px-2 py-1 rounded bg-base text-foreground font-semibold border border-border-theme">
                            ID: {game.placeId}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-muted">No encontramos un juego predefinido con ese nombre.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGame({
                              id: gameSearchQuery,
                              name: gameSearchQuery,
                              placeId: gameSearchQuery.replace(/\D/g, '') || 'Custom',
                              icon: '🕹️',
                              category: 'Juego Personalizado',
                            });
                            setIsGameDropdownOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-bold hover:opacity-90 cursor-pointer"
                        >
                          Usar &quot;{gameSearchQuery}&quot; como nombre del juego
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sugerencias rápidas en chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-muted font-semibold uppercase">Populares:</span>
                {POPULAR_ROBLOX_GAMES.slice(0, 5).map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => setSelectedGame(game)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${selectedGame?.placeId === game.placeId
                        ? 'bg-accent text-accent-contrast font-bold shadow-sm'
                        : 'bg-base text-muted hover:text-foreground border border-border-theme hover:border-accent/40'
                      }`}
                  >
                    {game.icon} {game.name}
                  </button>
                ))}
              </div>

              {/* Tarjeta del Juego Seleccionado */}
              {selectedGame && (
                <div className="mt-3 p-4 rounded-2xl bg-base border border-border-theme flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border-theme flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {selectedGame.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-foreground text-base sm:text-lg truncate">
                          {selectedGame.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent border border-accent/30 shrink-0">
                          Seleccionado
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted font-mono mt-0.5">
                        <span className="text-muted">Place ID:</span>
                        <span className="text-foreground font-bold">{selectedGame.placeId}</span>
                        {selectedGame.category && (
                          <span className="hidden sm:inline-block text-muted font-sans">
                            • {selectedGame.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsGameDropdownOpen(true);
                      if (gameSearchContainerRef.current) {
                        gameSearchContainerRef.current.querySelector('input')?.focus();
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-card hover:bg-card-hover border border-border-theme text-xs font-bold text-foreground transition-colors shrink-0 cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ================================================================== */}
        {/* SECCIÓN 2: INFORMACIÓN BÁSICA (TÍTULO Y THUMBNAIL DRAG & DROP) */}
        {/* ================================================================== */}
        <section className="rounded-3xl border border-border-theme bg-card p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent border border-accent/30 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Información Básica</h2>
              <p className="text-xs sm:text-sm text-muted">
                Atrae a la comunidad con un título claro y una miniatura de alto impacto.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Input de Título */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  Título del Script <span className="text-accent">*</span>
                </label>
                <span
                  className={`text-xs font-mono ${title.length > 70 ? 'text-amber-500 font-bold' : 'text-muted'
                    }`}
                >
                  {title.length}/80
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. [V4 OP] Blox Fruits Auto Farm, Auto Chest & Fast Attack Hub"
                className="w-full bg-base border border-border-theme rounded-2xl px-4 py-3.5 text-sm sm:text-base text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-medium"
              />
              <p className="text-[11px] text-muted">
                Tip: Incluye palabras clave como [OP], [Keyless], la versión o las funciones más destacadas.
              </p>
            </div>

            {/* Thumbnail Drag & Drop Moderno */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  Miniatura / Portada
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-base border border-border-theme text-accent">
                    Recomendado 16:9
                  </span>
                </label>
                {thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl(null)}
                    className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Eliminar imagen
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImageFile(file);
                }}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />

              {thumbnailUrl ? (
                /* Vista previa de miniatura cargada */
                <div className="relative rounded-2xl overflow-hidden border border-border-theme aspect-video max-h-72 w-full bg-base group shadow-md">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-accent text-accent-contrast font-bold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Cambiar Imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl(null)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                /* Zona interactiva Drag and Drop */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 group ${isDragging
                      ? 'border-accent bg-accent/15 scale-[1.01]'
                      : 'border-border-theme bg-base hover:bg-card-hover hover:border-accent'
                    }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isDragging
                        ? 'bg-accent text-accent-contrast border-accent scale-110'
                        : 'bg-card text-muted border-border-theme group-hover:text-accent group-hover:border-accent'
                      }`}
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-foreground">
                      <span className="text-accent group-hover:underline">Haz clic para subir</span> o arrastra tu miniatura aquí
                    </p>
                    <p className="text-xs text-muted">
                      Soporta PNG, JPG o WEBP panorámico (16:9 • hasta 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECCIÓN 3: CONTENIDO DEL SCRIPT (EDITOR ENRIQUECIDO & LUA CODE) */}
        {/* ================================================================== */}
        <section className="rounded-3xl border border-border-theme bg-card p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent border border-accent/30 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Contenido del Script</h2>
              <p className="text-xs sm:text-sm text-muted">
                Describe las funciones del script y pega el código ejecutable Lua.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Editor de Texto Enriquecido Simulado para la Descripción */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  Descripción y Requisitos <span className="text-accent">*</span>
                </label>
                <span className="text-xs text-muted">Markdown compatible</span>
              </div>

              {/* Barra de herramientas simulada (Rich Text Toolbar) */}
              <div className="rounded-2xl border border-border-theme bg-base overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                <div className="flex flex-wrap items-center gap-1 p-2 bg-card border-b border-border-theme text-muted">
                  <button
                    type="button"
                    title="Negrita (**texto**)"
                    onClick={() => insertMarkdown('**', '**')}
                    className="p-1.5 rounded-lg hover:bg-card-hover hover:text-foreground text-xs font-bold transition-colors w-7 h-7 flex items-center justify-center cursor-pointer"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    title="Cursiva (*texto*)"
                    onClick={() => insertMarkdown('*', '*')}
                    className="p-1.5 rounded-lg hover:bg-card-hover hover:text-foreground text-xs italic font-serif transition-colors w-7 h-7 flex items-center justify-center cursor-pointer"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    title="Encabezado (### )"
                    onClick={() => insertMarkdown('### ')}
                    className="p-1.5 rounded-lg hover:bg-card-hover hover:text-foreground text-xs font-bold transition-colors w-7 h-7 flex items-center justify-center cursor-pointer"
                  >
                    H
                  </button>
                  <div className="h-4 w-[1px] bg-border-theme mx-1" />
                  <button
                    type="button"
                    title="Código en línea (`código`)"
                    onClick={() => insertMarkdown('`', '`')}
                    className="p-1.5 rounded-lg hover:bg-card-hover hover:text-foreground text-xs font-mono transition-colors w-7 h-7 flex items-center justify-center cursor-pointer"
                  >
                    {'</>'}
                  </button>
                  <button
                    type="button"
                    title="Lista con viñetas"
                    onClick={() => insertMarkdown('\n- ')}
                    className="p-1.5 rounded-lg hover:bg-card-hover hover:text-foreground text-xs transition-colors w-7 h-7 flex items-center justify-center cursor-pointer"
                  >
                    •—
                  </button>
                  <button
                    type="button"
                    title="Cita (> )"
                    onClick={() => insertMarkdown('\n> ')}
                    className="p-1.5 rounded-lg hover:bg-card-hover hover:text-foreground text-xs transition-colors w-7 h-7 flex items-center justify-center font-serif cursor-pointer"
                  >
                    &ldquo;
                  </button>
                  <button
                    type="button"
                    title="Enlace ([nombre](url))"
                    onClick={() => insertMarkdown('[', '](https://...)')}
                    className="p-1.5 rounded-lg hover:bg-card-hover hover:text-foreground text-xs transition-colors w-7 h-7 flex items-center justify-center cursor-pointer"
                  >
                    🔗
                  </button>
                </div>

                <textarea
                  ref={descriptionTextareaRef}
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe cómo funciona el script, requisitos de ejecución (ej. Delta, Codex, Hydrogen, Wave), características principales y precauciones..."
                  className="w-full bg-transparent p-4 text-sm text-foreground placeholder:text-muted/60 focus:outline-none resize-y min-h-[120px] font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Área de Bloque de Código Oscuro (Script Lua) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  Script <span className="text-accent">*</span>
                </label>
                <div className="flex items-center gap-3 text-xs font-mono text-muted">
                  <span>{lineCount} líneas</span>
                  <span>•</span>
                  <span>{scriptSizeKb} KB</span>
                </div>
              </div>

              {/* IDE Container */}
              <div className="rounded-2xl border border-border-theme bg-[#060908] overflow-hidden shadow-2xl focus-within:border-accent transition-all">
                {/* IDE Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-base border-b border-border-theme">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                    <span className="ml-2 text-xs font-mono font-bold text-foreground flex items-center gap-1.5">
                      <span className="text-accent">🌙</span> main.lua
                    </span>
                  </div>

                  {/* Acciones del Editor */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteScript}
                      className="px-3 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-bold font-mono transition-all flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {pastedNotice ? '¡Pegado!' : 'Pegar'}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyScript}
                      disabled={!scriptLua}
                      className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-card-hover text-foreground text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-border-theme flex items-center gap-1 cursor-pointer"
                    >
                      {copiedScript ? '✓ Copiado' : 'Copiar'}
                    </button>

                    {scriptLua && (
                      <button
                        type="button"
                        onClick={() => setScriptLua('')}
                        className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-red-500/20 text-muted hover:text-red-400 text-xs font-mono transition-colors border border-border-theme cursor-pointer"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* Textarea de Código Lua */}
                <textarea
                  ref={codeTextareaRef}
                  required
                  rows={9}
                  value={scriptLua}
                  onChange={(e) => setScriptLua(e.target.value)}
                  placeholder={`-- Pega aquí el script o cargador loadstring de tu script\nloadstring(game:HttpGet("https://raw.githubusercontent.com/..."))()`}
                  className="w-full bg-[#060908] p-4 font-mono text-xs sm:text-sm text-emerald-400 placeholder:text-neutral-500 focus:outline-none resize-y min-h-[200px] leading-relaxed selection:bg-accent/30 selection:text-white"
                  spellCheck="false"
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Checkbox estilizado para Créditos a Terceros */}
            <div className="p-4 rounded-2xl bg-base border border-border-theme space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasCredits}
                  onChange={(e) => setHasCredits(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border-theme text-accent focus:ring-accent bg-card accent-accent cursor-pointer"
                />
                <div>
                  <span className="text-sm font-bold text-foreground block">
                    Dar créditos o citar a desarrolladores originales
                  </span>
                  <span className="text-xs text-muted block leading-relaxed">
                    Activa esta casilla si este script fue creado en conjunto, utiliza una UI Library de la comunidad (Rayfield, Orion, Kavo) o es un fork.
                  </span>
                </div>
              </label>

              {/* Input desplegable para créditos */}
              {hasCredits && (
                <div className="pt-2 animate-fadeIn">
                  <input
                    type="text"
                    value={creditsText}
                    onChange={(e) => setCreditsText(e.target.value)}
                    placeholder="Ej. Créditos de UI Library a Shlex / Código base por DevX..."
                    className="w-full bg-card border border-border-theme rounded-xl px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECCIÓN 4: METADATOS Y PROPIEDADES (BADGES INTERACTIVOS) */}
        {/* ================================================================== */}
        <section className="rounded-3xl border border-border-theme bg-card p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent border border-accent/30 flex items-center justify-center font-bold text-lg">
              4
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Propiedades y Metadatos</h2>
              <p className="text-xs sm:text-sm text-muted">
                Define las características clave para que los usuarios encuentren tu script con los filtros.
              </p>
            </div>
          </div>

          {/* Badges / Toggles interactivos en Grid: 1 col móvil, 2 col sm, 3 col lg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. KEY SYSTEM */}
            <div
              onClick={() => toggleProperty('keySystem')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 select-none flex flex-col justify-between gap-3 ${properties.keySystem
                  ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'border-border-theme bg-base/60 hover:bg-card-hover'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🔑</span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${properties.keySystem
                      ? 'bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/40'
                      : 'bg-card text-muted border border-border-theme'
                    }`}
                >
                  {properties.keySystem ? 'Requiere Key' : 'Keyless'}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-foreground">KEY SYSTEM</h4>
                <p className="text-xs text-muted">Usa sistema de llaves</p>
              </div>
            </div>

            {/* 2. MOBILE FRIENDLY */}
            <div
              onClick={() => toggleProperty('mobileFriendly')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 select-none flex flex-col justify-between gap-3 ${properties.mobileFriendly
                  ? 'border-cyan-500 bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'border-border-theme bg-base/60 hover:bg-card-hover'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">📱</span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${properties.mobileFriendly
                      ? 'bg-cyan-500/25 text-cyan-700 dark:text-cyan-400 border border-cyan-500/40'
                      : 'bg-card text-muted border border-border-theme'
                    }`}
                >
                  {properties.mobileFriendly ? 'Optimizado' : 'Solo PC'}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-foreground">MOBILE FRIENDLY</h4>
                <p className="text-xs text-muted">Compatible con móviles</p>
              </div>
            </div>

            {/* 3. OPEN SOURCE */}
            <div
              onClick={() => toggleProperty('openSource')}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 select-none flex flex-col justify-between gap-3 ${properties.openSource
                  ? 'border-indigo-500 bg-indigo-500/15 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'border-border-theme bg-base/60 hover:bg-card-hover'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🔓</span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${properties.openSource
                      ? 'bg-indigo-500/25 text-indigo-700 dark:text-indigo-400 border border-indigo-500/40'
                      : 'bg-card text-muted border border-border-theme'
                    }`}
                >
                  {properties.openSource ? 'Abierto' : 'Ofuscado'}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-foreground">OPEN SOURCE</h4>
                <p className="text-xs text-muted">Código no ofuscado</p>
              </div>
            </div>
          </div>

          {/* Input de Etiquetas Personalizadas (Custom Tags) */}
          <div className="space-y-3 pt-4 border-t border-border-theme">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                Etiquetas Personalizadas (Tags)
              </label>
              <span className="text-xs text-muted font-mono">{tags.length}/8 tags</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl border border-border-theme bg-base focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-accent/15 text-accent border border-accent/30 animate-fadeIn"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? 'Escribe una etiqueta y presiona Enter...' : 'Agregar tag...'}
                className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground placeholder:text-muted/60 focus:outline-none px-2 py-1"
              />
            </div>

            {/* Sugerencias de tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted font-medium">Sugerencias:</span>
              {SUGGESTED_TAGS.map((stag) => (
                <button
                  key={stag}
                  type="button"
                  onClick={() => handleAddTag(stag)}
                  disabled={tags.includes(stag)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${tags.includes(stag)
                      ? 'opacity-40 border-border-theme text-muted cursor-default'
                      : 'border-border-theme bg-base text-muted hover:text-foreground hover:border-accent/40'
                    }`}
                >
                  +{stag}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs de Enlaces Sociales con Iconos */}
          <div className="space-y-4 pt-4 border-t border-border-theme">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted block">
                Enlaces del Creador / Comunidad
              </label>
              <p className="text-xs text-muted">
                Conecta tu servidor de Discord, showcase de YouTube o perfil oficial.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Discord */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#5865F2]">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </span>
                <input
                  type="url"
                  value={links.discord}
                  onChange={(e) => setLinks({ ...links, discord: e.target.value })}
                  placeholder="https://discord.gg/tu-servidor"
                  className="w-full bg-base border border-border-theme rounded-2xl pl-12 pr-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2]"
                />
              </div>

              {/* YouTube */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#FF0000]">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </span>
                <input
                  type="url"
                  value={links.youtube}
                  onChange={(e) => setLinks({ ...links, youtube: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-base border border-border-theme rounded-2xl pl-12 pr-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]"
                />
              </div>

              {/* Roblox */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-muted">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.926 23.998L0 18.892 5.075.002 24 5.108l-5.074 18.89zm-8.625-10.74l1.458-5.441-5.441-1.459-1.458 5.441 5.441 1.459z" />
                  </svg>
                </span>
                <input
                  type="url"
                  value={links.roblox}
                  onChange={(e) => setLinks({ ...links, roblox: e.target.value })}
                  placeholder="https://roblox.com/groups/... o perfil"
                  className="w-full bg-base border border-border-theme rounded-2xl pl-12 pr-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Website */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-accent">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </span>
                <input
                  type="url"
                  value={links.website}
                  onChange={(e) => setLinks({ ...links, website: e.target.value })}
                  placeholder="https://tu-sitio-o-documentacion.com"
                  className="w-full bg-base border border-border-theme rounded-2xl pl-12 pr-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Verificación de Seguridad Anti-Bot Opcional */}
        {securityWidget && (
          <div className="rounded-3xl border border-border-theme bg-card p-6 shadow-xl">
            {securityWidget}
          </div>
        )}

        {/* ================================================================== */}
        {/* SECCIÓN 5: ACCIÓN PRINCIPAL (BOTÓN FLOTANTE / DESTACADO) */}
        {/* ================================================================== */}
        <div className="sticky bottom-4 z-40 p-4 sm:p-5 rounded-3xl border border-border-theme bg-card/95 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-sm font-bold">
              ⚡
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Listo para Publicar</p>
              <p className="text-[11px] text-muted">
                Tu script pasará por la cola de revisión comunitaria de Chituk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className="px-4 py-3.5 rounded-2xl bg-base hover:bg-card-hover border border-border-theme text-xs sm:text-sm font-bold text-foreground transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              👁️ Previsualizar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl bg-accent text-accent-contrast font-black text-sm tracking-wide shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-accent-contrast" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Enviando Script...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Publicar Script en Chituk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
