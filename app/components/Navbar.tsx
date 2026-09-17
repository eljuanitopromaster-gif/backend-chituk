'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth, supabase } from './AuthProvider';

export default function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
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
          setNotifications(data || []);
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="h-16 flex items-center px-6 bg-[#0A0F0D] border-b border-[#262626] shrink-0">
      {/* Left - Logo */}
      <div className="flex-1 flex items-center">
        <Link href="/" className="text-xl font-bold text-white flex items-center tracking-tight">
          Chituk<span className="text-[#FACC15]">Scripts</span>
        </Link>
      </div>

      {/* Center - Search Bar */}
      <div className="flex-[2] flex justify-center max-w-2xl mx-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar scripts, juegos..." 
            className="w-full bg-[#131A15] border border-neutral-800 text-neutral-300 rounded-md pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#FACC15] focus:ring-1 focus:ring-[#FACC15] transition-colors"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-neutral-600 text-sm font-mono">/</span>
          </div>
        </div>
      </div>

      {/* Right - Auth Buttons */}
      <div className="flex-1 flex items-center justify-end gap-2">
        {!user ? (
          <>
            <button 
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 rounded-md font-medium bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] transition-colors text-sm border border-neutral-800 cursor-pointer"
            >
              Acceder
            </button>
            <button 
              onClick={() => openAuthModal('signup')}
              className="px-4 py-2 rounded-md font-bold bg-[#FACC15] text-black hover:bg-yellow-500 transition-colors text-sm cursor-pointer"
            >
              Registrarse
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            
            {/* Bell Icon */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  if (!showDropdown && unreadCount > 0) {
                    markAsRead();
                  }
                }}
                className="relative p-2 text-neutral-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FACC15] rounded-full border-2 border-[#0A0F0D]"></span>
                )}
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-[#131A15] border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-[#0A0F0D]">
                    <span className="font-bold text-sm text-white">Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="text-xs text-[#FACC15]">{unreadCount} nuevas</span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-neutral-500">
                        No hay notificaciones
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-neutral-800 text-sm ${!n.read ? 'bg-[#1A221C]' : ''}`}>
                          {n.type === 'like' && (
                            <p className="text-neutral-300">
                              A <span className="font-bold text-white">{n.actor_id}</span> le gustó tu script.
                            </p>
                          )}
                          {n.type === 'review_pending' && (
                            <p className="text-neutral-300">
                              <span className="font-bold text-white">{n.actor_id}</span> ha enviado un script para revisión.
                            </p>
                          )}
                          <p className="text-xs text-neutral-500 mt-1">
                            {new Date(n.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-neutral-800"></div>

            {/* User Profile */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-neutral-700">
                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
              </div>
              <span className="text-sm font-medium text-white hidden md:block">{user.username || user.email}</span>
            </div>
            <button 
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded-md font-medium text-neutral-400 hover:text-white hover:bg-[#131A15] transition-colors text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
