'use client';

import React, { useState } from 'react';
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
  const { user } = useAuth();
  const [activeTheme, setActiveTheme] = useState('predeterminado');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user && user.theme) {
      setActiveTheme(user.theme);
    } else {
      const current = typeof document !== 'undefined'
        ? (document.documentElement.getAttribute('data-theme') || (typeof window !== 'undefined' ? localStorage.getItem('chituk_theme') : null) || 'predeterminado')
        : 'predeterminado';
      setActiveTheme(current);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSelectTheme = async (id: string) => {
    setActiveTheme(id);
    document.documentElement.setAttribute('data-theme', id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chituk_theme', id);
    }
    
    if (user) {
      user.theme = id;
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch('/api/users/theme', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ theme: id, id: user.id })
          });
        }
        await supabase.from('users').update({ theme: id }).eq('id', user.id);
      } catch (err) {
        console.error("Error saving theme", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-base border border-border-theme rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-8 border-b border-border-theme relative bg-card">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <p className="text-[10px] font-bold tracking-widest text-accent uppercase mb-1">Personalización</p>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Temas Visuales</h2>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto">
          <p className="text-sm text-muted mb-8">
            Elige tu tema preferido. Cada elemento de Chituk se adapta automáticamente a tu paleta de color.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEMES.map((theme) => {
              const isActive = activeTheme === theme.id;
              
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`flex flex-col items-start gap-4 p-5 rounded-xl border text-left transition-all duration-200 group cursor-pointer ${
                    isActive 
                      ? 'bg-card border-accent shadow-[0_0_15px_var(--color-accent)] ring-1 ring-accent' 
                      : 'bg-card border-border-theme hover:border-accent/40 hover:-translate-y-1'
                  }`}
                >
                  <div className="flex justify-between items-start w-full mb-1">
                    <div 
                      className="w-10 h-10 rounded-full border border-border-theme shadow-inner group-hover:scale-110 transition-transform"
                      style={{ background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})` }}
                    />
                    {isActive && (
                      <span className="text-xs font-bold text-accent bg-accent/15 px-2.5 py-1 rounded-md border border-accent/30">
                        Activo
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-base font-bold mb-1 transition-colors ${isActive ? 'text-accent' : 'text-foreground'}`}>
                      {theme.name}
                    </h3>
                    <p className="text-[10px] text-muted uppercase tracking-wider font-bold">
                      {theme.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
