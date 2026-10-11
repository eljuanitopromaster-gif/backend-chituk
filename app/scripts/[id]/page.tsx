'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, supabase } from '../../components/AuthProvider';
import CommentsSection from '../../components/CommentsSection';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Hace 1 día';
  return `Hace ${diffInDays} días`;
}

const KNOWN_ROBLOX_GAMES: Record<string, string> = {
  'blox fruits': 'https://www.roblox.com/games/2753915549/Blox-Fruits',
  'da hood': 'https://www.roblox.com/games/2788229376/Da-Hood',
  'arsenal': 'https://www.roblox.com/games/286090429/Arsenal',
  'adopt me': 'https://www.roblox.com/games/920587237/Adopt-Me',
  'pet simulator': 'https://www.roblox.com/games/8737899170/Pet-Simulator-99',
  'pet simulator 99': 'https://www.roblox.com/games/8737899170/Pet-Simulator-99',
  'murder mystery': 'https://www.roblox.com/games/142823291/Murder-Mystery-2',
  'murder mystery 2': 'https://www.roblox.com/games/142823291/Murder-Mystery-2',
  'mm2': 'https://www.roblox.com/games/142823291/Murder-Mystery-2',
  'blade ball': 'https://www.roblox.com/games/13772394625/Blade-Ball',
  'brookhaven': 'https://www.roblox.com/games/4924922222/Brookhaven-RP',
  'brookhaven rp': 'https://www.roblox.com/games/4924922222/Brookhaven-RP',
  'king legacy': 'https://www.roblox.com/games/3321568903/King-Legacy',
  'fisch': 'https://www.roblox.com/games/16732694052/Fisch',
  'rivals': 'https://www.roblox.com/games/17625359962/RIVALS',
  'doors': 'https://www.roblox.com/games/6516141723/DOORS',
  'bedwars': 'https://www.roblox.com/games/6872265039/BedWars'
};

function getRobloxPlayUrl(script: any): string {
  if (!script) return 'https://www.roblox.com/home';
  
  if (script.destinationUrl && typeof script.destinationUrl === 'string' && script.destinationUrl.startsWith('http')) {
    return script.destinationUrl;
  }

  if (script.game_id && /^\d+$/.test(String(script.game_id).trim())) {
    return `https://www.roblox.com/games/${String(script.game_id).trim()}`;
  }

  const firstLine = (script.description || '').split('\n')[0].trim();
  const candidates = [firstLine, script.title || ''];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const numericMatch = candidate.match(/\b\d{6,14}\b/);
    if (numericMatch) {
      return `https://www.roblox.com/games/${numericMatch[0]}`;
    }
    const lower = candidate.toLowerCase();
    for (const [key, url] of Object.entries(KNOWN_ROBLOX_GAMES)) {
      if (lower.includes(key)) {
        return url;
      }
    }
  }

  if (firstLine && firstLine.length > 2 && !['nose', 'sin juego', 'desconocido', 'ninguno', 'test', 'prueba'].includes(firstLine.toLowerCase())) {
    return `https://www.roblox.com/discover/?Keyword=${encodeURIComponent(firstLine)}`;
  }

  return 'https://www.roblox.com/discover';
}

