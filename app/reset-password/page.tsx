'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, useAuth } from '../components/AuthProvider';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { openAuthModal } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar si el usuario llegó con token de recuperación de Supabase
    let isMounted = true;

    const checkRecoverySession = async () => {
      // 1. Manejar PKCE code en URL query si existe
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data.session) {
              if (isMounted) setHasSession(true);
              return;
            }
          } catch (e) {
            console.error("Error exchanging code for session:", e);
          }
        }
      }

      // 2. Verificar sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (isMounted) setHasSession(true);
        return;
      }

      // 3. Escuchar evento onAuthStateChange
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || newSession) {
          if (isMounted) setHasSession(true);
        }
      });

      // 4. Si hay hash de token de recuperación, dar más tiempo para procesar
      const hasHash = typeof window !== 'undefined' && (
        window.location.hash.includes('access_token') || 
        window.location.hash.includes('type=recovery')
      );

      const timeoutMs = hasHash ? 4500 : 2500;
      setTimeout(() => {
        if (isMounted) {
          setHasSession(prev => (prev === null ? false : prev));
        }
      }, timeoutMs);

      return () => {
        subscription.unsubscribe();
      };
    };

    checkRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      // Cerrar sesión para que ingrese limpiamente con sus nuevas credenciales
      await supabase.auth.signOut();
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/');
    setTimeout(() => {
      openAuthModal('login');
    }, 200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base">
      <div className="w-full max-w-md bg-card border border-border-theme rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        
        {/* Encabezado */}
        <div className="text-center">
          <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">CHITUK SEGURIDAD</p>
          <h1 className="text-2xl font-bold text-foreground">Restablecer Contraseña</h1>
          <p className="text-xs text-muted mt-1">Crea una nueva contraseña para recuperar el acceso a tu cuenta.</p>
        </div>

        {success ? (
          <div className="flex flex-col gap-4 text-center py-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground">¡Contraseña Actualizada!</h2>
            <p className="text-sm text-muted leading-relaxed">
              Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.
            </p>
            <button
              onClick={handleGoToLogin}
              className="mt-2 w-full py-3 bg-accent text-accent-contrast rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md cursor-pointer"
            >
              Iniciar Sesión Ahora
            </button>
          </div>
        ) : hasSession === false ? (
          <div className="flex flex-col gap-4 text-center py-4">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-foreground">Enlace Expirado o Inválido</h2>
            <p className="text-xs text-muted leading-relaxed">
              El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo desde la pantalla de inicio de sesión.
            </p>
            <button
              onClick={handleGoToLogin}
              className="mt-2 w-full py-2.5 bg-card border border-border-theme text-foreground hover:bg-card-hover rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Volver al Inicio
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-foreground font-medium">Nueva Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-base border border-border-theme text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-foreground font-medium">Confirmar Contraseña</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full bg-base border border-border-theme text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-accent text-accent-contrast rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md cursor-pointer"
            >
              {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
