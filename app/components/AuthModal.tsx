'use client';
import React, { useState } from 'react';
import { useAuth, supabase } from './AuthProvider';
import CaptchaWidget, { CaptchaValue } from './CaptchaWidget';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authTab } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>(authTab);
  
  // Login fields
  const [identifier, setIdentifier] = useState(''); // Email o Username
  const [password, setPassword] = useState('');

  // Signup fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'direct_link'>('email');
  const [actionLink, setActionLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<CaptchaValue>({ token: '', answer: '', honeypot: '', isReady: false });

  // Sync tab state when opened
  React.useEffect(() => {
    if (isAuthModalOpen) {
      setTab(authTab);
      setError('');
      setForgotSent(false);
      setActionLink('');
      setCopiedLink(false);
      setGoogleLoading(false);
    }
  }, [isAuthModalOpen, authTab]);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });

      if (oAuthError) throw oAuthError;
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión con Google.");
      setGoogleLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!forgotEmail.trim()) {
        throw new Error("Por favor ingresa un correo electrónico o nombre de usuario registrado.");
      }

      const res = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          origin: window.location.origin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la recuperación de contraseña.");
      }

      if (data.method === 'direct_link' && data.actionLink) {
        setRecoveryMethod('direct_link');
        setActionLink(data.actionLink);
      } else {
        setRecoveryMethod('email');
      }

      setForgotSent(true);
    } catch (err: any) {
      setError(err.message || "Error al solicitar el enlace de recuperación");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        let loginEmail = identifier.trim();

        // Si no tiene @, el usuario ingresó su nombre de usuario
        if (!loginEmail.includes('@')) {
          const res = await fetch('/api/auth/lookup-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loginEmail })
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "No existe ninguna cuenta registrada con ese nombre de usuario.");
          }

          const lookupData = await res.json();
          loginEmail = lookupData.email;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password
        });
        
        if (signInError) {
          if (signInError.message.toLowerCase().includes('invalid login credentials')) {
            throw new Error("Credenciales inválidas. Verifica tu correo/usuario y contraseña.");
          }
          throw signInError;
        }
        
        closeAuthModal();
      } else if (tab === 'signup') {
        if (username.length < 3) throw new Error("El nombre de usuario debe tener al menos 3 caracteres.");
        if (!captchaValue.isReady || !captchaValue.answer) throw new Error("Por favor completa la verificación de seguridad anti-bot.");
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
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
              username: username.trim(),
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
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-8">
          <p className="text-accent text-[10px] font-bold tracking-widest uppercase mb-1">CHITUK</p>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {tab === 'login' ? 'Vuelve al archivo' : tab === 'signup' ? 'Crea tu cuenta' : 'Recuperar Contraseña'}
          </h2>

          {tab !== 'forgot' ? (
            <>
              <div className="flex border-b border-border-theme mb-5">
                <button 
                  className={`flex-1 pb-3 text-sm font-medium cursor-pointer transition-colors ${tab === 'login' ? 'text-foreground border-b-2 border-accent' : 'text-muted hover:text-foreground'}`}
                  onClick={() => { setTab('login'); setError(''); }}
                  type="button"
                >
                  Iniciar sesión
                </button>
                <button 
                  className={`flex-1 pb-3 text-sm font-medium cursor-pointer transition-colors ${tab === 'signup' ? 'text-foreground border-b-2 border-accent' : 'text-muted hover:text-foreground'}`}
                  onClick={() => { setTab('signup'); setError(''); }}
                  type="button"
                >
                  Crear cuenta
                </button>
              </div>

              {/* Botón de Google OAuth */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full py-3 px-4 bg-card hover:bg-card-hover border border-border-theme hover:border-accent/50 text-foreground font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 group"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.21 0 10.04 0 12s.46 3.79 1.26 5.42l4.02-3.13z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                      />
                    </svg>
                  )}
                  <span>{googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-theme"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-base px-3 text-muted text-[10px] font-bold tracking-wider">
                      o con tu cuenta
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mb-6 flex items-center justify-between border-b border-border-theme pb-3">
              <span className="text-xs text-muted">Restablecimiento de acceso</span>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); setForgotSent(false); }}
                className="text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                ← Volver al login
              </button>
            </div>
          )}

          {tab === 'forgot' ? (
            /* FORMULARIO RECUPERAR CONTRASEÑA */
            forgotSent ? (
              <div className="flex flex-col gap-4 text-center py-4">
                {recoveryMethod === 'direct_link' ? (
                  <>
                    <div className="w-14 h-14 bg-accent/15 border border-accent/30 text-accent rounded-2xl flex items-center justify-center mx-auto shadow-md">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">¡Enlace Seguro Listo!</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Para tu comodidad inmediata (evitando esperas por límites del servidor de correo), puedes restablecer tu contraseña directamente haciendo clic aquí:
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = actionLink;
                        }}
                        className="w-full py-3 bg-accent text-accent-contrast rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md flex items-center justify-center gap-2"
                      >
                        <span>Restablecer Contraseña Ahora</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(actionLink);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2500);
                        }}
                        className="w-full py-2 bg-card border border-border-theme hover:border-accent text-xs text-muted hover:text-foreground rounded-xl font-medium transition-colors cursor-pointer"
                      >
                        {copiedLink ? '✓ ¡Enlace copiado al portapapeles!' : 'Copiar enlace directo de recuperación'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setTab('login'); setForgotSent(false); }}
                      className="mt-2 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      Regresar a Iniciar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">¡Enlace enviado!</h3>
                    <p className="text-sm text-muted leading-relaxed">
                      Hemos enviado las instrucciones para restablecer tu contraseña a <strong className="text-accent">{forgotEmail}</strong>. Revisa tu bandeja de entrada o spam.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setTab('login'); setForgotSent(false); }}
                      className="mt-2 w-full py-3 bg-accent text-accent-contrast rounded-lg font-bold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Regresar a Iniciar Sesión
                    </button>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <p className="text-xs text-muted leading-relaxed">
                  Ingresa tu correo electrónico o nombre de usuario registrado y te proporcionaremos acceso seguro para crear una nueva contraseña.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-foreground font-medium">Correo Electrónico o Usuario</label>
                  <input 
                    type="text" 
                    required 
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="tu@email.com o tu_usuario"
                    className="w-full bg-card border border-border-theme text-foreground placeholder:text-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="mt-2 w-full py-3 bg-accent text-accent-contrast rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                </button>

                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(''); }}
                  className="w-full py-2 text-xs text-muted hover:text-foreground transition-colors cursor-pointer text-center"
                >
                  Cancelar y volver
                </button>
              </form>
            )
          ) : (
            /* FORMULARIO LOGIN / SIGNUP */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {tab === 'login' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-foreground font-medium">Email o Nombre de Usuario</label>
                  <input 
                    type="text" 
                    required 
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="tu@email.com o tu_usuario"
                    className="w-full bg-card border border-border-theme text-foreground placeholder:text-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-foreground font-medium">Email</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-card border border-border-theme text-foreground placeholder:text-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-foreground font-medium">Nombre de Usuario</label>
                    <input 
                      type="text" 
                      required 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Sin espacios"
                      className="w-full bg-card border border-border-theme text-foreground placeholder:text-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-foreground font-medium">Contraseña</label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setError(''); }}
                      className="text-xs text-accent hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-card border border-border-theme text-foreground placeholder:text-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
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
                      className="mt-1 w-4 h-4 rounded border-border-theme text-accent focus:ring-accent bg-card"
                    />
                    <label htmlFor="terms" className="text-xs text-muted">
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
                className="mt-2 w-full py-3 bg-accent text-accent-contrast rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Registrarse'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
