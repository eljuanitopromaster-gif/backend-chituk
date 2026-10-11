'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface CaptchaValue {
  token: string;
  answer: string;
  honeypot: string;
  isReady: boolean;
}

interface CaptchaWidgetProps {
  onChange: (value: CaptchaValue) => void;
  compact?: boolean;
  className?: string;
}

export default function CaptchaWidget({ onChange, compact = false, className = '' }: CaptchaWidgetProps) {
  const [token, setToken] = useState<string>('');
  const [svg, setSvg] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');

  const loadCaptcha = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    setAnswer('');
    try {
      const res = await fetch('/api/captcha', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al generar código');
      const data = await res.json();
      setToken(data.token);
      setSvg(data.svg);
    } catch (err: any) {
      setFetchError('No se pudo cargar el captcha. Haz clic para reintentar.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    setRefreshing(true);
    loadCaptcha();
  };

  const handleAnswerChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setAnswer(clean);
    onChange({
      token,
      answer: clean,
      honeypot,
      isReady: clean.length === 5,
    });
  };

  const handleHoneypotChange = (val: string) => {
    setHoneypot(val);
    onChange({
      token,
      answer,
      honeypot: val,
      isReady: answer.length === 5,
    });
  };

  // Sync token whenever it changes
  useEffect(() => {
    onChange({
      token,
      answer,
      honeypot,
      isReady: answer.length === 5,
    });
  }, [token]);

  if (compact) {
    return (
      <div className={`p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl flex flex-col gap-2.5 relative shadow-md ${className}`}>
        {/* Invisible honeypot for bots */}
        <input
          type="text"
          name="bot_trap_secondary"
          value={honeypot}
          onChange={(e) => handleHoneypotChange(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xs text-neutral-300 font-semibold tracking-wide">Código de Seguridad</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Cambiar código"
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-[10px] text-neutral-500 hover:text-neutral-300">Recargar</span>
          </button>
        </div>

        {/* Captcha Display & Input row */}
        <div className="flex items-center gap-2.5">
          {loading ? (
            <div className="w-[140px] h-[38px] bg-neutral-800/80 animate-pulse rounded-lg border border-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 shrink-0">
              Generando...
            </div>
          ) : fetchError ? (
            <button
              type="button"
              onClick={loadCaptcha}
              className="text-xs text-rose-400 hover:underline cursor-pointer shrink-0"
            >
              Reintentar
            </button>
          ) : (
            <div
              className="rounded-lg overflow-hidden border border-neutral-700/80 select-none shadow-inner shrink-0"
              style={{ width: '140px', height: '38px' }}
              dangerouslySetInnerHTML={{
                __html: svg.replace('width="190"', 'width="140"').replace('height="50"', 'height="38"'),
              }}
            />
          )}

          {/* Input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              required
              maxLength={5}
              value={answer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="CÓDIGO"
              className="w-full bg-black/60 border border-neutral-700 focus:border-accent text-white font-mono tracking-widest text-center uppercase text-xs py-2.5 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:tracking-normal placeholder:text-neutral-500 placeholder:text-[11px]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-card/90 border border-neutral-800 rounded-xl relative flex flex-col gap-3 shadow-lg ${className}`}>
      {/* Invisible honeypot for bots */}
      <input
        type="text"
        name="bot_trap_primary"
        value={honeypot}
        onChange={(e) => handleHoneypotChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-neutral-200 tracking-wide">
            Verificación de Seguridad
          </span>
        </div>
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Anti-Bot
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Captcha Image */}
        <div className="relative flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {loading ? (
            <div className="w-[190px] h-[50px] bg-neutral-900 animate-pulse rounded-lg border border-neutral-800 flex items-center justify-center text-xs text-neutral-500">
              Generando seguridad...
            </div>
          ) : fetchError ? (
            <div className="w-[190px] h-[50px] bg-neutral-900 rounded-lg border border-rose-900/50 flex flex-col items-center justify-center p-2 text-center">
              <span className="text-[10px] text-rose-400 leading-tight mb-1">{fetchError}</span>
              <button
                type="button"
                onClick={loadCaptcha}
                className="text-xs text-accent hover:underline font-bold cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div
              className="rounded-lg overflow-hidden border border-neutral-700/70 select-none shadow-md shrink-0"
              style={{ width: '190px', height: '50px' }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}

          <button
            type="button"
            onClick={handleRefresh}
            title="Cambiar código"
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors border border-transparent hover:border-neutral-700 cursor-pointer"
          >
            <svg
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Input Field */}
        <div className="w-full flex-1">
          <input
            type="text"
            required
            maxLength={5}
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="CÓDIGO (5 LETRAS/NÚM)"
            className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-accent text-white font-mono tracking-[0.25em] text-center uppercase text-sm py-3 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:tracking-normal placeholder:text-neutral-500 placeholder:text-xs"
          />
        </div>
      </div>

      <p className="text-[11px] text-neutral-400">
        Escribe los 5 caracteres que ves arriba para validar que eres humano.
      </p>
    </div>
  );
}
