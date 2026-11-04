'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, supabase } from './AuthProvider';

const POPULAR_GAMES = [
  { id: 1, name: 'Blox Fruits', image: '/games/bloxfruits.png', keywords: ['blox fruits', 'bloxfruits'] },
  { id: 2, name: 'Da Hood', image: '/games/dahood.png', keywords: ['da hood', 'dahood'] },
  { id: 3, name: 'Arsenal', image: '/games/arsenal.png', keywords: ['arsenal'] },
  { id: 4, name: 'Adopt Me!', image: '/games/adoptme.png', keywords: ['adopt me', 'adoptme'] },
  { id: 5, name: 'Pet Simulator 99', image: '/games/petsimulator99.png', keywords: ['pet simulator 99', 'pet simulator', 'ps99'] },
  { id: 6, name: 'Murder Mystery 2', image: '/games/mm2.png', keywords: ['murder mystery 2', 'murder mystery', 'mm2'] },
  { id: 7, name: 'Blade Ball', image: '/games/bladeball.png', keywords: ['blade ball', 'bladeball'] },
  { id: 8, name: 'Brookhaven RP', image: '/games/brookhaven.png', keywords: ['brookhaven rp', 'brookhaven'] },
];

export default function Navbar() {
  const router = useRouter();
  const { user, signOut, openAuthModal, openProfileModal } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  const roleNormalized = (user?.role || '').toLowerCase().trim();
  const isAdminOrMod = Boolean(
    user && ['admin', 'moderator', 'mod', 'creator', 'owner'].includes(roleNormalized)
  );

  // Estados y referencias para la barra de búsqueda global
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [allScripts, setAllScripts] = useState<any[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Pre-carga scripts al interactuar con el buscador para sugerencias instantáneas
  const loadScriptsForSearch = async () => {
    if (allScripts.length > 0) return;
    try {
      const res = await fetch('/api/scripts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAllScripts(data);
      }
    } catch (err) {}
  };

  // Atajo de teclado: presionar '/' enfoca el buscador si no se está escribiendo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
        loadScriptsForSearch();
      } else if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    setShowSearchDropdown(false);
    setIsMobileSearchOpen(false);
    searchInputRef.current?.blur();
    mobileSearchInputRef.current?.blur();
    if (q) {
      router.push(`/scripts?search=${encodeURIComponent(q)}`);
    } else {
      router.push('/scripts');
    }
  };

  const handleSelectGame = (gameName: string) => {
    setSearchQuery(gameName);
    setShowSearchDropdown(false);
    setIsMobileSearchOpen(false);
    router.push(`/scripts?search=${encodeURIComponent(gameName)}`);
  };

  const handleSelectScript = (id: string | number) => {
    setShowSearchDropdown(false);
    setIsMobileSearchOpen(false);
    router.push(`/scripts/${id}`);
  };

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchingGames = trimmedQuery
    ? POPULAR_GAMES.filter(g =>
        g.name.toLowerCase().includes(trimmedQuery) ||
        g.keywords.some(k => k.toLowerCase().includes(trimmedQuery))
      ).slice(0, 4)
    : POPULAR_GAMES.slice(0, 4);

  const matchingScripts = trimmedQuery
    ? allScripts.filter(s =>
        (s.title && s.title.toLowerCase().includes(trimmedQuery)) ||
        (s.game && s.game.toLowerCase().includes(trimmedQuery)) ||
        (s.authorName && s.authorName.toLowerCase().includes(trimmedQuery)) ||
        (s.author && s.author.toLowerCase().includes(trimmedQuery))
      ).slice(0, 5)
    : allScripts.slice(0, 4);

  const markAsRead = async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { }
  };

  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;
    setClearing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error clearing notifications', err);
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification', err);
    } finally {
      setDeletingId(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="relative z-30 bg-base border-b border-border-theme shrink-0 transition-colors">
      <nav className="h-16 flex items-center px-3 sm:px-6">
        {/* Left - Hamburger (mobile) & Logo */}
        <div className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={() => document.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}
            className="md:hidden p-1.5 -ml-1 text-muted hover:text-foreground hover:bg-card rounded-lg transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="text-lg sm:text-xl font-bold text-foreground flex items-center tracking-tight transition-colors shrink-0">
            Chituk<span className="text-accent">Scripts</span>
          </Link>
        </div>

        {/* Center - Search Bar */}
        <div ref={searchContainerRef} className="hidden md:flex flex-[2] justify-center max-w-2xl mx-4 relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                setShowSearchDropdown(true);
                loadScriptsForSearch();
              }}
              placeholder="Buscar scripts, juegos..." 
              className="w-full bg-card border border-border-theme text-foreground placeholder:text-muted rounded-lg pl-10 pr-16 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 text-muted hover:text-foreground rounded transition-colors cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <span className="text-muted text-xs font-mono px-1.5 py-0.5 rounded bg-base border border-border-theme select-none">/</span>
            </div>
          </form>

          {/* Floating Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border-theme rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-border-theme/40 max-h-[420px] overflow-y-auto">
              {trimmedQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchSubmit()}
                  className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-medium text-foreground hover:bg-card-hover flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="truncate">Buscar &quot;<strong className="text-accent">{searchQuery}</strong>&quot; en todo el catálogo</span>
                  </span>
                  <span className="text-[11px] text-muted group-hover:text-foreground font-mono">↵ Enter</span>
                </button>
              )}

              {matchingGames.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[11px] font-bold tracking-wider uppercase text-muted">
                    Juegos
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                    {matchingGames.map(game => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => handleSelectGame(game.name)}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card-hover text-left transition-colors cursor-pointer group"
                      >
                        <img
                          src={game.image}
                          alt={game.name}
                          className="w-7 h-7 rounded-md object-cover border border-border-theme shrink-0 group-hover:border-accent transition-colors"
                        />
                        <span className="text-xs font-semibold text-foreground group-hover:text-accent truncate">
                          {game.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchingScripts.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[11px] font-bold tracking-wider uppercase text-muted">
                    {trimmedQuery ? 'Scripts coincidentes' : 'Scripts recientes'}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {matchingScripts.map(script => (
                      <button
                        key={script.id}
                        type="button"
                        onClick={() => handleSelectScript(script.id)}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-card-hover text-left transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground group-hover:text-accent truncate">
                            {script.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5 truncate">
                            <span className="text-accent/90 font-medium">{script.game || 'Roblox'}</span>
                            <span>•</span>
                            <span>por {script.authorName || script.author || 'Anónimo'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted shrink-0">
                          <svg className="w-3.5 h-3.5 text-danger fill-current" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>{script.likesCount || (Array.isArray(script.likes) ? script.likes.length : script.likes) || 0}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {trimmedQuery && matchingGames.length === 0 && matchingScripts.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-xs text-muted mb-2">No hay coincidencias directas para &quot;{searchQuery}&quot;</p>
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="text-xs font-bold text-accent hover:underline cursor-pointer"
                  >
                    Presiona Enter o haz clic aquí para buscar en todo el catálogo →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right - Auth Buttons & Discord */}
        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2.5">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => {
              const next = !isMobileSearchOpen;
              setIsMobileSearchOpen(next);
              if (next) {
                loadScriptsForSearch();
                setShowSearchDropdown(true);
                setTimeout(() => mobileSearchInputRef.current?.focus(), 80);
              } else {
                setShowSearchDropdown(false);
              }
            }}
            className={`md:hidden p-2 rounded-lg border transition-colors cursor-pointer ${
              isMobileSearchOpen
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-card hover:bg-card-hover border-border-theme text-foreground'
            }`}
            aria-label="Buscar scripts o juegos"
            title="Buscar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <a
            href="https://discord.gg/mdvByagDr3"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-foreground bg-card hover:bg-card-hover border border-border-theme transition-all text-xs cursor-pointer group"
            title="Unirse a nuestro Discord"
          >
          <svg className="w-4 h-4 text-discord fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0777.0777 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
          </svg>
          <span className="hidden sm:inline font-semibold">Discord</span>
        </a>

        {!user ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg font-medium bg-card hover:bg-card-hover text-foreground transition-colors text-xs sm:text-sm border border-border-theme cursor-pointer"
            >
              Acceder
            </button>
            <button 
              type="button"
              onClick={() => openAuthModal('signup')}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg font-bold bg-accent text-accent-contrast hover:opacity-90 transition-opacity text-xs sm:text-sm cursor-pointer shadow-sm"
            >
              Registrarse
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Bell Icon */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  if (!showDropdown && unreadCount > 0) {
                    markAsRead();
                  }
                }}
                className="relative p-1.5 sm:p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
                title="Notificaciones"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-base"></span>
                )}
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-72 sm:w-84 max-w-[calc(100vw-2rem)] bg-card border border-border-theme rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-3.5 border-b border-border-theme flex justify-between items-center bg-base">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">Notificaciones</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-semibold">{unreadCount} nuevas</span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        disabled={clearing}
                        className="text-xs text-muted hover:text-danger transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Eliminar todas las notificaciones recientes"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>{clearing ? 'Borrando...' : 'Eliminar recientes'}</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-border-theme/40">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-base border border-border-theme flex items-center justify-center text-muted">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-foreground">No hay notificaciones</p>
                        <p className="text-xs text-muted">Te avisaremos cuando haya actividad</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3.5 text-sm flex items-start justify-between gap-2.5 hover:bg-card-hover/50 transition-colors ${!n.read ? 'bg-card-hover/30' : ''}`}>
                          <div className="flex-1 min-w-0">
                            {n.type === 'like' && (
                              <p className="text-muted text-xs leading-relaxed">
                                A <span className="font-bold text-foreground">{n.actor_id}</span> le gustó tu script.
                              </p>
                            )}
                            {n.type === 'comment' && (
                              <p className="text-muted text-xs leading-relaxed">
                                <span className="font-bold text-foreground">{n.actor_id}</span> comentó en tu script.
                              </p>
                            )}
                            {n.type === 'review_pending' && (
                              <p className="text-muted text-xs leading-relaxed">
                                <span className="font-bold text-foreground">{n.actor_id}</span> envió un script para revisión.
                              </p>
                            )}
                            <p className="text-[11px] text-muted mt-1">
                              {new Date(n.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOne(n.id);
                            }}
                            disabled={deletingId === n.id}
                            title="Eliminar esta notificación"
                            className="p-1 text-muted hover:text-danger hover:bg-card-hover rounded transition-colors cursor-pointer shrink-0"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2.5 bg-base border-t border-border-theme flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted font-medium">
                        {notifications.length} {notifications.length === 1 ? 'notificación' : 'notificaciones'}
                      </span>
                      <button
                        onClick={handleClearAll}
                        disabled={clearing}
                        className="text-[11px] text-danger hover:opacity-80 font-semibold flex items-center gap-1 transition-opacity cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>{clearing ? 'Borrando...' : 'Eliminar todas'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-border-theme"></div>

            {/* Gear Settings Button & Dropdown */}
            <div className="relative" ref={settingsDropdownRef}>
              <button
                type="button"
                onClick={() => setShowSettingsDropdown(prev => !prev)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                  showSettingsDropdown
                    ? 'bg-accent/15 border-accent text-accent shadow-sm'
                    : 'bg-card hover:bg-card-hover border-border-theme text-muted hover:text-foreground'
                }`}
                aria-label="Configuración y Cuenta"
                title="Configuración y Cuenta"
                aria-expanded={showSettingsDropdown}
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${showSettingsDropdown ? 'rotate-90 text-accent' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {/* Floating Dropdown 100% en ESPAÑOL */}
              {showSettingsDropdown && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-card border border-border-theme rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Sección Pública del Dropdown: Avatar / Header del Usuario */}
                  <div
                    onClick={() => {
                      setShowSettingsDropdown(false);
                      if (openProfileModal) openProfileModal();
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-profile-modal'));
                        document.dispatchEvent(new CustomEvent('open-profile-modal'));
                      }
                    }}
                    className="p-3.5 border-b border-border-theme/70 bg-base flex items-center gap-3 cursor-pointer hover:bg-card-hover transition-colors group"
                    title="Haz clic para personalizar tu perfil"
                  >
                    <div className="w-10 h-10 rounded-full bg-card border border-border-theme flex items-center justify-center text-xs font-bold text-foreground overflow-hidden shrink-0 group-hover:border-accent transition-colors">
                      {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.username ? user.username.charAt(0).toUpperCase() : '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-accent transition-colors">
                          {user.username || 'Usuario'}
                        </p>
                        <svg className="w-3 h-3 text-muted group-hover:text-accent transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <p className="text-[11px] text-muted truncate">{user.email || 'Miembro de Chituk'}</p>
                    </div>
                    {user.role && user.role !== 'user' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 shrink-0">
                        {user.role}
                      </span>
                    )}
                  </div>

                  <div className="p-2 space-y-1">
                    {/* Sección Privada del Dropdown: Administración (SOLO admin/moderator o equivalente) */}
                    {isAdminOrMod && (
                      <div>
                        <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold tracking-widest text-muted uppercase">
                          Administración
                        </div>
                        <Link
                          href="/admin/queue"
                          onClick={() => setShowSettingsDropdown(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors group"
                        >
                          <svg className="w-4 h-4 shrink-0 text-accent group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span>Cola de Scripts</span>
                        </Link>
                        <Link
                          href="/admin/users"
                          onClick={() => setShowSettingsDropdown(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors group"
                        >
                          <svg className="w-4 h-4 shrink-0 text-accent group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>Usuarios y Roles</span>
                        </Link>
                        <Link
                          href="/admin/herramientas"
                          onClick={() => setShowSettingsDropdown(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors group"
                        >
                          <svg className="w-4 h-4 shrink-0 text-accent group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Gestionar Herramientas</span>
                        </Link>
                        <Link
                          href="/admin/games"
                          onClick={() => setShowSettingsDropdown(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors group"
                        >
                          <svg className="w-4 h-4 shrink-0 text-accent group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Gestionar Juegos</span>
                        </Link>
                        <div className="my-1.5 border-t border-border-theme/60"></div>
                      </div>
                    )}

                    {/* Sección Cuenta */}
                    <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold tracking-widest text-muted uppercase">
                      Cuenta
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setShowSettingsDropdown(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors group"
                    >
                      <svg className="w-4 h-4 shrink-0 text-accent group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/favoritos"
                      onClick={() => setShowSettingsDropdown(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors group"
                    >
                      <svg className="w-4 h-4 shrink-0 text-accent group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span>Mis Favoritos</span>
                    </Link>
                    <Link
                      href="/preferencias"
                      onClick={() => setShowSettingsDropdown(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-card-hover transition-colors group"
                    >
                      <svg className="w-4 h-4 shrink-0 text-accent group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span>Preferencias</span>
                    </Link>

                    {/* Divisor visual */}
                    <div className="my-1.5 border-t border-border-theme/60"></div>

                    {/* Acción: Cerrar Sesión (con texto y un icono de salir en color rojo) */}
                    <button
                      type="button"
                      onClick={async () => {
                        setShowSettingsDropdown(false);
                        await signOut();
                        router.push('/');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-danger hover:bg-danger/10 transition-colors text-left cursor-pointer group"
                    >
                      <svg className="w-4 h-4 shrink-0 text-danger group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </nav>

      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-3 pb-3 pt-1 border-t border-border-theme/60 bg-base animate-in fade-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar scripts, juegos..."
              className="w-full bg-card border border-border-theme text-foreground placeholder:text-muted rounded-lg pl-10 pr-20 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-muted hover:text-foreground rounded cursor-pointer"
                  title="Limpiar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setShowSearchDropdown(false);
                }}
                className="text-xs text-muted hover:text-foreground px-1.5 py-0.5 cursor-pointer font-medium"
              >
                Cerrar
              </button>
            </div>
          </form>

          {/* Mobile suggestions list */}
          {(matchingGames.length > 0 || matchingScripts.length > 0) && (
            <div className="mt-2 max-h-72 overflow-y-auto bg-card border border-border-theme rounded-lg divide-y divide-border-theme/40">
              {trimmedQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchSubmit()}
                  className="w-full p-2.5 text-left text-xs font-medium text-foreground hover:bg-card-hover flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="truncate">Buscar &quot;<strong className="text-accent">{searchQuery}</strong>&quot;</span>
                  <span className="text-accent text-[11px] font-bold">Ver todos →</span>
                </button>
              )}
              {matchingGames.length > 0 && (
                <div className="p-2">
                  <div className="px-1 py-0.5 text-[10px] font-bold uppercase text-muted tracking-wider">Juegos</div>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {matchingGames.map(game => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => handleSelectGame(game.name)}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-card-hover text-left transition-colors cursor-pointer"
                      >
                        <img src={game.image} alt={game.name} className="w-5 h-5 rounded object-cover" />
                        <span className="text-xs text-foreground truncate">{game.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {matchingScripts.length > 0 && (
                <div className="p-2">
                  <div className="px-1 py-0.5 text-[10px] font-bold uppercase text-muted tracking-wider">Scripts</div>
                  <div className="flex flex-col gap-1 mt-1">
                    {matchingScripts.map(script => (
                      <button
                        key={script.id}
                        type="button"
                        onClick={() => handleSelectScript(script.id)}
                        className="p-1.5 rounded hover:bg-card-hover text-left transition-colors cursor-pointer truncate"
                      >
                        <p className="text-xs font-semibold text-foreground truncate">{script.title}</p>
                        <p className="text-[10px] text-muted truncate">{script.game || 'Roblox'} • {script.authorName || script.author || 'Anónimo'}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
