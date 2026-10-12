'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, openAuthModal } = useAuth();
  
  const isAdmin = user && ['owner', 'creator', 'admin', 'mod'].includes(user.role);

  const navLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-card text-accent font-semibold shadow-sm border border-border-theme'
        : 'text-muted hover:text-foreground hover:bg-card-hover'
    }`;
  };

  return (
    <aside className="flex w-[260px] bg-base border-r border-border-theme flex-col h-full shrink-0 transition-colors">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        <Link href="/" className={navLinkClass('/')}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Inicio
        </Link>
        <Link href="/scripts" className={navLinkClass('/scripts')}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Scripts
        </Link>
        <Link href="/juegos" className={navLinkClass('/juegos')}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Juegos
        </Link>
        <Link href="/favoritos" className={navLinkClass('/favoritos')}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Favoritos
        </Link>
        {user && (
          <Link 
            href="/publicar" 
            className="mt-2 flex justify-center items-center gap-2 px-4 py-2.5 bg-accent text-accent-contrast rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Publicar Script
          </Link>
        )}
        <Link href="/herramientas" className={navLinkClass('/herramientas')}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ejecutores y Herramientas
        </Link>
        <Link href="/comunidad" className={navLinkClass('/comunidad')}>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Comunidad
        </Link>
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-theme-modal'))}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-muted hover:text-foreground hover:bg-card-hover text-left cursor-pointer w-full"
        >
          <svg className="w-5 h-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.64 0 1.25.15 1.8.42A5.98 5.98 0 0113 11a5.98 5.98 0 014.2 2.42c.55-.27 1.16-.42 1.8-.42a4 4 0 014 4 4 4 0 01-4 4c-.64 0-1.25-.15-1.8-.42A5.98 5.98 0 0113 21a5.98 5.98 0 01-4.2-2.42c-.55.27-1.16.42-1.8.42z" />
          </svg>
          Temas y Apariencia
        </button>

        {/* ADMIN SECTION */}
        {isAdmin && (
          <>
            <div className="mt-8 mb-2 px-3">
              <p className="text-[10px] font-bold tracking-widest text-muted uppercase">Administración</p>
            </div>
            <Link 
              href="/admin/queue" 
              className={navLinkClass('/admin/queue')}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Cola de Scripts
            </Link>
            <Link 
              href="/admin/users" 
              className={navLinkClass('/admin/users')}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Usuarios y Roles
            </Link>
            <Link 
              href="/admin/herramientas" 
              className={navLinkClass('/admin/herramientas')}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Gestionar Herramientas
            </Link>
          </>
        )}

        {/* ACCOUNT SECTION */}
        <div className="mt-8 mb-2 px-3">
          <p className="text-[10px] font-bold tracking-widest text-muted uppercase">Cuenta</p>
        </div>

        {user && (
          <div className="flex flex-col gap-1 px-3 mb-2">
            <Link href="/dashboard" className={navLinkClass('/dashboard')}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </Link>
            <Link href="/favoritos" className={navLinkClass('/favoritos')}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Mis Favoritos
            </Link>
          </div>
        )}

        {!user ? (
          <div className="flex flex-col gap-2 px-3 mt-1">
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-3 px-4 py-2.5 bg-card text-foreground rounded-lg text-sm font-medium hover:bg-card-hover transition-colors border border-border-theme cursor-pointer"
            >
              <svg className="w-5 h-5 text-muted pointer-events-none shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Acceder
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-contrast rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <svg className="w-5 h-5 pointer-events-none shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Registrarse
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-3 mt-1">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-profile-modal'))}
              className="flex items-center gap-3 px-3.5 py-2.5 bg-card text-foreground rounded-lg text-sm font-medium border border-border-theme hover:border-accent hover:bg-card-hover transition-all cursor-pointer text-left group"
              title="Haz clic para personalizar tu perfil"
            >
              <div className="w-7 h-7 rounded-full bg-base flex items-center justify-center text-[10px] text-foreground font-bold shrink-0 overflow-hidden border border-border-theme">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.username ? user.username.charAt(0).toUpperCase() : '?'
                )}
              </div>
              <span className="flex-1 truncate group-hover:text-accent transition-colors font-medium">{user.username || user.email}</span>
              <svg className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-card text-muted rounded-lg text-sm font-medium hover:text-foreground hover:bg-card-hover border border-border-theme transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-theme/60 shrink-0 bg-base z-10">
        <div className="flex items-center gap-3 text-xs text-muted mb-1.5 flex-wrap">
          <Link href="/terminos" className="hover:text-foreground transition-colors cursor-pointer font-medium">
            Términos
          </Link>
          <span className="text-border-theme select-none">•</span>
          <Link href="/privacidad" className="hover:text-foreground transition-colors cursor-pointer font-medium">
            Privacidad
          </Link>
          <span className="text-border-theme select-none">•</span>
          <a
            href="https://discord.gg/mdvByagDr3"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#5865F2] transition-colors cursor-pointer font-semibold flex items-center gap-1 group"
            title="Unirse al Discord de Chituk"
          >
            <svg className="w-3.5 h-3.5 text-[#5865F2] fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0777.0777 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
            Discord
          </a>
        </div>
        <p className="text-[11px] text-muted/70">© 2026 Chituk</p>
      </div>
    </aside>
  );
}
