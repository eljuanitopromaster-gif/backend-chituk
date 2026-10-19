'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';

interface ToolItem {
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
  status: 'Actualizado' | 'Funcionando' | 'Beta' | 'Mantenimiento' | 'Parcheado' | string;
  description: string;
  features: string[];
  downloadUrl: string;
  imageSrc?: string;
  thumbnailComponent?: React.ReactNode;
}

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
        <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">PLATAFORMA:</span>
        <button
          type="button"
          onClick={() => setPlatform('all')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${platform === 'all'
            ? 'bg-[#22242B] text-white shadow-sm'
            : 'text-neutral-400 hover:text-white'
            }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setPlatform('windows')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${platform === 'windows' ? 'bg-[#22242B]' : 'hover:bg-neutral-800/40'
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
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${platform === 'android' ? 'bg-[#22242B]' : 'hover:bg-neutral-800/40'
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
        <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">ACCESO:</span>
        <button
          type="button"
          onClick={() => setAccess('all')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${access === 'all'
            ? 'bg-[#22242B] text-white shadow-sm'
            : 'text-neutral-400 hover:text-white'
            }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setAccess('free')}
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${access === 'free'
            ? 'bg-[#22242B] text-white shadow-sm'
            : 'text-neutral-400 hover:text-white'
            }`}
        >
          Gratis
        </button>
        <button
          type="button"
          onClick={() => setAccess('paid')}
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${access === 'paid'
            ? 'bg-[#22242B] text-white shadow-sm'
            : 'text-neutral-400 hover:text-white'
            }`}
        >
          De Pago
        </button>
      </div>

      {/* ORDENAR */}
      <div className="flex items-center gap-1.5 ml-1">
        <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">ORDENAR:</span>
        <button
          type="button"
          onClick={() => setSort('views')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${sort === 'views'
            ? 'bg-[#22242B] text-white shadow-sm'
            : 'text-neutral-400 hover:text-white'
            }`}
        >
          Más Vistos
        </button>
        <button
          type="button"
          onClick={() => setSort('rating')}
          className={`px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${sort === 'rating'
            ? 'bg-[#22242B] text-white shadow-sm'
            : 'text-neutral-400 hover:text-white'
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
            <h3 className="font-bold text-[15px] text-white group-hover:text-accent transition-colors">
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
                  <svg className="w-3.5 h-3.5 text-neutral-400 fill-current" viewBox="0 0 24 24">
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
        <div className="flex items-center gap-3 text-xs text-neutral-400 pt-0.5">
          {/* Eye Views */}
          <div className="flex items-center gap-1 font-normal">
            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-neutral-300 font-medium">{tool.viewsDisplay}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-[#FACC15] fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold text-neutral-300">{tool.rating.toFixed(1)}</span>
            <span className="text-neutral-400 text-[11px]">· {tool.reviewsCount} reseñas</span>
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
            Ejecutores, Externales, Herramientas y Más de <span className="text-accent">Roblox</span>
          </h1>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: '#D1D5DB' }}>
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
        <div className="bg-[#101216]/90 border border-neutral-800/80 rounded-xl p-4 shadow-xl backdrop-blur-md w-full xl:w-auto xl:min-w-[440px] shrink-0">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
              VERSIONES DE ROBLOX
            </span>
            <button
              type="button"
              onClick={() => setShowVersionsModal(true)}
              className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Ver más
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Windows Player */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 mb-0.5">
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
              <span className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">
                Anterior <span className="text-neutral-400">version-02c37bc51a384b8f</span>
              </span>
            </div>

            {/* Mac Player */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 mb-0.5">
                <svg className="w-3.5 h-3.5 text-neutral-400 fill-current" viewBox="0 0 24 24">
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
              <span className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">
                Anterior <span className="text-neutral-400">version-3bc33ee7ffad426f</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: EXECUTORS                                           */}
      {/* ------------------------------------------------------------- */}
      <section className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-2 border-b border-neutral-800/60">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Executors</h2>
            <span className="text-xs font-normal text-neutral-400">{filteredExecutors.length} items</span>
          </div>
          {renderFilterControls(execPlatform, setExecPlatform, execAccess, setExecAccess, execSort, setExecSort)}
        </div>

        {filteredExecutors.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border-theme rounded-xl">
            <p className="text-neutral-400 text-sm">No se encontraron ejecutores con los filtros seleccionados.</p>
            <button
              type="button"
              onClick={() => { setExecPlatform('all'); setExecAccess('all'); }}
              className="mt-2 text-xs text-accent font-bold underline"
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-2 border-b border-neutral-800/60">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Herramientas y Externales</h2>
            <span className="text-xs font-normal text-neutral-400">{filteredExternals.length} herramientas</span>
          </div>
          {renderFilterControls(extPlatform, setExtPlatform, extAccess, setExtAccess, extSort, setExtSort)}
        </div>

        {filteredExternals.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border-theme rounded-xl">
            <p className="text-neutral-400 text-sm">No se encontraron utilidades externas con los filtros seleccionados.</p>
            <button
              type="button"
              onClick={() => { setExtPlatform('all'); setExtAccess('all'); }}
              className="mt-2 text-xs text-accent font-bold underline"
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
      {/* TOOL DETAIL MODAL                                             */}
      {/* ------------------------------------------------------------- */}
      {selectedTool && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedTool(null)}>
          <div
            className="bg-card border border-border-theme rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Thumbnail Header */}
            <div className="relative aspect-video w-full bg-[#08090C] border-b border-border-theme">
              {selectedTool.imageSrc ? (
                <img
                  src={selectedTool.imageSrc}
                  alt={selectedTool.name}
                  className="w-full h-full object-cover select-none"
                />
              ) : (
                selectedTool.thumbnailComponent
              )}
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-black text-white">{selectedTool.name}</h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-accent/10 border border-accent text-accent">
                      {selectedTool.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Plataformas:{' '}
                    <span className="text-white font-semibold uppercase">
                      {selectedTool.platforms.join(', ')}
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-extrabold ${selectedTool.access === 'free' ? 'text-emerald-400' : 'text-[#EF4444]'}`}>
                    {selectedTool.priceDisplay}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-neutral-400 mt-1">
                    <span className="text-amber-400 font-bold">★ {selectedTool.rating}</span>
                    <span>({selectedTool.reviewsCount} reseñas)</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed">
                {selectedTool.description}
              </p>

              {/* Features */}
              <div className="bg-[#12141A] border border-neutral-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2.5">Características destacadas:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
                  {selectedTool.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Verified Safety Badge & Discord Support */}
              <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs text-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Herramienta verificada por la comunidad. ¿Dudas o necesitas soporte con este ejecutor?</span>
                </div>
                <a
                  href="https://discord.gg/mdvByagDr3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2]/20 hover:bg-[#5865F2] text-[#5865F2] hover:text-white border border-[#5865F2]/40 rounded-lg text-xs font-bold transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0777.0777 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                  Discord de Soporte
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={selectedTool.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-accent hover:opacity-90 text-black text-center font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visitar Página Oficial
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedTool(null)}
                  className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
