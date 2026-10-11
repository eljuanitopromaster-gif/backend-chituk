'use client';
import React, { useState } from 'react';
import { useAuth, supabase } from './AuthProvider';
import CaptchaWidget, { CaptchaValue } from './CaptchaWidget';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authTab } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>(authTab);
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<CaptchaValue>({ token: '', answer: '', honeypot: '', isReady: false });

  // Sync tab state when opened
  React.useEffect(() => {
    if (isAuthModalOpen) {
      setTab(authTab);
      setError('');
    }
  }, [isAuthModalOpen, authTab]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) throw signInError;
        
        closeAuthModal();
      } else {
        if (username.length < 3) throw new Error("El nombre de usuario debe tener al menos 3 caracteres.");
        if (!captchaValue.isReady || !captchaValue.answer) throw new Error("Por favor completa la verificación de seguridad anti-bot.");
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        
        if (data.user) {
          // Sync with public table via our API
          const res = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              username: username,
              captchaToken: captchaValue.token,
              captchaAnswer: captchaValue.answer,
              honeypot: captchaValue.honeypot
            })
          });
          
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Error al crear el perfil público.");
          }
          
          closeAuthModal();
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={closeAuthModal}>
      <div 
        className="bg-base border border-border-theme rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-8">
          <p className="text-accent text-[10px] font-bold tracking-widest uppercase mb-1">CHITUK</p>
          <h2 className="text-2xl font-bold text-white mb-6">
            {tab === 'login' ? 'Vuelve al archivo' : 'Crea tu cuenta'}
          </h2>

          <div className="flex border-b border-border-theme mb-6">
            <button 
              className={`flex-1 pb-3 text-sm font-medium ${tab === 'login' ? 'text-white border-b-2 border-accent' : 'text-neutral-500 hover:text-neutral-300'}`}
              onClick={() => setTab('login')}
              type="button"
            >
              Iniciar sesión
            </button>
            <button 
              className={`flex-1 pb-3 text-sm font-medium ${tab === 'signup' ? 'text-white border-b-2 border-accent' : 'text-neutral-500 hover:text-neutral-300'}`}
              onClick={() => setTab('signup')}
              type="button"
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-neutral-300 font-medium">Email</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-card border border-neutral-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            {tab === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-neutral-300 font-medium">Nombre de Usuario</label>
                <input 
                  type="text" 
                  required 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Sin espacios"
                  className="w-full bg-card border border-neutral-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-neutral-300 font-medium">Contraseña</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-card border border-neutral-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            {tab === 'signup' && (
              <div className="flex flex-col gap-3">
                <CaptchaWidget onChange={setCaptchaValue} compact />
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    required 
                    className="mt-1 w-4 h-4 rounded border-neutral-700 text-accent focus:ring-accent bg-card"
                  />
                  <label htmlFor="terms" className="text-xs text-neutral-400">
                    He leído y acepto los <a href="/terminos" target="_blank" className="text-accent hover:underline">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" className="text-accent hover:underline">Política de Privacidad</a> de Chituk.
                  </label>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 w-full py-3 bg-accent text-black rounded-lg font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Registrarse'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
