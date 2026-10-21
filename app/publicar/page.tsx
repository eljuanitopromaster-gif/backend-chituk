'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, supabase } from '../components/AuthProvider';
import CaptchaWidget, { CaptchaValue } from '../components/CaptchaWidget';
import SubmitScriptForm, { ScriptFormState } from '../components/SubmitScriptForm';

export default function PublicarPage() {
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  
  const [captchaValue, setCaptchaValue] = useState<CaptchaValue>({
    token: '',
    answer: '',
    honeypot: '',
    isReady: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: ScriptFormState) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!captchaValue.isReady || !captchaValue.answer) {
      setError('Por favor completa la verificación de seguridad anti-bot (5 caracteres).');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      // Construcción enriquecida de descripción con créditos y enlaces
      let compiledDescription = formData.description;
      if (formData.hasCredits && formData.creditsText) {
        compiledDescription += `\n\n> **Créditos:** ${formData.creditsText}`;
      }
      if (formData.tags && formData.tags.length > 0) {
        compiledDescription += `\n\n${formData.tags.map(t => `#${t}`).join(' ')}`;
      }

      const res = await fetch('/api/scripts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-User-Id': user.id
        },
        body: JSON.stringify({
          title: formData.title,
          game: formData.targetType === 'universal' ? 'Universal' : formData.gameName,
          description: compiledDescription,
          script: formData.scriptLua,
          isMobileFriendly: formData.properties.mobileFriendly,
          image: formData.thumbnailUrl,
          captchaToken: captchaValue.token,
          captchaAnswer: captchaValue.answer,
          honeypot: captchaValue.honeypot
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al publicar el script');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted">Cargando Chituk Studio...</p>
      </div>
    );
  }



  if (success) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-card border border-accent/40 rounded-3xl text-center shadow-2xl flex flex-col items-center gap-4 backdrop-blur-xl animate-fadeIn">
        <div className="w-16 h-16 bg-accent/20 border border-accent/40 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-foreground">¡Script Enviado a Revisión!</h2>
        <p className="text-muted text-sm leading-relaxed">
          Tu script ha sido registrado y está en la cola de revisión comunitaria. Te redirigiremos al inicio en unos momentos...
        </p>
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mt-2" />
      </div>
    );
  }

  return (
    <div className="min-h-full py-4 sm:py-8">
      {error && (
        <div className="max-w-5xl mx-auto px-4 mb-4">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3 backdrop-blur-md">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {!user && (
        <div className="max-w-5xl mx-auto px-3 sm:px-6 mb-4">
          <div className="p-4 rounded-2xl bg-accent/10 border border-accent/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  Modo borrador (sin sesión iniciada)
                </p>
                <p className="text-[11px] sm:text-xs text-muted">
                  Puedes redactar, probar la previsualización y preparar tu script; se te pedirá iniciar sesión al publicarlo.
                </p>
              </div>
            </div>
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 rounded-xl bg-accent text-accent-contrast font-bold text-xs hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      )}

      <SubmitScriptForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        securityWidget={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-accent text-lg">🛡️</span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Verificación Anti-Bot
              </h3>
            </div>
            <p className="text-xs text-muted">
              Protegemos a la comunidad contra spam automatizado resolviendo este código.
            </p>
            <CaptchaWidget onChange={setCaptchaValue} />
          </div>
        }
      />
    </div>
  );
}
