'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface GameItem {
  id: number;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

const BASE_GAMES: GameItem[] = [
  {
    id: 1,
    name: 'Blox Fruits',
    icon: '🍇',
    color: 'from-purple-500/20 to-transparent',
    keywords: ['blox fruits', 'bloxfruits']
  },
  {
    id: 2,
    name: 'Da Hood',
    icon: '👊',
    color: 'from-red-500/20 to-transparent',
    keywords: ['da hood', 'dahood']
  },
  {
    id: 3,
    name: 'Arsenal',
    icon: '🔫',
    color: 'from-green-500/20 to-transparent',
    keywords: ['arsenal']
  },
  {
    id: 4,
    name: 'Adopt Me!',
    icon: '🐶',
    color: 'from-blue-500/20 to-transparent',
    keywords: ['adopt me', 'adoptme']
  },
  {
    id: 5,
    name: 'Pet Simulator 99',
    icon: '🐱',
    color: 'from-yellow-500/20 to-transparent',
    keywords: ['pet simulator 99', 'pet simulator', 'ps99']
  },
  {
    id: 6,
    name: 'Murder Mystery 2',
    icon: '🔪',
    color: 'from-orange-500/20 to-transparent',
    keywords: ['murder mystery 2', 'murder mystery', 'mm2']
  },
  {
    id: 7,
    name: 'Blade Ball',
    icon: '⚔️',
    color: 'from-red-600/20 to-transparent',
    keywords: ['blade ball', 'bladeball']
  },
  {
    id: 8,
    name: 'Brookhaven RP',
    icon: '🏠',
    color: 'from-sky-500/20 to-transparent',
    keywords: ['brookhaven rp', 'brookhaven']
  }
];

export default function JuegosPage() {
  const [counts, setCounts] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameCounts = async () => {
      try {
        const res = await fetch('/api/scripts');
        if (res.ok) {
          const scripts = await res.json();
          if (Array.isArray(scripts)) {
            const newCounts: Record<number, number> = {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
              6: 0,
              7: 0,
              8: 0
            };

            scripts.forEach((script: any) => {
              const title = (script.title || '').toLowerCase();
              const desc = (script.description || '').toLowerCase();
              const firstLine = desc.split('\n')[0].trim();

              BASE_GAMES.forEach(game => {
                const matches = game.keywords.some(kw => 
                  firstLine.includes(kw) || title.includes(kw) || desc.includes(kw)
                );
                if (matches) {
                  newCounts[game.id] = (newCounts[game.id] || 0) + 1;
                }
              });
            });

            setCounts(newCounts);
          }
        }
      } catch (err) {
        console.error("Error al cargar contador de juegos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameCounts();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative">
      <header className="mb-10">
        <p className="text-sm font-bold text-accent uppercase tracking-widest mb-1">Directorios</p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Explorar por Juego</h1>
        <p className="text-neutral-400 text-lg">Encuentra scripts específicos para tus juegos favoritos en Roblox.</p>
      </header>

      {/* Grid of Games */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {BASE_GAMES.map((game) => {
          const scriptCount = counts[game.id] || 0;
          return (
            <Link 
              key={game.id} 
              href={`/scripts?search=${encodeURIComponent(game.name)}`}
              className="group relative bg-card border border-neutral-800 rounded-2xl p-6 shadow-xl hover:shadow-accent/5 hover:border-neutral-600 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col items-center text-center"
            >
              {/* Background Gradient Effect */}
              <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${game.color} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-base border border-neutral-800 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {game.icon}
                </div>
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors">{game.name}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-card-hover border border-neutral-700/50 rounded-full text-xs font-bold text-neutral-300">
                  <div className={`w-1.5 h-1.5 rounded-full ${scriptCount > 0 ? 'bg-[#22C55E]' : 'bg-neutral-500'}`}></div>
                  {scriptCount} Scripts disponibles
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Search Hint or Missing Game */}
      <div className="mt-16 flex flex-col items-center justify-center text-center p-8 bg-neutral-900/30 border border-neutral-800/50 rounded-2xl border-dashed">
        <svg className="w-8 h-8 text-neutral-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-white font-bold text-lg mb-1">¿No encuentras tu juego?</h3>
        <p className="text-sm text-neutral-400 max-w-md">
          Usa la barra de búsqueda en la parte superior para buscar cualquier juego por su ID o nombre, o solicita a los publicadores en nuestra comunidad.
        </p>
      </div>
    </div>
  );
}

