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
  updateUser: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    // Escuchar el estado de autenticación de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Traer datos adicionales de la tabla pública
        const { data: publicUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (publicUser) {
          setUser(publicUser);
          
          // Sincronización silenciosa con el localStorage legacy (para mantener funcional chituk-script.js)
          try {
            const dbStorage = localStorage.getItem('chituk-community-v4');
            let parsedDb = dbStorage ? JSON.parse(dbStorage) : { users: [], projects: [], comments: [] };
            
            // Upsert al usuario local
            const existingIdx = parsedDb.users.findIndex((u: any) => u.id === publicUser.id);
            if (existingIdx !== -1) {
              parsedDb.users[existingIdx] = publicUser;
            } else {
              parsedDb.users.push(publicUser);
            }
            
            localStorage.setItem('chituk-community-v4', JSON.stringify(parsedDb));
            localStorage.setItem('chituk-community-session-v4', JSON.stringify({ userId: publicUser.id }));
          } catch(e) {}
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
        try {
          localStorage.removeItem('chituk-community-session-v4');
        } catch(e) {}
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
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
    <AuthContext.Provider value={{ user, loading, signOut, isAuthModalOpen, openAuthModal, closeAuthModal, authTab, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
