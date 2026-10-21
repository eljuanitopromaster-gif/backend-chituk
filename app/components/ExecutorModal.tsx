'use client';

import React from 'react';

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
  status: 'Actualizado' | 'Funcionando' | 'Beta' | 'Mantenimiento' | 'Parcheado' | string;
  description: string;
  features: string[];
  // Propiedades dinámicas de enlace
  downloadLink?: string;
  downloadUrl?: string;
  url?: string;
  download_url?: string;
  officialUrl?: string;
  link?: string;
  imageSrc?: string;
  thumbnailComponent?: React.ReactNode;
}

export interface ExecutorModalProps {
  tool?: ToolItem | null;
  item?: ToolItem | null;
  executor?: ToolItem | null;
  isOpen?: boolean;
  onClose: () => void;
  // Parámetro dinámico opcional para inyectar enlace directamente como prop
  downloadLink?: string;
  downloadUrl?: string;
  url?: string;
}

export default function ExecutorModal({
  tool,
  item,
  executor,
  isOpen = true,
  onClose,
  downloadLink,
  downloadUrl,
  url,
}: ExecutorModalProps) {
  // Soporta indistintamente tool, item o executor
  const currentItem = tool || item || executor;

  if (!isOpen || !currentItem) return null;

  // Resolución dinámica y flexible del enlace oficial:
  // 1. Props directas del componente (downloadLink, url, downloadUrl)
  // 2. Propiedades del objeto provisto desde base de datos o JSON
  const officialUrl =
    downloadLink ||
    url ||
    downloadUrl ||
    currentItem.downloadLink ||
    currentItem.url ||
    currentItem.downloadUrl ||
    currentItem.download_url ||
    currentItem.officialUrl ||
    currentItem.link ||
    '#';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border-theme rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Thumbnail Header */}
        <div className="relative aspect-video w-full bg-[#08090C] border-b border-border-theme">
          {currentItem.imageSrc ? (
            <img
              src={currentItem.imageSrc}
              alt={currentItem.name}
              className="w-full h-full object-cover select-none"
            />
          ) : (
            currentItem.thumbnailComponent
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-base/80 hover:bg-base text-foreground border border-border-theme flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar modal"
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
                <h2 className="text-2xl font-black text-foreground">{currentItem.name}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-accent/10 border border-accent text-accent">
                  {currentItem.status}
                </span>
              </div>
              <p className="text-xs text-muted">
                Plataformas:{' '}
                <span className="text-foreground font-semibold uppercase">
                  {currentItem.platforms?.join(', ')}
                </span>
              </p>
            </div>

            <div className="text-right">
              <span
                className={`text-sm font-extrabold ${
                  currentItem.access === 'free' ? 'text-emerald-400' : 'text-[#EF4444]'
                }`}
              >
                {currentItem.priceDisplay}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted mt-1">
                <span className="text-amber-400 font-bold">★ {currentItem.rating}</span>
                <span>({currentItem.reviewsCount} reseñas)</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed">{currentItem.description}</p>

          {/* Features */}
          {currentItem.features && currentItem.features.length > 0 && (
            <div className="bg-base border border-border-theme rounded-xl p-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">
                Características destacadas:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted">
                {currentItem.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-accent shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verified Safety Badge & Discord Support */}
          <div className="p-3.5 bg-base border border-border-theme rounded-xl text-xs text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
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
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0777.0777 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
              Discord de Soporte
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-accent hover:opacity-90 text-accent-contrast text-center font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Visitar Página Oficial
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-card hover:bg-card-hover text-foreground font-semibold text-sm rounded-xl border border-border-theme transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
