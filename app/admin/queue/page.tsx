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

      if (!user || (user.role !== 'owner' && user.role !== 'mod')) {
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
        setScripts(data);
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
    return <div className="p-8 text-neutral-400">Cargando cola de scripts...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Cola de Aprobación</h1>
      
      {scripts.length === 0 ? (
        <p className="text-neutral-500">No hay scripts pendientes por revisar.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {scripts.map(script => (
            <div key={script.id} className="bg-[#131A15] border border-neutral-800 rounded-lg p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#E2E8F0]">{script.title}</h2>
                  <p className="text-sm text-neutral-400 mt-1">Autor ID: {script.authorId}</p>
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <button 
                    onClick={() => handleAction(script.id, 'approve')}
                    className="bg-[#FACC15] text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
                  >
                    Aprobar
                  </button>
                  <button 
                    onClick={() => handleAction(script.id, 'reject')}
                    className="bg-transparent text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-900/20 transition-colors"
                  >
                    Rechazar
                  </button>
                  <button 
                    onClick={() => handleAction(script.id, 'delete')}
                    className="bg-transparent text-neutral-500 px-4 py-2 rounded-md font-medium hover:text-neutral-300 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              
              {script.description && (
                <p className="text-neutral-300 text-sm">{script.description}</p>
              )}
              
              <div className="bg-[#0A0F0D] rounded-md border border-neutral-800/50 p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm font-mono text-neutral-300 whitespace-pre-wrap">
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
