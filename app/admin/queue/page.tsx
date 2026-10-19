'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, supabase } from '../../components/AuthProvider';

interface Script {
  id: string;
  title: string;
  description?: string;
  script: string;
  authorId: string;
  createdAt: string;
  status: string;
}

export default function AdminQueuePage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function checkAuthAndFetch() {
      if (authLoading) return;

      if (!user || !['owner', 'admin', 'creator', 'mod'].includes(user.role)) {
        router.push('/');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const res = await fetch('/api/admin/scripts', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'X-User-Id': user.id
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch pending scripts');
        }

        const data = await res.json();
        setScripts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Ocurrió un error');
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndFetch();
  }, [user, authLoading, router]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch('/api/admin/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-User-Id': user.id
        },
        body: JSON.stringify({ projectId: id, action })
      });

      if (!res.ok) {
        throw new Error('Failed to perform action');
      }

      // Remover de la lista
      setScripts(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p>Cargando cola de scripts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl max-w-lg mx-auto">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 bg-card border border-border-theme rounded-2xl">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-accent uppercase mb-1 block">Moderación</span>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Cola de Aprobación de Scripts</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Revisa, aprueba o rechaza los scripts enviados por la comunidad.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-base border border-border-theme text-xs font-bold text-accent shrink-0">
          {scripts.length} {scripts.length === 1 ? 'pendiente' : 'pendientes'}
        </span>
      </div>
      
      {scripts.length === 0 ? (
        <div className="p-8 sm:p-12 bg-card border border-border-theme rounded-2xl text-center text-muted">
          <svg className="w-12 h-12 mx-auto mb-3 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-foreground">¡Todo al día!</p>
          <p className="text-xs sm:text-sm text-muted mt-1">No hay scripts pendientes por revisar en este momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {scripts.map(script => (
            <div key={script.id} className="bg-card border border-border-theme rounded-2xl p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">{script.title}</h2>
                  <p className="text-xs text-muted font-mono mt-1">Autor ID: {script.authorId}</p>
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <button 
                    onClick={() => handleAction(script.id, 'approve')}
                    className="bg-accent text-accent-contrast px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                  >
                    Aprobar
                  </button>
                  <button 
                    onClick={() => handleAction(script.id, 'reject')}
                    className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    Rechazar
                  </button>
                  <button 
                    onClick={() => handleAction(script.id, 'delete')}
                    className="bg-base border border-border-theme text-muted hover:text-foreground px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              
              {script.description && (
                <p className="text-foreground/90 text-sm">{script.description}</p>
              )}
              
              <div className="bg-base rounded-xl border border-border-theme p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                  {script.script}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
