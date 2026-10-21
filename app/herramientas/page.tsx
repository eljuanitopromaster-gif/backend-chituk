'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import ExecutorModal, { ToolItem } from '../components/ExecutorModal';
export type { ToolItem };

const DEFAULT_TOOLS: ToolItem[] = [
    // -------------------------------------------------------------
    // EXECUTORS (Utilizando las portadas de assets/Executors Tools)
    // -------------------------------------------------------------
    {
      id: 'solara',
      name: 'Solara',
      category: 'executors',
      platforms: ['windows'],
      access: 'free',
      priceDisplay: 'FREE',
      viewsDisplay: '136.7K',
      viewsCount: 136700,
      rating: 3.5,
      reviewsCount: 26,
      status: 'Actualizado',
      description: 'Ejecutor ligero y optimizado para Windows con inyección rápida, soporte para Luau moderno y baja tasa de caídas.',
      features: ['Nivel de ejecución optimizado', 'Sin claves tediosas', 'Inyección rápida', 'Compatible con Windows 10/11'],
      downloadUrl: 'https://solara.gg/',
      downloadLink: 'https://solara.gg/',
      url: 'https://solara.gg/',
      imageSrc: '/assets/Executors Tools/Solara.jpg'
    },
    {
      id: 'xeno',
      name: 'Xeno',
      category: 'executors',
      platforms: ['windows'],
      access: 'free',
      priceDisplay: 'FREE',
      viewsDisplay: '122.6K',
      viewsCount: 122600,
      rating: 3.9,
      reviewsCount: 35,
      status: 'Actualizado',
      description: 'Ejecutor de alto calibre con inyección instantánea, sidebar modular y soporte nativo para librerías avanzadas.',
      features: ['Inyección en 0.5s', 'UI fluida y oscura', 'Soporte Luau full', 'Anti-ban integrado'],
      downloadUrl: 'https://xenoexecutor.com/',
      downloadLink: 'https://xenoexecutor.com/',
      url: 'https://xenoexecutor.com/',
      imageSrc: '/assets/Executors Tools/Xeno.jpg'
    },
    {
      id: 'delta',
      name: 'Delta',
      category: 'executors',
      platforms: ['windows', 'android', 'mac'],
      access: 'free',
      priceDisplay: 'FREE',
      viewsDisplay: '53.3K',
      viewsCount: 53300,
      rating: 4.4,
      reviewsCount: 17,
      status: 'Actualizado',
      description: 'El ejecutor multiplataforma más confiable y extendido. Compatible con Windows y Android con bypass estable.',
      features: ['Soporte Android y Windows', 'Explorador de scripts en nube', 'Bajo consumo de RAM', 'Frecuentes updates'],
      downloadUrl: 'https://deltaexploits.net/',
      downloadLink: 'https://deltaexploits.net/',
      url: 'https://deltaexploits.net/',
      imageSrc: '/assets/Executors Tools/Delta.jpg'
    },

    // -------------------------------------------------------------
    // EXTERNALS
    // -------------------------------------------------------------
    {
      id: 'aimmy',
      name: 'Aimmy',
      category: 'externals',
      platforms: ['windows'],
      access: 'free',
      priceDisplay: 'FREE',
      viewsDisplay: '55.7K',
      viewsCount: 55700,
      rating: 2.6,
      reviewsCount: 10,
      status: 'Actualizado',
      description: 'Herramienta de asistencia visual por IA mediante Computer Vision ONNX. Totalmente externa y libre de inyección de memoria.',
      features: ['100% externo sin memoria', 'Modelos ONNX actualizables', 'Cero riesgo de ban de cliente', 'Código abierto'],
      downloadUrl: 'https://aimmy.dev/',
      downloadLink: 'https://aimmy.dev/',
      url: 'https://aimmy.dev/',
      imageSrc: '/assets/Executors Tools/Aimmy.jpg?v=2'
    }
];

