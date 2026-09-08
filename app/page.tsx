'use client'

import React, { useEffect, useState } from 'react';
import TermsModal from './components/TermsModal';
import Script from 'next/script';

type ScriptItem = {
  id: string;
  title: string;
  description: string;
  script: string;
  scriptMode: string;
  kind: string;
  authorId: string;
  youtubeUrl: string | null;
  destinationUrl: string | null;
  image: string | null;
  language: string;
  createdAt: string;
  status: string;
};

export default function ChitukPage() {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const res = await fetch('/api/scripts');
        if (res.ok) {
          const data = await res.json();
          setScripts(data);
        }
      } catch (e) {
        console.error("Failed to fetch scripts", e);
      } finally {
        setLoading(false);
      }
    };
    fetchScripts();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative">
      <TermsModal />
      
      {/* Header and Top Actions */}
      <header className="flex justify-between items-center mb-12 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Chituk <span className="text-[#FACC15]">Scripts</span></h1>
          <p className="text-neutral-400">Una colección premium de scripts para la comunidad.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => (window as any).openAuth && (window as any).openAuth()} 
            className="px-6 py-2 rounded-full font-bold bg-[#FACC15] text-black hover:bg-yellow-500 transition-colors shadow-[0_0_15px_rgba(250,204,21,0.2)]"
          >
            Acceder
          </button>
          <button 
            onClick={() => (window as any).openPublish && (window as any).openPublish()} 
            className="px-6 py-2 rounded-full font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
          >
            Publicar
          </button>
        </div>
      </header>

      {/* Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-neutral-500 col-span-full text-center py-12">Cargando scripts del servidor...</p>
        ) : scripts.length === 0 ? (
          <p className="text-neutral-500 col-span-full text-center py-12">No hay scripts disponibles en este momento.</p>
        ) : (
          scripts.map(script => (
            <div key={script.id} className="bg-[#131A15] border border-neutral-800 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col group">
              <div className="h-40 bg-neutral-900 relative border-b border-neutral-800 flex items-center justify-center">
                {script.image ? (
                  <img src={script.image} alt={script.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="text-neutral-700 font-mono opacity-50">&lt;/&gt;</div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold px-3 py-1 bg-[#0A0F0D] border border-neutral-800 text-[#FACC15] rounded-full uppercase tracking-wider">
                    {script.language || 'Luau'}
                  </span>
                  <span className="text-xs text-neutral-500">{new Date(script.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{script.title}</h3>
                <p className="text-sm text-neutral-400 mb-6 line-clamp-3 flex-1">{script.description}</p>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-neutral-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] text-white">
                      {script.authorId.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-neutral-400 font-medium">{script.authorId}</span>
                  </div>
                  <button 
                    onClick={() => {
                        // Attempt to use legacy function if available
                        if ((window as any).openProject) {
                            (window as any).openProject(script.id);
                        }
                    }}
                    className="text-xs font-bold text-white hover:text-[#FACC15] transition-colors"
                  >
                    Ver Código &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Script for legacy modals (Auth, Publish, etc.) */}
      <Script src="/chituk-script.js" strategy="afterInteractive" />
      
      {/* Hidden container to mount legacy Modals safely so they don't break our React tree */}
      <div id="modal-backdrop" className="backdrop">
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <header className="modal-head">
            <div>
              <p id="modal-kicker" className="text-xs font-bold text-[#FACC15] uppercase tracking-widest mb-1">CHITUK</p>
              <h2 id="modal-title" className="text-2xl font-bold text-white m-0">Espacio</h2>
            </div>
            <button id="close-modal" className="close" type="button" aria-label="Cerrar">×</button>
          </header>
          <div id="modal-body" className="modal-body"></div>
        </section>
      </div>
      <div id="notice" className="notice"></div>
    </div>
  );
}
