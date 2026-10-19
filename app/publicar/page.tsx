'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, supabase } from '../components/AuthProvider';
import CaptchaWidget, { CaptchaValue } from '../components/CaptchaWidget';

export default function PublicarPage() {
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  
  const [title, setTitle] = useState('');
  const [game, setGame] = useState('');
  const [description, setDescription] = useState('');
  const [scriptCode, setScriptCode] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  const [isMobileFriendly, setIsMobileFriendly] = useState(false);
  
  const [captchaValue, setCaptchaValue] = useState<CaptchaValue>({ token: '', answer: '', honeypot: '', isReady: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('La imagen es demasiado pesada (máx 8MB).');
      return;
    }

    setError('');

    // Redimensionar portada para asegurar ratio horizontal nítido y peso ligero
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 960;
        const maxH = 540;
        let w = img.width;
        let h = img.height;

        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCoverImage(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    setCoverImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!captchaValue.isReady || !captchaValue.answer) {
      setError('Por favor completa la verificación de seguridad anti-bot (5 caracteres).');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const res = await fetch('/api/scripts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-User-Id': user.id
        },
        body: JSON.stringify({
          title,
          game,
          description,
          script: scriptCode,
          isMobileFriendly,
          image: coverImage,
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
        <p className="text-sm text-muted">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-card border border-border-theme rounded-2xl text-center shadow-2xl flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent border border-accent/30 flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Inicia Sesión para Publicar Scripts</h2>
        <p className="text-sm text-muted leading-relaxed">
          Comparte tus creaciones con la comunidad de Chituk. Tus scripts pasarán por moderación antes de ser visibles en el feed público.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="mt-2 px-6 py-3 bg-accent text-accent-contrast font-bold rounded-xl hover:opacity-90 transition-opacity shadow-md cursor-pointer"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full relative min-h-full flex flex-col">
      <header className="mb-6 sm:mb-8 shrink-0">
        <p className="text-xs sm:text-sm font-bold text-accent uppercase tracking-widest mb-1">Contribuir</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Publicar un Script</h1>
        <p className="text-neutral-400 text-xs sm:text-sm">Envía tu script para revisión. Una vez aprobado, aparecerá en el feed público.</p>
      </header>

      {success ? (
        <div className="bg-card border border-accent/50 rounded-xl p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Script enviado a revisión</h2>
          <p className="text-neutral-400 text-sm">Tu script ha sido enviado y está en la cola de moderación. Te redirigiremos al inicio...</p>
        </div>
      ) : (
        <div className="bg-base border border-neutral-800 rounded-xl p-4 sm:p-6 shadow-xl flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-neutral-300 mb-2">Título del Script *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Auto Farm OP 2026"
                className="w-full bg-card border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-300 mb-2">ID del Juego o Nombre *</label>
              <input
                type="text"
                required
                value={game}
                onChange={(e) => setGame(e.target.value)}
                placeholder="Ej. Blox Fruits o 2753915549"
                className="w-full bg-card border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            {/* Portada Opcional */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-neutral-300">
                  Portada del Script
                </label>
                <span className="text-xs text-neutral-500 font-medium bg-card px-2 py-0.5 rounded border border-neutral-800">
                  Opcional
                </span>
              </div>

              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />

              {coverImage ? (
                <div className="relative rounded-xl overflow-hidden border border-border-theme aspect-video max-h-56 w-full bg-neutral-900 group shadow-md">
                  <img src={coverImage} alt="Vista previa de portada" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-card-hover hover:bg-neutral-800 text-white text-xs font-bold rounded-lg border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Cambiar Portada
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="px-3.5 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-800 hover:border-accent/60 bg-card/40 hover:bg-card/70 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-base border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-accent group-hover:border-accent transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm font-bold text-accent group-hover:underline inline-flex items-center gap-1.5 pointer-events-none"
                    >
                      Subir foto de portada
                    </button>
                    <p className="text-xs text-neutral-500 mt-1">PNG, JPG o WEBP en formato panorámico 16:9 (opcional)</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-300 mb-2">Descripción *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe qué hace tu script, requisitos, cómo usarlo..."
                className="w-full bg-card border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-y"
              ></textarea>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="mobile-friendly" className="relative inline-flex items-center cursor-pointer">
                <input 
                  id="mobile-friendly"
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isMobileFriendly}
                  onChange={e => setIsMobileFriendly(e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0A0F0D] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
              <span className="text-sm font-bold text-neutral-300">Compatible con Dispositivos Móviles (Mobile)</span>
            </div>

            <div className="flex-1 flex flex-col min-h-[300px]">
              <label className="block text-sm font-bold text-neutral-300 mb-2">Código Fuente (Lua) *</label>
              <textarea
                required
                value={scriptCode}
                onChange={(e) => setScriptCode(e.target.value)}
                placeholder="loadstring(game:HttpGet('...'))()"
                className="w-full flex-1 bg-card border border-neutral-800 text-neutral-300 font-mono text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
                spellCheck="false"
              ></textarea>
            </div>

            {/* Verificación Anti-Bot */}
            <CaptchaWidget onChange={setCaptchaValue} />

            <div className="pt-4 border-t border-neutral-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-accent text-black rounded-lg font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar para Revisión
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
