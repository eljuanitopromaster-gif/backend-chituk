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
  authorName?: string;
  likesCount?: number;
};

import { useRouter } from 'next/navigation';
import { supabase } from './components/AuthProvider';

export default function ChitukPage() {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const handleLike = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Inicia sesión para dar like");
        return;
      }
      
      const token = session.access_token;
      
      const likedList = JSON.parse(localStorage.getItem('user_liked_scripts') || '[]');
      const isCurrentlyLiked = likedList.includes(id);
      const action = isCurrentlyLiked ? 'unlike' : 'like';

      const res = await fetch(`/api/scripts/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        const { likes } = await res.json();
        setScripts(prev => prev.map(s => s.id === id ? { ...s, likesCount: likes } : s));
        
        let newList;
        if (action === 'like') {
          newList = [...likedList, id];
        } else {
          newList = likedList.filter((x: string) => x !== id);
        }
        localStorage.setItem('user_liked_scripts', JSON.stringify([...new Set(newList)]));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative">
      <TermsModal />
      
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Descubre Scripts</h1>
        <p className="text-neutral-400">Explora la colección de scripts para la comunidad.</p>
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
                
                {script.scriptMode && script.scriptMode !== 'script' && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {script.scriptMode.includes('no-key') && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-[#1A1A1A] border border-neutral-800 text-neutral-400 rounded-md">No key</span>
                    )}
                    {script.scriptMode.includes('mobile-friendly') && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-[#1A1A1A] border border-neutral-800 text-neutral-400 rounded-md">Mobile</span>
                    )}
                    {script.scriptMode.includes('open-source') && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-[#1A1A1A] border border-neutral-800 text-neutral-400 rounded-md">Open source</span>
                    )}
                    {script.scriptMode.includes('paid') && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-[#1A1A1A] border border-neutral-800 text-neutral-400 rounded-md">Paid</span>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-neutral-400 mb-6 line-clamp-3 flex-1">{script.description}</p>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-neutral-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] text-white shrink-0">
                      {(script.authorName || script.authorId).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-neutral-400 font-medium truncate max-w-[100px]">
                      {script.authorName || script.authorId}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <button 
                      onClick={() => handleLike(script.id)}
                      className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                        (typeof window !== 'undefined' && JSON.parse(window.localStorage.getItem('user_liked_scripts') || '[]').includes(script.id))
                          ? 'text-red-500' 
                          : 'text-neutral-400 hover:text-red-500'
                      }`}
                      title="Me gusta"
                    >
                      <svg className="w-4 h-4" fill={(typeof window !== 'undefined' && JSON.parse(window.localStorage.getItem('user_liked_scripts') || '[]').includes(script.id)) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {script.likesCount || 0}
                    </button>
                    <button 
                      onClick={() => router.push(`/scripts/${script.id}`)}
                      className="text-xs font-bold text-white hover:text-[#FACC15] transition-colors"
                    >
                      Ver Código &rarr;
                    </button>
                  </div>
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
