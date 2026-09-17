'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, supabase } from '../components/AuthProvider';

export default function PublicarPage() {
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scriptCode, setScriptCode] = useState('');
  
  const [isNoKey, setIsNoKey] = useState(false);
  const [isMobileFriendly, setIsMobileFriendly] = useState(false);
  const [isOpenSource, setIsOpenSource] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      openAuthModal('login');
    }
  }, [user, authLoading, router, openAuthModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const res = await fetch('/api/scripts/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          description,
          script: scriptCode,
          features: {
            isNoKey,
            isMobileFriendly,
            isOpenSource,
            isPaid
          }
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al publicar el script');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500 animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full relative h-full flex flex-col">
      <header className="mb-8 shrink-0">
        <p className="text-sm font-bold text-[#FACC15] uppercase tracking-widest mb-1">Contribuir</p>
        <h1 className="text-3xl font-bold text-white mb-2">Publicar un Script</h1>
        <p className="text-neutral-400">Envía tu script para revisión. Una vez aprobado, aparecerá en el feed público.</p>
      </header>

      {success ? (
        <div className="bg-[#131A15] border border-[#FACC15]/50 rounded-xl p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#FACC15]/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#FACC15]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">¡Script Enviado!</h2>
          <p className="text-neutral-400">Tu script ha sido enviado y está en la cola de moderación. Te redirigiremos al dashboard...</p>
        </div>
      ) : (
        <div className="bg-[#131A15] border border-neutral-800 rounded-xl p-6 shadow-xl flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Título del Script *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Auto Farm OP 2024"
                className="w-full bg-[#0A0F0D] border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] focus:ring-1 focus:ring-[#FACC15] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Juego / Descripción (Opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Blox Fruits"
                className="w-full bg-[#0A0F0D] border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] focus:ring-1 focus:ring-[#FACC15] transition-colors"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-[300px]">
              <label className="block text-sm font-medium text-neutral-300 mb-2">Código Fuente (Lua) *</label>
              <textarea
                required
                value={scriptCode}
                onChange={(e) => setScriptCode(e.target.value)}
                placeholder="loadstring(game:HttpGet('...'))()"
                className="w-full flex-1 bg-[#0A0F0D] border border-neutral-800 text-neutral-300 font-mono text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] focus:ring-1 focus:ring-[#FACC15] transition-colors resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer bg-[#0A0F0D] border border-neutral-800 p-3 rounded-lg hover:border-neutral-600 transition-colors">
                <input type="checkbox" checked={isNoKey} onChange={e => setIsNoKey(e.target.checked)} className="rounded bg-neutral-900 border-neutral-700 text-[#FACC15] focus:ring-[#FACC15]" />
                <span className="text-sm font-bold text-neutral-300 flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> No Key</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer bg-[#0A0F0D] border border-neutral-800 p-3 rounded-lg hover:border-neutral-600 transition-colors">
                <input type="checkbox" checked={isMobileFriendly} onChange={e => setIsMobileFriendly(e.target.checked)} className="rounded bg-neutral-900 border-neutral-700 text-[#FACC15] focus:ring-[#FACC15]" />
                <span className="text-sm font-bold text-neutral-300 flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> Mobile</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-[#0A0F0D] border border-neutral-800 p-3 rounded-lg hover:border-neutral-600 transition-colors">
                <input type="checkbox" checked={isOpenSource} onChange={e => setIsOpenSource(e.target.checked)} className="rounded bg-neutral-900 border-neutral-700 text-[#FACC15] focus:ring-[#FACC15]" />
                <span className="text-sm font-bold text-neutral-300 flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> Open Source</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-[#0A0F0D] border border-neutral-800 p-3 rounded-lg hover:border-neutral-600 transition-colors">
                <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} className="rounded bg-neutral-900 border-neutral-700 text-[#FACC15] focus:ring-[#FACC15]" />
                <span className="text-sm font-bold text-neutral-300 flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Paid</span>
              </label>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-[#FACC15] text-black rounded-lg font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
