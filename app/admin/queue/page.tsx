'use client'

import React, { useEffect, useState } from 'react';

type ScriptItem = {
  id: string;
  title: string;
  description: string;
  script: string;
  scriptMode: string;
  kind: string;
  authorId: string;
  youtubeUrl: string | null;
  destinationUrl: string | null;
  image: string | null;
  language: string;
  createdAt: string;
  status: string;
};

export default function PendingQueuePage() {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
        const globalCurrentUser = (window as any).currentUser;
        let u = null;
        if (globalCurrentUser) {
            u = globalCurrentUser();
        } else {
            const rawStorage = localStorage.getItem('chituk') || localStorage.getItem('chituk_session');
            if (rawStorage) {
                const parsed = JSON.parse(rawStorage);
                u = parsed.session ? (parsed.db?.users || []).find((x: any) => x.id === parsed.session.id) : null;
            }
        }
        if (u) {
            setUserId(u.id);
        }
    } catch(e) {}
  }, []);

  const fetchQueue = async (uid: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/scripts', {
        headers: { 'X-User-Id': uid }
      });
      if (res.ok) {
        const data = await res.json();
        setScripts(data);
      } else {
        console.error("Failed to fetch queue, status", res.status);
      }
    } catch (e) {
      console.error("Failed to fetch queue", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchQueue(userId);
    }
  }, [userId]);

  const handleAction = async (scriptId: string, action: 'approve' | 'reject' | 'delete') => {
    if (!userId) return;
    try {
      const res = await fetch('/api/admin/scripts/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({ scriptId, action })
      });
      
      if (res.ok) {
        setScripts(prev => prev.filter(s => s.id !== scriptId));
      } else {
        alert("Action failed. You may lack permissions.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 8px 0', color: '#fff' }}>Pending Scripts Queue</h2>
        <p style={{ margin: 0, color: '#A3A3A3' }}>Review and approve community submitted scripts.</p>
      </header>

      {loading ? (
        <p style={{ color: '#737373' }}>Cargando la cola...</p>
      ) : scripts.length === 0 ? (
        <p style={{ color: '#737373', fontStyle: 'italic' }}>No hay scripts pendientes de aprobación en este momento.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {scripts.map(script => (
            <div key={script.id} style={{ 
              backgroundColor: '#131A15', 
              border: '1px solid #262626',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 6px 0', color: '#fff' }}>
                    {script.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#737373', margin: 0 }}>
                    Autor ID: {script.authorId} &bull; {new Date(script.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#E2E8F0', marginBottom: '12px' }}>{script.description}</p>
                <div style={{
                  backgroundColor: '#0A0F0D',
                  padding: '16px',
                  borderRadius: '6px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  border: '1px solid #262626'
                }}>
                  <pre style={{ margin: 0, fontSize: '0.9rem', color: '#A3A3A3', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {script.script}
                  </pre>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => handleAction(script.id, 'approve')}
                  style={{
                    backgroundColor: '#FACC15',
                    color: '#000',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Aprobar
                </button>
                <button 
                  onClick={() => handleAction(script.id, 'reject')}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#dc2626', // Rojo quemado
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Rechazar
                </button>
                <div style={{ flex: 1 }} />
                <button 
                  onClick={() => {
                    if (confirm('¿Eliminar definitivamente este script de la base de datos?')) {
                      handleAction(script.id, 'delete');
                    }
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#525252',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'normal',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
