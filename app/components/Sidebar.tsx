'use client'

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
        const globalCurrentUser = (window as any).currentUser;
        let user = null;
        if (globalCurrentUser) {
            user = globalCurrentUser();
        } else {
            const rawStorage = localStorage.getItem('chituk') || localStorage.getItem('chituk_session');
            if (rawStorage) {
                const parsed = JSON.parse(rawStorage);
                user = parsed.session 
                  ? (parsed.db?.users || []).find((u: any) => u.id === parsed.session.id)
                  : null;
            }
        }
        
        if (user && (user.role === 'owner' || user.role === 'mod')) {
            setIsAdmin(true);
        }
    } catch(e) {}
  }, []);

  return (
    <aside style={{ 
      width: '260px', 
      borderRight: '1px solid #262626', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '24px 0',
      backgroundColor: '#0A0F0D'
    }}>
      <div style={{ padding: '0 24px', marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>Chituk</h1>
      </div>

      <nav style={{ flex: 1, padding: '0 12px' }}>
        <div style={{ marginBottom: '24px' }}>
          <p style={{ padding: '0 12px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#737373', marginBottom: '8px', textTransform: 'uppercase' }}>
            Explorar
          </p>
          <a 
            href="/" 
            style={{
              display: 'block',
              padding: '8px 12px',
              borderRadius: '6px',
              color: pathname === '/' ? '#fff' : '#A3A3A3',
              backgroundColor: pathname === '/' ? '#171717' : 'transparent',
              textDecoration: 'none',
              fontWeight: pathname === '/' ? '500' : 'normal',
              transition: 'all 0.2s ease',
              marginBottom: '4px'
            }}
          >
            Feed
          </a>
          <a 
            href="/mis-scripts" 
            style={{
              display: 'block',
              padding: '8px 12px',
              borderRadius: '6px',
              color: pathname === '/mis-scripts' ? '#fff' : '#A3A3A3',
              backgroundColor: pathname === '/mis-scripts' ? '#171717' : 'transparent',
              textDecoration: 'none',
              fontWeight: pathname === '/mis-scripts' ? '500' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            Mis Scripts
          </a>
        </div>

        {isAdmin && (
          <div>
            <p style={{ padding: '0 12px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#737373', marginBottom: '8px', textTransform: 'uppercase' }}>
              Administrator
            </p>
            <a 
              href="/admin/queue" 
              style={{
                display: 'block',
                padding: '8px 12px',
                borderRadius: '6px',
                color: pathname === '/admin/queue' ? '#fff' : '#A3A3A3',
                backgroundColor: pathname === '/admin/queue' ? '#171717' : 'transparent',
                textDecoration: 'none',
                fontWeight: pathname === '/admin/queue' ? '500' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              Admin Panel
            </a>
          </div>
        )}
      </nav>
    </aside>
  );
}
