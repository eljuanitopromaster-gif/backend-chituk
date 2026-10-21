'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'MISSING_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthContextType {
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: (tab: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  authTab: 'login' | 'signup';
  isThemeModalOpen: boolean;
  openThemeModal: () => void;
  closeThemeModal: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  updateUser: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  authTab: 'login',
  isThemeModalOpen: false,
  openThemeModal: () => {},
  closeThemeModal: () => {},
  isProfileModalOpen: false,
  openProfileModal: () => {},
  closeProfileModal: () => {},
  updateUser: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const openThemeModal = () => setIsThemeModalOpen(true);
  const closeThemeModal = () => setIsThemeModalOpen(false);

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  useEffect(() => {
    const handleOpenTheme = () => setIsThemeModalOpen(true);
    const handleCloseTheme = () => setIsThemeModalOpen(false);
    const handleOpenProfile = () => setIsProfileModalOpen(true);
    const handleCloseProfile = () => setIsProfileModalOpen(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('open-theme-modal', handleOpenTheme);
      document.addEventListener('open-theme-modal', handleOpenTheme);
      window.addEventListener('close-theme-modal', handleCloseTheme);
      document.addEventListener('close-theme-modal', handleCloseTheme);

      window.addEventListener('open-profile-modal', handleOpenProfile);
      document.addEventListener('open-profile-modal', handleOpenProfile);
      window.addEventListener('close-profile-modal', handleCloseProfile);
      document.addEventListener('close-profile-modal', handleCloseProfile);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-theme-modal', handleOpenTheme);
        document.removeEventListener('open-theme-modal', handleOpenTheme);
        window.removeEventListener('close-theme-modal', handleCloseTheme);
        document.removeEventListener('close-theme-modal', handleCloseTheme);

        window.removeEventListener('open-profile-modal', handleOpenProfile);
        document.removeEventListener('open-profile-modal', handleOpenProfile);
        window.removeEventListener('close-profile-modal', handleCloseProfile);
        document.removeEventListener('close-profile-modal', handleCloseProfile);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const processSession = async (session: any) => {
      try {
        if (session?.user) {
          // Traer datos de la tabla pública
          let { data: publicUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!publicUser) {
            // Si el usuario no tiene fila en public.users, crearla o sintetizarla
            const defaultUsername = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Usuario';
            const { data: newUser } = await supabase.from('users').insert([{
              id: session.user.id,
              username: defaultUsername,
              normalized: defaultUsername.toLowerCase(),
              role: 'user',
              is_verified: false,
              banned: false,
              createdAt: new Date().toISOString()
            }]).select().maybeSingle();

            publicUser = newUser || {
              id: session.user.id,
              username: defaultUsername,
              role: 'user',
              is_verified: false,
              banned: false
            };
          }

          if (publicUser.banned) {
            if (isMounted) setUser(null);
            try {
              document.cookie = 'sb-auth-token=; path=/; max-age=0; SameSite=Lax';
              localStorage.removeItem('chituk-community-session-v4');
            } catch (e) {}
            await supabase.auth.signOut();
            alert(`Tu cuenta ha sido suspendida por la administración.\nMotivo: ${publicUser.banReason || 'Infracción de las normas de la comunidad'}`);
            if (isMounted) setLoading(false);
            return;
          }

          if (isMounted) setUser(publicUser);

          // Sincronizar tema: respetar la elección local si ya existe, o aplicar la del perfil si no hay local
          try {
            const savedLocalTheme = typeof window !== 'undefined' ? localStorage.getItem('chituk_theme') : null;
            if (savedLocalTheme) {
              document.documentElement.setAttribute('data-theme', savedLocalTheme);
              if (publicUser.theme !== savedLocalTheme) {
                publicUser.theme = savedLocalTheme;
                supabase.from('users').update({ theme: savedLocalTheme }).eq('id', publicUser.id).then(() => {});
              }
            } else if (publicUser.theme) {
              document.documentElement.setAttribute('data-theme', publicUser.theme);
              localStorage.setItem('chituk_theme', publicUser.theme);
            }
          } catch (e) {}

          // Sincronización silenciosa con el localStorage legacy
          try {
            document.cookie = 'sb-auth-token=1; path=/; max-age=604800; SameSite=Lax';
            const dbStorage = localStorage.getItem('chituk-community-v4');
            const parsedDb = dbStorage ? JSON.parse(dbStorage) : { users: [], projects: [], comments: [] };
            
            const existingIdx = parsedDb.users.findIndex((u: any) => u.id === publicUser.id);
            if (existingIdx !== -1) {
              parsedDb.users[existingIdx] = publicUser;
            } else {
              parsedDb.users.push(publicUser);
            }
            
            localStorage.setItem('chituk-community-v4', JSON.stringify(parsedDb));
            localStorage.setItem('chituk-community-session-v4', JSON.stringify({ userId: publicUser.id }));
          } catch (e) {}
        } else {
          if (isMounted) setUser(null);
          try {
            document.cookie = 'sb-auth-token=; path=/; max-age=0; SameSite=Lax';
            localStorage.removeItem('chituk-community-session-v4');
          } catch (e) {}
        }
      } catch (err) {
        console.error("Error in processSession:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // 1. Inicialización inmediata con getSession
    supabase.auth.getSession().then(({ data: { session } }) => {
      processSession(session);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // 2. Escuchar cambios del estado de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      processSession(session);
    });

    // 3. Fallback timeout de seguridad para que loading NUNCA quede congelado
    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      document.cookie = 'sb-auth-token=; path=/; max-age=0; SameSite=Lax';
    } catch(e) {}
    await supabase.auth.signOut();
  };

  const openAuthModal = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const updateUser = async (updatedData: any) => {
    setUser((prev: any) => ({ ...prev, ...updatedData }));
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: publicUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (publicUser) {
        setUser(publicUser);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signOut,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      authTab,
      isThemeModalOpen,
      openThemeModal,
      closeThemeModal,
      isProfileModalOpen,
      openProfileModal,
      closeProfileModal,
      updateUser,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
