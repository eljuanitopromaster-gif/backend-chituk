'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, openAuthModal } = useAuth();
  
  const isAdmin = user && (user.role === 'owner' || user.role === 'mod');

  return (
    <aside className="flex w-[260px] bg-[#0A0F0D] border-r border-[#262626] flex-col h-full shrink-0">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        <Link href="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/' ? 'bg-[#131A15] text-[#FACC15]' : 'text-neutral-400 hover:text-white hover:bg-[#131A15]'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Inicio
        </Link>
        <Link href="/scripts" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/scripts' ? 'bg-[#131A15] text-[#FACC15]' : 'text-neutral-400 hover:text-white hover:bg-[#131A15]'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Scripts
        </Link>
        <Link href="/juegos" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/juegos' ? 'bg-[#131A15] text-[#FACC15]' : 'text-neutral-400 hover:text-white hover:bg-[#131A15]'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Juegos
        </Link>
        {user && (
          <Link href="/publicar" className="mt-2 flex justify-center items-center gap-2 px-4 py-2.5 bg-[#FACC15] text-black rounded-lg text-sm font-bold hover:bg-yellow-500 transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Publicar Script
          </Link>
        )}
        <Link href="/herramientas" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/herramientas' ? 'bg-[#131A15] text-[#FACC15]' : 'text-neutral-400 hover:text-white hover:bg-[#131A15]'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ejecutores y Herramientas
        </Link>
        <Link href="/comunidad" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/comunidad' ? 'bg-[#131A15] text-[#FACC15]' : 'text-neutral-400 hover:text-white hover:bg-[#131A15]'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Comunidad
        </Link>
        {isAdmin && (
          <>
            <div className="mt-8 mb-2 px-3">
              <p className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase">Administración</p>
            </div>
            <Link href="/admin/queue" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/admin/queue' ? 'bg-[#131A15] text-[#FACC15]' : 'text-neutral-400 hover:text-white hover:bg-[#131A15]'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Panel de Admin
            </Link>
          </>
        )}

        {/* ACCOUNT SECTION */}
        <div className="mt-8 mb-2 px-3">
          <p className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase">Cuenta</p>
        </div>

        {user && (
          <div className="flex flex-col gap-1 px-3 mb-4">
            <Link href="/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'bg-[#131A15] text-[#FACC15]' : 'text-neutral-400 hover:text-white hover:bg-[#131A15]'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </Link>
          </div>
        )}

        {!user ? (
          <div className="flex flex-col gap-2 px-3">
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-3 px-4 py-2.5 bg-[#131A15] text-white rounded-lg text-sm font-medium hover:bg-[#1A221C] transition-colors border border-neutral-800/50 cursor-pointer"
            >
              <svg className="w-5 h-5 text-neutral-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Acceder
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FACC15] text-black rounded-lg text-sm font-bold hover:bg-yellow-500 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Registrarse
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-3">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#131A15] text-white rounded-lg text-sm font-medium border border-neutral-800/50">
              <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
              </div>
              <span className="flex-1 truncate">{user.username || user.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-neutral-400 rounded-lg text-sm font-medium hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6">
        <div className="flex items-center gap-3 text-xs text-neutral-500 mb-2">
          <a href="#" className="hover:text-neutral-300">Términos</a>
          <a href="#" className="hover:text-neutral-300">Privacidad</a>
          <a href="#" className="hover:text-neutral-300">Discord</a>
        </div>
        <p className="text-xs text-neutral-600">© 2026 Chituk</p>
      </div>
    </aside>
  );
}
