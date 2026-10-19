'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth, supabase } from './AuthProvider';

export default function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

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
    <nav className="h-16 flex items-center px-3 sm:px-6 bg-base border-b border-border-theme shrink-0 transition-colors">
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
      <div className="hidden md:flex flex-[2] justify-center max-w-2xl mx-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar scripts, juegos..." 
            className="w-full bg-card border border-border-theme text-foreground placeholder:text-muted rounded-lg pl-10 pr-10 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-muted text-xs font-mono">/</span>
          </div>
        </div>
      </div>

      {/* Right - Auth Buttons & Discord */}
      <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2.5">
        <a
          href="https://discord.gg/mdvByagDr3"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-muted hover:text-foreground bg-card hover:bg-card-hover border border-border-theme transition-all text-xs cursor-pointer group"
          title="Unirse a nuestro Discord"
        >
          <svg className="w-4 h-4 text-[#5865F2] fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0777.0777 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
          </svg>
          <span className="hidden sm:inline font-semibold">Discord</span>
        </a>

        {/* Theme Button */}
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-theme-modal'))}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-muted hover:text-foreground bg-card hover:bg-card-hover border border-border-theme transition-all text-xs cursor-pointer group"
          title="Cambiar tema visual (14 temas)"
        >
          <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.64 0 1.25.15 1.8.42A5.98 5.98 0 0113 11a5.98 5.98 0 014.2 2.42c.55-.27 1.16-.42 1.8-.42a4 4 0 014 4 4 4 0 01-4 4c-.64 0-1.25-.15-1.8-.42A5.98 5.98 0 0113 21a5.98 5.98 0 01-4.2-2.42c-.55.27-1.16.42-1.8.42z" />
          </svg>
          <span className="hidden sm:inline font-semibold">Temas</span>
        </button>

        {!user ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => openAuthModal('login')}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg font-medium bg-card hover:bg-card-hover text-foreground transition-colors text-xs sm:text-sm border border-border-theme cursor-pointer"
            >
              Acceder
            </button>
            <button 
              onClick={() => openAuthModal('signup')}
              className="hidden sm:block px-3.5 py-2 rounded-lg font-bold bg-accent text-accent-contrast hover:opacity-90 transition-opacity text-sm cursor-pointer shadow-sm"
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
                        className="text-xs text-muted hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                            <p className="text-[11px] text-muted/70 mt-1">
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
                            className="p-1 text-muted hover:text-rose-400 hover:bg-card-hover rounded transition-colors cursor-pointer shrink-0"
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
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
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

            {/* User Profile */}
            <button 
              onClick={() => document.dispatchEvent(new CustomEvent('open-profile-modal'))}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-card border border-transparent hover:border-border-theme transition-all group cursor-pointer text-left"
              title="Editar perfil"
            >
              <div className="w-7 h-7 rounded-full bg-base flex items-center justify-center text-xs font-bold text-foreground border border-border-theme overflow-hidden group-hover:border-accent transition-colors shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.username ? user.username.charAt(0).toUpperCase() : '?'}</span>
                )}
              </div>
              <span className="text-sm font-medium text-foreground hidden md:block group-hover:text-accent transition-colors max-w-[120px] truncate">
                {user.username || user.email}
              </span>
            </button>
            <button 
              onClick={() => signOut()}
              className="hidden sm:block px-3 py-1.5 rounded-lg font-medium text-muted hover:text-foreground hover:bg-card transition-colors text-sm cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
