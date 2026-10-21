'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, supabase } from './AuthProvider';

const THEMES = [
  { id: 'predeterminado', name: 'Predeterminado', desc: 'NEGRO Y AMARILLO DORADO', color1: '#FACC15', color2: '#0A0F0D' },
  { id: 'gaming', name: 'Gaming', desc: 'NEGRO, AZUL ELÉCTRICO Y NEÓN', color1: '#0ea5e9', color2: '#1e3a8a' },
  { id: 'papel-calido', name: 'Papel cálido', desc: 'ARCHIVO ARTESANAL', color1: '#eab308', color2: '#fca5a5' },
  { id: 'noche-tinta', name: 'Noche tinta', desc: 'CONTRASTE OSCURO', color1: '#b45309', color2: '#451a03' },
  { id: 'bosque-suave', name: 'Bosque suave', desc: 'VERDES SERENOS', color1: '#86efac', color2: '#14532d' },
  { id: 'oceano-claro', name: 'Océano claro', desc: 'AZULES ABIERTOS', color1: '#93c5fd', color2: '#0f172a' },
  { id: 'lavanda', name: 'Lavanda editorial', desc: 'VIOLETA SUAVE', color1: '#f9a8d4', color2: '#701a75' },
  { id: 'rosa', name: 'Rosa de estudio', desc: 'CÁLIDO Y GRÁFICO', color1: '#fda4af', color2: '#881337' },
  { id: 'terracota', name: 'Terracota', desc: 'TIERRA Y ARCILLA', color1: '#fdba74', color2: '#7c2d12' },
  { id: 'sol', name: 'Sol de mediodía', desc: 'AMARILLO LUMINOSO', color1: '#fde047', color2: '#a16207' },
  { id: 'medianoche', name: 'Medianoche', desc: 'AZUL PROFUNDO', color1: '#67e8f9', color2: '#083344' },
  { id: 'tinta', name: 'Tinta negra', desc: 'CARBÓN Y CREMA', color1: '#d6d3d1', color2: '#1c1917' },
  { id: 'marea', name: 'Marea verde', desc: 'AGUA Y JADE', color1: '#6ee7b7', color2: '#064e3b' },
  { id: 'ciruela', name: 'Ciruela nocturna', desc: 'MORADO INTENSO', color1: '#f472b6', color2: '#4c1d95' },
  { id: 'monocromo', name: 'Blanco y negro', desc: 'GRADIENTE MONOCROMO', color1: '#f3f4f6', color2: '#000000' },
];

export default function ThemeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, updateUser } = useAuth();
  const [activeTheme, setActiveTheme] = useState('predeterminado');

  useEffect(() => {
    if (!isOpen) return;
    const current = typeof document !== 'undefined'
      ? (document.documentElement.getAttribute('data-theme') || (typeof window !== 'undefined' ? localStorage.getItem('chituk_theme') : null) || 'predeterminado')
      : 'predeterminado';
    setActiveTheme(current);
  }, [isOpen]);

  // Listener para cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentThemeObj = THEMES.find(t => t.id === activeTheme) || THEMES[0];

  const handleSelectTheme = (id: string) => {
    setActiveTheme(id);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', id);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chituk_theme', id);
      } catch (e) {}
    }
    
    if (user) {
      updateUser({ theme: id });
      // Sincronización en segundo plano sin congelar la interfaz
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            fetch('/api/users/theme', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ theme: id, id: user.id })
            }).catch(() => {});
          }
          supabase.from('users').update({ theme: id }).eq('id', user.id).then(() => {});
        } catch (err) {
          console.error("Error saving theme", err);
        }
      })();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
    >
      <div 
        className="bg-base border border-border-theme rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:p-7 border-b border-border-theme relative bg-card flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <p className="text-[10px] font-bold tracking-widest text-accent uppercase">Personalización visual</p>
            </div>
            <h2 id="theme-modal-title" className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Temas de Chituk
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Elige tu apariencia favorita. Toda la plataforma se adapta instantáneamente a tu selección.
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-card-hover border border-border-theme/60 transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Cerrar modal de temas"
            title="Cerrar (Esc)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Grid de Temas */}
        <div className="p-4 sm:p-7 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {THEMES.map((theme) => {
              const isActive = activeTheme === theme.id;
              
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`flex flex-col items-start gap-3.5 p-4 sm:p-4.5 rounded-xl border text-left transition-all duration-150 group cursor-pointer ${
                    isActive 
                      ? 'bg-card border-accent shadow-[0_0_18px_var(--color-accent)] ring-2 ring-accent' 
                      : 'bg-card border-border-theme hover:border-accent/50 hover:bg-card-hover hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div 
                      className="w-9 h-9 rounded-full border border-border-theme shadow-inner group-hover:scale-110 transition-transform"
                      style={{ background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})` }}
                    />
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent/15 px-2.5 py-1 rounded-md border border-accent/30 shadow-xs">
                        <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Activo
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        Activar
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground transition-colors">
                      {theme.name}
                    </h3>
                    <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mt-0.5">
                      {theme.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border-theme bg-card/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-muted w-full sm:w-auto">
            <span className="font-medium">Tema actual:</span>
            <span className="font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
              {currentThemeObj.name}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-card border border-border-theme transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold bg-accent text-accent-contrast hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              Listo / Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
