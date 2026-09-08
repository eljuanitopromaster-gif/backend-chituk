'use client'

import { useEffect, useState } from 'react';

export default function TermsModal() {
  const [show, setShow] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificamos periódicamente el estado de la sesión local
    const interval = setInterval(() => {
        try {
            // Intentamos leer el estado global guardado por chituk-script.js
            // Dependiendo de la implementación de window.storage puede estar en localStorage
            const rawStorage = localStorage.getItem('chituk') || localStorage.getItem('chituk_session');
            
            // También revisamos si la función currentUser existe globalmente
            const globalCurrentUser = (window as any).currentUser;

            if (globalCurrentUser) {
                const user = globalCurrentUser();
                if (user && user.terms_accepted === false) {
                    setUserId(user.id);
                    setShow(true);
                } else {
                    setShow(false);
                }
            } else if (rawStorage) {
                const parsed = JSON.parse(rawStorage);
                const sessionUser = parsed.session 
                  ? (parsed.db?.users || []).find((u: any) => u.id === parsed.session.id)
                  : null;
                  
                if (sessionUser && sessionUser.terms_accepted === false) {
                    setUserId(sessionUser.id);
                    setShow(true);
                } else {
                    setShow(false);
                }
            }
        } catch (e) {
            // Silently ignore parse errors
        }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAccept = async () => {
    if (!userId) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/users/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });
      
      if (res.ok) {
        setShow(false);
        // Recargamos la página para que el script vanilla vuelva a obtener 
        // los datos fresquecitos de la BD con el terms_accepted en true
        window.location.reload(); 
      } else {
        console.error("Error al aceptar términos");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#0A0F0D', // Temática selva: oscuro
      color: '#fff',
      zIndex: 999999, // Bloquea todo
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#FACC15', fontWeight: 'bold' }}>
        🌴 Reglas de la Jungla (Términos de Uso)
      </h2>
      <div style={{ maxWidth: '650px', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2.5rem', color: '#E2E8F0', textAlign: 'left' }}>
        <p style={{ marginBottom: '1rem', textAlign: 'center' }}>
          Bienvenido a Chituk. Antes de explorar, debes aceptar nuestras condiciones:
        </p>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <strong>Bajo tu propio riesgo:</strong> Esta plataforma aloja scripts creados por la comunidad. No nos hacemos responsables por baneos, eliminaciones de cuenta, o cualquier sanción en Roblox.
          </li>
          <li>
            <strong>Cero garantías:</strong> Aunque nuestro equipo (Silverbacks) aprueba manualmente los scripts para evitar software malicioso, tú eres el único responsable de lo que inyectas o ejecutas en tu dispositivo.
          </li>
          <li>
            <strong>Uso de la plataforma:</strong> Al entrar, aceptas que Chituk es solo un repositorio informativo y de almacenamiento.
          </li>
        </ul>
      </div>
      <button 
        onClick={handleAccept}
        disabled={loading}
        style={{
          backgroundColor: '#FACC15', // Color banana
          color: '#0A0F0D',
          border: 'none',
          padding: '16px 32px',
          fontSize: '1.2rem',
          fontWeight: '900',
          borderRadius: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 4px 15px rgba(250, 204, 21, 0.3)'
        }}
      >
        {loading ? 'Actualizando...' : 'Aceptar y Continuar'}
      </button>
    </div>
  );
}
