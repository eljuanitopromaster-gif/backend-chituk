'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface GameItem {
  id: string | number;
  name: string;
  image: string;
  icon?: string;
  color?: string;
  keywords?: string[];
  description?: string;
}

const GRADIENTS = [
  'from-purple-500/20 to-transparent',
  'from-red-500/20 to-transparent',
  'from-green-500/20 to-transparent',
  'from-blue-500/20 to-transparent',
  'from-yellow-500/20 to-transparent',
  'from-orange-500/20 to-transparent',
  'from-pink-500/20 to-transparent',
  'from-sky-500/20 to-transparent'
];

const BASE_GAMES: GameItem[] = [
  {
    id: 'c1f7b62e-4b2a-43c2-a8c6-33924f780001',
    name: 'Blox Fruits',
    image: '/games/bloxfruits.png',
    icon: '🍇',
    color: 'from-purple-500/20 to-transparent',
    keywords: ['blox fruits', 'bloxfruits']
  },
  {
    id: 'c1f7b62e-4b2a-43c2-a8c6-33924f780002',
    name: 'Da Hood',
    image: '/games/dahood.png',
    icon: '👊',
    color: 'from-red-500/20 to-transparent',
    keywords: ['da hood', 'dahood']
  },
  {
    id: 'c1f7b62e-4b2a-43c2-a8c6-33924f780005',
    name: 'Arsenal',
    image: '/games/arsenal.png',
    icon: '🔫',
    color: 'from-green-500/20 to-transparent',
    keywords: ['arsenal']
  },
  {
    id: 'c1f7b62e-4b2a-43c2-a8c6-33924f780006',
    name: 'Adopt Me!',
    image: '/games/adoptme.png',
    icon: '🐶',
    color: 'from-blue-500/20 to-transparent',
    keywords: ['adopt me', 'adoptme']
  },
  {
    id: 'c1f7b62e-4b2a-43c2-a8c6-33924f780004',
    name: 'Pet Simulator 99',
    image: '/games/petsimulator99.png',
    icon: '🐱',
    color: 'from-yellow-500/20 to-transparent',
    keywords: ['pet simulator 99', 'pet simulator', 'ps99']
  },
  {
    id: 'c1f7b62e-4b2a-43c2-a8c6-33924f780007',
    name: 'Murder Mystery 2',
    image: '/games/mm2.png',
    icon: '🔪',
    color: 'from-orange-500/20 to-transparent',
    keywords: ['murder mystery 2', 'murder mystery', 'mm2']
  },
  {
    id: 'c1f7b62e-4b2a-43c2-a8c6-33924f780003',
    name: 'Blade Ball',
    image: '/games/bladeball.png',
    icon: '⚔️',
    color: 'from-red-600/20 to-transparent',
    keywords: ['blade ball', 'bladeball']
  },
  {
    id: 'c1f7b62e-4b2a-43c2-a8c6-33924f780008',
    name: 'Brookhaven RP',
    image: '/games/brookhaven.png',
    icon: '🏠',
    color: 'from-sky-500/20 to-transparent',
    keywords: ['brookhaven rp', 'brookhaven']
  }
];

export default function JuegosPage() {
  const [games, setGames] = useState<GameItem[]>(BASE_GAMES);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let loadedGames = BASE_GAMES;

        // 1. Obtener catálogo dinámico
        try {
          const resGames = await fetch('/api/games');
          if (resGames.ok) {
            const dataGames = await resGames.json();
            if (dataGames.games && Array.isArray(dataGames.games) && dataGames.games.length > 0) {
              loadedGames = dataGames.games.map((g: any, index: number) => ({
                id: g.id,
                name: g.title || g.name,
                image: g.image || '/games/bloxfruits.png',
                icon: '🎮',
                color: GRADIENTS[index % GRADIENTS.length],
                keywords: [(g.title || g.name || '').toLowerCase()],
                description: g.description
              }));
              setGames(loadedGames);
            }
          }
        } catch (e) {
          console.warn("Could not load dynamic games catalog:", e);
        }

        // 2. Obtener recuento de scripts asociados
        const resScripts = await fetch('/api/scripts');
        if (resScripts.ok) {
          const scripts = await resScripts.json();
          if (Array.isArray(scripts)) {
            const newCounts: Record<string, number> = {};

            scripts.forEach((script: any) => {
              const sGameId = script.game_id;
              const title = (script.title || '').toLowerCase();
              const desc = (script.description || '').toLowerCase();
              const firstLine = desc.split('\n')[0].trim();

              loadedGames.forEach(game => {
                const gameKey = String(game.id);
                // Matchear por game_id directo o por texto
                const matchesId = sGameId && String(sGameId) === gameKey;
                const matchesText = (game.keywords || [game.name.toLowerCase()]).some(kw =>
                  firstLine.includes(kw) || title.includes(kw) || desc.includes(kw)
                );

                if (matchesId || matchesText) {
                  newCounts[gameKey] = (newCounts[gameKey] || 0) + 1;
                }
              });
            });

            setCounts(newCounts);
          }
        }
      } catch (err) {
        console.error("Error al cargar datos de juegos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full relative">
      <header className="mb-6 sm:mb-10">
        <p className="text-xs sm:text-sm font-bold text-accent uppercase tracking-widest mb-1">Directorios</p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">Explorar por Juego</h1>
        <p className="text-muted text-sm sm:text-base md:text-lg">Encuentra scripts específicos para tus juegos favoritos en Roblox.</p>
      </header>

      {/* Grid of Games */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {games.map((game) => {
          const scriptCount = counts[String(game.id)] || 0;
          return (
            <Link 
              key={game.id} 
              href={`/scripts?search=${encodeURIComponent(game.name)}`}
              className="group relative bg-card border border-border-theme rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-accent/5 hover:border-accent/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col items-center text-center"
            >
              {/* Background Gradient Effect */}
              <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${game.color || 'from-accent/20 to-transparent'} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-base border border-border-theme rounded-2xl flex items-center justify-center overflow-hidden mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  {game.image ? (
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover select-none"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-3xl">🎮</span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-accent transition-colors">{game.name}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-card-hover border border-border-theme rounded-full text-xs font-bold text-foreground">
                  <div className={`w-1.5 h-1.5 rounded-full ${scriptCount > 0 ? 'bg-success' : 'bg-muted'}`}></div>
                  {scriptCount} Scripts disponibles
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Search Hint or Missing Game */}
      <div className="mt-10 sm:mt-16 flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-card border border-border-theme rounded-2xl border-dashed">
        <svg className="w-8 h-8 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-foreground font-bold text-base sm:text-lg mb-1">¿No encuentras tu juego?</h3>
        <p className="text-xs sm:text-sm text-muted max-w-md">
          Usa la barra de búsqueda en la parte superior para buscar cualquier juego por su ID o nombre, o solicita a los publicadores en nuestra comunidad.
        </p>
      </div>
    </div>
  );
}
