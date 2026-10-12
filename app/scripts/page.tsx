'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../components/AuthProvider';

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

export default function ScriptsCatalogPage() {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('search') || params.get('game');
      if (query) {
        setSearchTerm(query);
      }
    }

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

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = (script.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (script.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = selectedLanguage === 'all' || (script.language || '').toLowerCase() === selectedLanguage.toLowerCase();
    return matchesSearch && matchesLang;
  });

  const availableLanguages = Array.from(new Set(scripts.map(s => s.language).filter(Boolean)));

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="text-accent">&lt;/&gt;</span> Catálogo de Scripts
          </h1>
          <p className="text-neutral-400">Encuentra y utiliza scripts compartidos por la comunidad.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-card border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
          />

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-2 bg-card border border-neutral-800 rounded-lg text-sm text-neutral-300 focus:outline-none focus:border-accent"
          >
            <option value="all">Todos los lenguajes</option>
            {availableLanguages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-neutral-500 col-span-full text-center py-12">Cargando scripts del servidor...</p>
        ) : filteredScripts.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-card border border-neutral-800 rounded-xl p-8">
            <p className="text-neutral-400 text-lg mb-2">No se encontraron scripts.</p>
            <p className="text-neutral-500 text-sm">Intenta con otro término de búsqueda o publica el primero.</p>
          </div>
        ) : (
          filteredScripts.map(script => (
            <div key={script.id} className="bg-card border border-border-theme rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col group">
              <div className="h-40 bg-base relative border-b border-border-theme flex items-center justify-center">
                {script.image ? (
                  <img src={script.image} alt={script.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="text-muted/40 font-mono text-3xl">&lt;/&gt;</div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold px-3 py-1 bg-base border border-border-theme text-accent rounded-full uppercase tracking-wider">
                    {script.language || 'Luau'}
                  </span>
                  <span className="text-xs text-muted">{new Date(script.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{script.title}</h3>
                
                {script.scriptMode && script.scriptMode !== 'script' && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {script.scriptMode.includes('no-key') && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-card-hover border border-border-theme text-muted rounded-md">No key</span>
                    )}
                    {script.scriptMode.includes('mobile-friendly') && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-card-hover border border-border-theme text-muted rounded-md">Mobile</span>
                    )}
                    {script.scriptMode.includes('open-source') && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-card-hover border border-border-theme text-muted rounded-md">Open source</span>
                    )}
                    {script.scriptMode.includes('paid') && (
                      <span className="text-[10px] font-bold px-2 py-1 bg-card-hover border border-border-theme text-muted rounded-md">Paid</span>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-muted mb-6 line-clamp-3 flex-1">{script.description}</p>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-border-theme">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-base border border-border-theme flex items-center justify-center text-[10px] text-foreground shrink-0 font-bold">
                      {(script.authorName || script.authorId || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-muted font-medium truncate max-w-[100px]">
                      {script.authorName || script.authorId}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <button 
                      onClick={() => handleLike(script.id)}
                      className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                        (typeof window !== 'undefined' && JSON.parse(window.localStorage.getItem('user_liked_scripts') || '[]').includes(script.id))
                          ? 'text-red-500' 
                          : 'text-muted hover:text-red-500'
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
                      className="text-xs font-bold text-foreground hover:text-accent transition-colors cursor-pointer"
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
    </div>
  );
}