export default function ScriptViewPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'comments'>('about');

  useEffect(() => {
    if (!id) return;
    
    async function fetchScript() {
      try {
        const res = await fetch(`/api/scripts/${id}`);
        if (!res.ok) {
          throw new Error('Script no encontrado');
        }
        const data = await res.json();
        setScript(data);

        // Fetch user's like and favorite status if logged in
        if (user) {
          const [{ data: likeData }, { data: favData }] = await Promise.all([
            supabase.from('user_likes').select('user_id').eq('user_id', user.id).eq('project_id', id).maybeSingle(),
            supabase.from('user_favorites').select('user_id').eq('user_id', user.id).eq('project_id', id).maybeSingle()
          ]);
          if (likeData) setIsLiked(true);
          if (favData) setIsFavorited(true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchScript();
  }, [id, user]);

  const handleCopy = async () => {
    if (!script) return;
    
    try {
      await navigator.clipboard.writeText(script.script);
      setCopied(true);
      
      await fetch(`/api/scripts/${id}/copy`, { method: 'POST' });
      
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePlay = () => {
    if (!script) return;
    setPlaying(true);
    const targetUrl = getRobloxPlayUrl(script);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setPlaying(false), 2000);
  };

  const handleLike = async () => {
    if (!user) {
      alert("Inicia sesión para dar like");
      openAuthModal('login');
      return;
    }

    const previousState = isLiked;
    setIsLiked(!previousState);
    setScript((prev: any) => ({ ...prev, likesCount: prev.likesCount + (previousState ? -1 : 1) }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/scripts/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const { likes, action } = await res.json();
        setScript((prev: any) => ({ ...prev, likesCount: likes }));
        setIsLiked(action === 'like');
      } else {
        setIsLiked(previousState);
        setScript((prev: any) => ({ ...prev, likesCount: prev.likesCount + (previousState ? 1 : -1) }));
      }
    } catch (e) {
      console.error(e);
      setIsLiked(previousState);
      setScript((prev: any) => ({ ...prev, likesCount: prev.likesCount + (previousState ? 1 : -1) }));
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      alert("Inicia sesión para añadir a favoritos");
      openAuthModal('login');
      return;
    }

    const previousState = isFavorited;
    setIsFavorited(!previousState);
    setScript((prev: any) => ({ ...prev, favorites: (prev.favorites || 0) + (previousState ? -1 : 1) }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/scripts/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const { favorites, action } = await res.json();
        setScript((prev: any) => ({ ...prev, favorites: favorites }));
        setIsFavorited(action === 'favorite');
      } else {
        setIsFavorited(previousState);
        setScript((prev: any) => ({ ...prev, favorites: (prev.favorites || 0) + (previousState ? 1 : -1) }));
      }
    } catch (e) {
      console.error(e);
      setIsFavorited(previousState);
      setScript((prev: any) => ({ ...prev, favorites: (prev.favorites || 0) + (previousState ? 1 : -1) }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-white min-h-screen">
        <p className="text-neutral-500 animate-pulse text-lg">Cargando script...</p>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-4 text-white min-h-screen">
        <p className="text-red-400 text-lg">{error || 'Script no encontrado'}</p>
        <button onClick={() => router.push('/')} className="text-neutral-400 hover:text-white transition-colors underline">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full text-white min-h-screen">
      <button onClick={() => router.back()} className="text-sm text-neutral-500 hover:text-white transition-colors mb-6 flex items-center gap-1">
        &larr; Volver
      </button>

      {/* TOP SECTION */}
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        {/* Left: Image Container */}
        <div className="w-full md:w-[55%] lg:w-[60%] relative rounded-xl overflow-hidden aspect-video bg-neutral-900 shadow-2xl">
          {script.image ? (
            <img src={script.image} className="w-full h-full object-cover" alt="Portada del Script" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-neutral-700 font-mono text-5xl">
              &lt;/&gt;
            </div>
          )}
          
          {/* Badges */}
          {script.is_mobile_friendly && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[#0EA5E9] font-bold text-xs bg-black/60 px-2 py-1 rounded">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
               </svg>
               PARA MÓVIL
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/60 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
             </svg>
             {script.views || 0}
          </div>
          <div className="absolute bottom-4 right-4 bg-black/60 px-2.5 py-1 rounded text-xs font-bold">
             {timeAgo(script.createdAt)}
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-3">
             <div className="w-5 h-5 bg-neutral-800 rounded"></div>
             {script.description?.split('\n')[0] || 'Juego no especificado'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight tracking-tight">
             {script.title}
          </h1>
          <div className="flex items-center gap-2 mb-8">
             <span className="text-neutral-400 text-sm">por</span>
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] text-white shrink-0 overflow-hidden border border-neutral-700">
                 {script.authorAvatar ? (
                   <img src={script.authorAvatar} alt={script.authorName || 'Avatar'} className="w-full h-full object-cover" />
                 ) : (
                   <span>{(script.authorName || script.authorId || '?').charAt(0).toUpperCase()}</span>
                 )}
               </div>
               <span className="font-bold text-white text-sm">{script.authorName || script.authorId}</span>
             </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mb-4">
             <button 
                onClick={handleCopy} 
                className="flex-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
             >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Copiar Script
             </button>
             <button 
                onClick={handlePlay}
                className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.98] text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#22C55E]/20"
                title="Abrir juego en Roblox"
             >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.694 4.092L19.306 0 24 19.908 9.306 24 0 4.092l4.694 0zm8.006 12.396l3.5-1.045-1.2-3.8-3.5 1.045 1.2 3.8z"/>
                </svg>
                {playing ? 'Abriendo Roblox...' : 'Jugar'}
             </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {script.scriptMode?.includes('no-key') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card-hover text-neutral-400 font-bold text-xs rounded-md border border-neutral-800">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /><line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                Sin key
              </div>
            )}
            {script.is_mobile_friendly && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card-hover text-neutral-400 font-bold text-xs rounded-md border border-neutral-800">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Para móvil
              </div>
            )}
            {script.scriptMode?.includes('open-source') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card-hover text-neutral-400 font-bold text-xs rounded-md border border-neutral-800">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                Código abierto
              </div>
            )}
            {script.scriptMode?.includes('paid') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card-hover text-neutral-400 font-bold text-xs rounded-md border border-neutral-800">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                De pago
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 sm:gap-8 text-neutral-400 text-xs font-bold mt-2 flex-wrap">
             <button onClick={handleFavorite} className={`flex items-center gap-2 transition-colors cursor-pointer ${
               isFavorited ? 'text-yellow-500' : 'hover:text-white'
             }`}>
                <svg className="w-4 h-4" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {script.favorites || 0} FAVORITOS
             </button>
             <button onClick={handleLike} className={`flex items-center gap-2 transition-colors cursor-pointer ${
               isLiked ? 'text-red-500' : 'hover:text-white'
             }`}>
                <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {script.likesCount || 0} LIKES
             </button>
             <button 
               onClick={() => {
                 setActiveTab('comments');
                 const el = document.getElementById('seccion-comentarios');
                 el?.scrollIntoView({ behavior: 'smooth' });
               }}
               className="flex items-center gap-2 hover:text-accent transition-colors cursor-pointer"
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                OPINIONES
             </button>
          </div>
        </div>
      </div>

      {/* TABS SECTION */}
      <div className="flex justify-between items-end border-b border-neutral-800 mb-8 pt-4">
        <div className="flex gap-8">
          <button 
            onClick={() => setActiveTab('about')}
            className={`font-bold text-lg pb-3 px-1 transition-colors cursor-pointer ${
              activeTab === 'about'
                ? 'text-white border-b-[3px] border-accent'
                : 'text-neutral-400 hover:text-white border-b-[3px] border-transparent'
            }`}
          >
            Acerca del Script
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`font-bold text-lg pb-3 px-1 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'text-white border-b-[3px] border-accent'
                : 'text-neutral-400 hover:text-white border-b-[3px] border-transparent'
            }`}
          >
            Opiniones y Comentarios
          </button>
        </div>
        <button className="text-neutral-400 hover:text-white flex items-center gap-2 text-sm font-bold pb-3 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          Reportar
        </button>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-5xl">
        {activeTab === 'about' ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Descripción</h2>
            <div className="text-neutral-300 mb-12 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {script.description || 'Sin descripción disponible.'}
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Código del Script</h2>
            </div>
            
            <div className="relative bg-card-hover border border-neutral-800/50 rounded-xl overflow-hidden group mb-10 shadow-xl">
              <div className="absolute top-3 right-3 flex gap-2">
                <button 
                    onClick={handleCopy} 
                    className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-neutral-300 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors border border-neutral-700/50 cursor-pointer"
                >
                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                   </svg>
                   {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="p-6 pt-16 overflow-x-auto min-h-[150px]">
                <pre className="text-sm font-mono text-neutral-400">
                  {script.script}
                </pre>
              </div>
            </div>

            {/* SECCIÓN DE COMENTARIOS Y OPINIONES */}
            <CommentsSection scriptId={id} scriptAuthorId={script.authorId} />
          </>
        ) : (
          <CommentsSection scriptId={id} scriptAuthorId={script.authorId} />
        )}
      </div>
    </div>
  );
}