export default function HerramientasPage() {
  const { user } = useAuth();
  const isAdmin = user && ['owner', 'creator', 'admin', 'mod'].includes(user.role);

  const [toolsData, setToolsData] = useState<ToolItem[]>(DEFAULT_TOOLS);

  // Independent filters for Executors and Externals
  const [execPlatform, setExecPlatform] = useState<'all' | 'windows' | 'android'>('all');
  const [execAccess, setExecAccess] = useState<'all' | 'free' | 'paid'>('all');
  const [execSort, setExecSort] = useState<'views' | 'rating'>('views');

  const [extPlatform, setExtPlatform] = useState<'all' | 'windows' | 'android'>('all');
  const [extAccess, setExtAccess] = useState<'all' | 'free' | 'paid'>('all');
  const [extSort, setExtSort] = useState<'views' | 'rating'>('views');

  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showVersionsModal, setShowVersionsModal] = useState(false);

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => {
        if (data.tools && Array.isArray(data.tools) && data.tools.length > 0) {
          setToolsData(data.tools);
        }
      })
      .catch(err => console.error('Error fetching tools:', err));
  }, []);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Filtered lists
  const filteredExecutors = useMemo(() => {
    return toolsData
      .filter(t => t.category === 'executors')
      .filter(t => {
        if (execPlatform === 'all') return true;
        return t.platforms.includes(execPlatform);
      })
      .filter(t => {
        if (execAccess === 'all') return true;
        return t.access === execAccess;
      })
      .sort((a, b) => {
        if (execSort === 'views') return b.viewsCount - a.viewsCount;
        return b.rating - a.rating;
      });
  }, [toolsData, execPlatform, execAccess, execSort]);

  const filteredExternals = useMemo(() => {
    return toolsData
      .filter(t => t.category === 'externals')
      .filter(t => {
        if (extPlatform === 'all') return true;
        return t.platforms.includes(extPlatform);
      })
      .filter(t => {
        if (extAccess === 'all') return true;
        return t.access === extAccess;
      })
      .sort((a, b) => {
        if (extSort === 'views') return b.viewsCount - a.viewsCount;
        return b.rating - a.rating;
      });
  }, [toolsData, extPlatform, extAccess, extSort]);

  // Reusable Filter Bar matching the reference UI
  const renderFilterControls = (
    platform: 'all' | 'windows' | 'android',
    setPlatform: (p: 'all' | 'windows' | 'android') => void,
    access: 'all' | 'free' | 'paid',
    setAccess: (a: 'all' | 'free' | 'paid') => void,
    sort: 'views' | 'rating',
    setSort: (s: 'views' | 'rating') => void
  ) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      {/* PLATAFORMA */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold tracking-wider text-muted uppercase">PLATAFORMA:</span>
        <button
          type="button"
          onClick={() => setPlatform('all')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${platform === 'all'
            ? 'bg-card-hover text-accent border border-border-theme font-bold shadow-sm'
            : 'text-muted hover:text-foreground'
            }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setPlatform('windows')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${platform === 'windows' ? 'bg-card-hover border border-border-theme' : 'hover:bg-card-hover/50'
            } text-[#00ADEF]`}
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.8" />
          </svg>
          WINDOWS
        </button>
        <button
          type="button"
          onClick={() => setPlatform('android')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${platform === 'android' ? 'bg-card-hover border border-border-theme' : 'hover:bg-card-hover/50'
            } text-[#22C55E]`}
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0004 0-.5518.4482-.9997.9993-.9997.5519 0 .9994.4479.9994.9997 0 .5518-.4475 1.0004-.9994 1.0004m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0004 0-.5518.4482-.9997.9993-.9997.5519 0 .9994.4479.9994.9997 0 .5518-.4475 1.0004-.9994 1.0004m11.4045-6.02l1.996-3.4563a.4158.4158 0 00-.1523-.5675.4165.4165 0 00-.5684.1523l-2.0223 3.503C15.5898 8.4045 13.8553 8.082 12 8.082c-1.8554 0-3.5898.3225-5.1345.8709L4.8432 5.45c-.1318-.2284-.4247-.3066-.5684-.1523a.4158.4158 0 00-.1523.5675l1.996 3.4563C2.688 11.285 0 14.859 0 18.995h24c0-4.136-2.688-7.71-6.1185-9.6736" />
          </svg>
          ANDROID
        </button>
      </div>

      {/* ACCESO */}
      <div className="flex items-center gap-1.5 ml-1">
        <span className="text-[11px] font-bold tracking-wider text-muted uppercase">ACCESO:</span>
        <button
          type="button"
          onClick={() => setAccess('all')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${access === 'all'
            ? 'bg-card-hover text-accent border border-border-theme font-bold shadow-sm'
            : 'text-muted hover:text-foreground'
            }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setAccess('free')}
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${access === 'free'
            ? 'bg-card-hover text-accent border border-border-theme font-bold shadow-sm'
            : 'text-muted hover:text-foreground'
            }`}
        >
          Gratis
        </button>
        <button
          type="button"
          onClick={() => setAccess('paid')}
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${access === 'paid'
            ? 'bg-card-hover text-accent border border-border-theme font-bold shadow-sm'
            : 'text-muted hover:text-foreground'
            }`}
        >
          De Pago
        </button>
      </div>

      {/* ORDENAR */}
      <div className="flex items-center gap-1.5 ml-1">
        <span className="text-[11px] font-bold tracking-wider text-muted uppercase">ORDENAR:</span>
        <button
          type="button"
          onClick={() => setSort('views')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${sort === 'views'
            ? 'bg-card-hover text-accent border border-border-theme font-bold shadow-sm'
            : 'text-muted hover:text-foreground'
            }`}
        >
          Más Vistos
        </button>
        <button
          type="button"
          onClick={() => setSort('rating')}
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${sort === 'rating'
            ? 'bg-card-hover text-accent border border-border-theme font-bold shadow-sm'
            : 'text-muted hover:text-foreground'
            }`}
        >
          Mejor Calificados
        </button>
      </div>
    </div>
  );

  const renderCard = (tool: ToolItem) => (
    <div
      key={tool.id}
      onClick={() => setSelectedTool(tool)}
      className="bg-card border border-border-theme hover:border-neutral-700/80 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 shadow-md flex flex-col group cursor-pointer"
    >
      {/* Thumbnail / Portada */}
      <div className="aspect-[16/9] w-full bg-[#08090C] relative overflow-hidden">
        <div className="w-full h-full transform group-hover:scale-[1.03] transition-transform duration-300 ease-out">
          {tool.imageSrc ? (
            <img
              src={tool.imageSrc}
              alt={tool.name}
              className="w-full h-full object-cover select-none"
              loading="lazy"
            />
          ) : (
            tool.thumbnailComponent
          )}
        </div>
      </div>

      {/* Info Container */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1 bg-card">
        {/* Row 1: Name + Platforms + Price */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[15px] text-foreground group-hover:text-accent transition-colors">
              {tool.name}
            </h3>
            {/* Platform Badges */}
            <div className="flex items-center gap-1 ml-0.5">
              {tool.platforms.includes('windows') && (
                <span title="Windows">
                  <svg className="w-3.5 h-3.5 text-[#00ADEF] fill-current" viewBox="0 0 24 24">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.8" />
                  </svg>
                </span>
              )}
              {tool.platforms.includes('android') && (
                <span title="Android">
                  <svg className="w-3.5 h-3.5 text-[#22C55E] fill-current" viewBox="0 0 24 24">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0004 0-.5518.4482-.9997.9993-.9997.5519 0 .9994.4479.9994.9997 0 .5518-.4475 1.0004-.9994 1.0004m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0004 0-.5518.4482-.9997.9993-.9997.5519 0 .9994.4479.9994.9997 0 .5518-.4475 1.0004-.9994 1.0004m11.4045-6.02l1.996-3.4563a.4158.4158 0 00-.1523-.5675.4165.4165 0 00-.5684.1523l-2.0223 3.503C15.5898 8.4045 13.8553 8.082 12 8.082c-1.8554 0-3.5898.3225-5.1345.8709L4.8432 5.45c-.1318-.2284-.4247-.3066-.5684-.1523a.4158.4158 0 00-.1523.5675l1.996 3.4563C2.688 11.285 0 14.859 0 18.995h24c0-4.136-2.688-7.71-6.1185-9.6736" />
                  </svg>
                </span>
              )}
              {tool.platforms.includes('mac') && (
                <span title="Mac">
                  <svg className="w-3.5 h-3.5 text-muted fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.85-.92.04-2.06.62-2.73 1.41-.58.67-1.1 1.74-1.01 2.79 1.03.08 2.11-.6 2.73-1.35z" />
                  </svg>
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div>
            {tool.access === 'free' ? (
              <span className="text-xs font-bold text-[#22C55E] tracking-wider">
                GRATIS
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#EF4444] tracking-tight">
                {tool.priceDisplay}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Views and Ratings */}
        <div className="flex items-center gap-3 text-xs text-muted pt-0.5">
          {/* Eye Views */}
          <div className="flex items-center gap-1 font-normal">
            <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-foreground font-medium">{tool.viewsDisplay}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-[#FACC15] fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold text-foreground">{tool.rating.toFixed(1)}</span>
            <span className="text-muted text-[11px]">· {tool.reviewsCount} reseñas</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-[1520px] mx-auto w-full relative min-h-screen">

      {/* ------------------------------------------------------------- */}
      {/* HEADER ROW: TITLE & ROBLOX VERSIONS WIDGET                     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 sm:mb-10">

        {/* Title and Subtitle */}
        <div className="flex-1 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">
            Ejecutores, Externales, Herramientas y Más de <span className="text-accent">Roblox</span>
          </h1>
          <p className="text-sm md:text-base leading-relaxed text-muted">
            Explora la colección de ejecutores, herramientas externas, utilidades y más verificadas y aprobadas por Chituk. Encuentra la herramienta perfecta para correr{' '}
            <Link href="/" className="text-accent underline font-semibold transition-colors">
              scripts de roblox
            </Link>.
          </p>
          {isAdmin && (
            <div className="mt-3">
              <Link
                href="/admin/herramientas"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Gestionar Ejecutores y Herramientas (Admin)
              </Link>
            </div>
          )}
        </div>

        {/* ROBLOX VERSIONS WIDGET */}
        <div className="bg-card border border-border-theme rounded-xl p-4 shadow-xl backdrop-blur-md w-full xl:w-auto xl:min-w-[440px] shrink-0">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
              VERSIONES DE ROBLOX
            </span>
            <button
              type="button"
              onClick={() => setShowVersionsModal(true)}
              className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              Ver más
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Windows Player */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-0.5">
                <svg className="w-3.5 h-3.5 text-[#00ADEF] fill-current" viewBox="0 0 24 24">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.8" />
                </svg>
                Windows Player
              </div>
              <button
                type="button"
                onClick={() => copyHash('version-cec3ad5889b447cf')}
                className="text-xs font-mono text-[#22C55E] font-medium truncate hover:underline text-left transition-colors cursor-pointer"
                title="Click para copiar"
              >
                {copiedHash === 'version-cec3ad5889b447cf' ? '✓ Copiado' : 'version-cec3ad5889b447cf'}
              </button>
              <span className="text-[10px] text-muted font-mono mt-0.5 truncate">
                Anterior <span className="text-foreground">version-02c37bc51a384b8f</span>
              </span>
            </div>

            {/* Mac Player */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-0.5">
                <svg className="w-3.5 h-3.5 text-muted fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.85-.92.04-2.06.62-2.73 1.41-.58.67-1.1 1.74-1.01 2.79 1.03.08 2.11-.6 2.73-1.35z" />
                </svg>
                Mac Player
              </div>
              <button
                type="button"
                onClick={() => copyHash('version-f9247f9560044102')}
                className="text-xs font-mono text-[#22C55E] font-medium truncate hover:underline text-left transition-colors cursor-pointer"
                title="Click para copiar"
              >
                {copiedHash === 'version-f9247f9560044102' ? '✓ Copiado' : 'version-f9247f9560044102'}
              </button>
              <span className="text-[10px] text-muted font-mono mt-0.5 truncate">
                Anterior <span className="text-foreground">version-3bc33ee7ffad426f</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: EXECUTORS                                           */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-2 border-b border-border-theme">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Executors</h2>
            <span className="text-xs font-normal text-muted">{filteredExecutors.length} items</span>
          </div>
          {renderFilterControls(execPlatform, setExecPlatform, execAccess, setExecAccess, execSort, setExecSort)}
        </div>

        {filteredExecutors.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border-theme rounded-xl">
            <p className="text-muted text-sm">No se encontraron ejecutores con los filtros seleccionados.</p>
            <button
              type="button"
              onClick={() => { setExecPlatform('all'); setExecAccess('all'); }}
              className="mt-2 text-xs text-accent font-bold underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredExecutors.map(renderCard)}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: EXTERNAL TOOLS                                      */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-2 border-b border-border-theme">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Herramientas y Externales</h2>
            <span className="text-xs font-normal text-muted">{filteredExternals.length} herramientas</span>
          </div>
          {renderFilterControls(extPlatform, setExtPlatform, extAccess, setExtAccess, extSort, setExtSort)}
        </div>

        {filteredExternals.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border-theme rounded-xl">
            <p className="text-muted text-sm">No se encontraron utilidades externas con los filtros seleccionados.</p>
            <button
              type="button"
              onClick={() => { setExtPlatform('all'); setExtAccess('all'); }}
              className="mt-2 text-xs text-accent font-bold underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredExternals.map(renderCard)}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* TOOL DETAIL MODAL (MODULAR / PARAMETRIZADO)                   */}
      {/* ------------------------------------------------------------- */}
      <ExecutorModal
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />

      {/* ------------------------------------------------------------- */}
      {/* ROBLOX VERSIONS MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      {showVersionsModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowVersionsModal(false)}>
          <div
            className="bg-card border border-border-theme rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border-theme bg-base flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Historial de Clientes</span>
                <h3 className="text-lg font-bold text-foreground">Roblox Version Hashes</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVersionsModal(false)}
                className="text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto">
              <div className="p-3.5 bg-base rounded-xl border border-border-theme">
                <span className="text-xs font-bold text-[#00ADEF] block mb-1">Windows Player (En Vivo)</span>
                <code className="text-xs font-mono text-[#22C55E] block break-all font-semibold">version-cec3ad5889b447cf</code>
                <span className="text-[11px] text-muted font-mono block mt-1">Anterior: version-02c37bc51a384b8f</span>
              </div>

              <div className="p-3.5 bg-base rounded-xl border border-border-theme">
                <span className="text-xs font-bold text-foreground block mb-1">Mac Player (En Vivo)</span>
                <code className="text-xs font-mono text-[#22C55E] block break-all font-semibold">version-f9247f9560044102</code>
                <span className="text-[11px] text-muted font-mono block mt-1">Anterior: version-3bc33ee7ffad426f</span>
              </div>

              <div className="p-3.5 bg-base rounded-xl border border-border-theme">
                <span className="text-xs font-bold text-[#22C55E] block mb-1">Android APK (Cliente)</span>
                <code className="text-xs font-mono text-[#22C55E] block break-all font-semibold">2.658.627 (64-bit armeabi-v7a)</code>
                <span className="text-[11px] text-muted font-mono block mt-1">Anterior: 2.657.612</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-base rounded-xl border border-border-theme text-xs text-foreground mt-1">
                <span className="text-muted">¿Deseas avisos en vivo cuando cambien las versiones?</span>
                <a
                  href="https://discord.gg/mdvByagDr3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  Unirse al Discord &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
