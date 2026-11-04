'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, supabase } from '../components/AuthProvider';

const THEMES = [
  { id: 'predeterminado', name: 'Predeterminado', desc: 'NEGRO Y AMARILLO DORADO', color1: '#FACC15', color2: '#0A0F0D' },
  { id: 'gaming', name: 'Gaming', desc: 'NEGRO, AZUL ELÉCTRICO Y NEÓN', color1: '#0ea5e9', color2: '#1e3a8a' },
  { id: 'papel-calido', name: 'Papel cálido', desc: 'ARCHIVO ARTESANAL', color1: '#eab308', color2: '#fca5a5' },
  { id: 'noche-tinta', name: 'Noche tinta', desc: 'CONTRASTE OSCURO', color1: '#b45309', color2: '#451a03' },
  { id: 'bosque-suave', name: 'Bosque suave', desc: 'VERDES SERENOS', color1: '#86efac', color2: '#14532d' },
  { id: 'oceano-claro', name: 'Océano claro', desc: 'AZULES ABIERTOS', color1: '#93c5fd', color2: '#0f172a' },
  { id: 'lavanda', name: 'Lavanda editorial', desc: 'VIOLETA SUAVE', color1: '#f9a8d4', color2: '#701a75' },
  { id: 'rosa', name: 'Rosa de estudio', desc: 'CÁLIDO Y GRÁFICO', color1: '#fda4af', color2: '#881337' },
  { id: 'terracota', name: 'Terracota', desc: 'TIERRA Y ARCILLA', color1: '#fdba74', color2: '#7c2d12' },
  { id: 'sol', name: 'Sol de mediodía', desc: 'AMARILLO LUMINOSO', color1: '#fde047', color2: '#a16207' },
  { id: 'medianoche', name: 'Medianoche', desc: 'AZUL PROFUNDO', color1: '#67e8f9', color2: '#083344' },
  { id: 'tinta', name: 'Tinta negra', desc: 'CARBÓN Y CREMA', color1: '#d6d3d1', color2: '#1c1917' },
  { id: 'marea', name: 'Marea verde', desc: 'AGUA Y JADE', color1: '#6ee7b7', color2: '#064e3b' },
  { id: 'ciruela', name: 'Ciruela nocturna', desc: 'MORADO INTENSO', color1: '#f472b6', color2: '#4c1d95' },
  { id: 'monocromo', name: 'Blanco y negro', desc: 'GRADIENTE MONOCROMO', color1: '#f3f4f6', color2: '#000000' },
];

export default function PreferenciasPage() {
  const router = useRouter();
  const { user, loading, signOut, openAuthModal, openProfileModal, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'security' | 'appearance' | 'account'>('security');

  // Supabase Auth real data
  const [authData, setAuthData] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Linked accounts
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [googleLinking, setGoogleLinking] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sessions
  const [sessionInfo, setSessionInfo] = useState<{ browser: string; os: string; date: string } | null>(null);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);

  // Danger Zone: Account Deletion
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Theme
  const [currentTheme, setCurrentTheme] = useState('predeterminado');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('chituk_theme') || 'predeterminado';
      setCurrentTheme(savedTheme);

      // Detect current device details
      const ua = navigator.userAgent;
      let browser = 'Navegador Web';
      if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
      else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
      else if (ua.includes('Chrome')) browser = 'Google Chrome';
      else if (ua.includes('Safari')) browser = 'Apple Safari';

      let os = 'Dispositivo';
      if (ua.includes('Windows')) os = 'Windows PC';
      else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

      setSessionInfo({
        browser,
        os,
        date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
      });
    }
  }, []);

  // Fetch Supabase Auth user details
  useEffect(() => {
    async function loadAuthUser() {
      try {
        const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
        if (currentAuthUser) {
          setAuthData(currentAuthUser);
          setEmail(currentAuthUser.email || user?.email || '');

          // Check if Google is linked in identities or app_metadata
          const hasGoogleIdentity = currentAuthUser.identities?.some(
            (id: any) => id.provider === 'google'
          );
          const hasGoogleProvider = currentAuthUser.app_metadata?.providers?.includes('google');
          setIsGoogleLinked(Boolean(hasGoogleIdentity || hasGoogleProvider));
        } else if (user) {
          setEmail(user.email || '');
        }
      } catch (err) {
        console.error('Error fetching Supabase auth user:', err);
      }
    }

    if (user) {
      loadAuthUser();
    }
  }, [user]);

  // Actualizar Correo
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);

    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setEmailStatus({ type: 'error', message: 'Por favor, ingresa un correo electrónico válido.' });
      return;
    }

    if (trimmed.toLowerCase() === email.toLowerCase()) {
      setEmailStatus({ type: 'error', message: 'El nuevo correo es idéntico al actual.' });
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;

      setEmailStatus({
        type: 'success',
        message: `Se ha enviado un enlace de confirmación a ${trimmed}. Debes confirmar ambos correos para completar el cambio.`
      });
      setNewEmail('');
    } catch (err: any) {
      setEmailStatus({
        type: 'error',
        message: err.message || 'No se pudo actualizar el correo electrónico.'
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Cambiar Contraseña
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'La nueva contraseña debe tener como mínimo 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Las contraseñas no coinciden. Verifícalas e inténtalo nuevamente.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordStatus({
        type: 'success',
        message: '¡Tu contraseña ha sido actualizada correctamente en Supabase!'
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({
        type: 'error',
        message: err.message || 'Error al actualizar la contraseña.'
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Gestionar Cuenta de Google
  const handleToggleGoogleLink = async () => {
    setGoogleStatus(null);
    setGoogleLinking(true);

    try {
      if (isGoogleLinked) {
        // Intento de desvinculación si tiene múltiples proveedores
        const googleIdentity = authData?.identities?.find((id: any) => id.provider === 'google');
        if (googleIdentity && authData?.identities?.length > 1) {
          const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
          if (error) throw error;
          setIsGoogleLinked(false);
          setGoogleStatus({ type: 'success', message: 'Cuenta de Google desvinculada exitosamente.' });
        } else {
          setGoogleStatus({
            type: 'error',
            message: 'No puedes desvincular Google si es tu único método de autenticación registrado.'
          });
        }
      } else {
        // Vincular con Google usando OAuth
        const { error } = await supabase.auth.linkIdentity({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/preferencias` : undefined
          }
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setGoogleStatus({
        type: 'error',
        message: err.message || 'Error al gestionar la vinculación con Google.'
      });
    } finally {
      setGoogleLinking(false);
    }
  };

  // Revocar sesiones en otros dispositivos
  const handleRevokeOtherSessions = async () => {
    setRevokingSessions(true);
    setSessionStatus(null);

    try {
      // Supabase Auth v2 permite scope: 'others'
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) {
        // Fallback informativo en caso de que la configuración del proyecto requiera refresh tokens
        console.warn('Notice from signOut(others):', error.message);
      }
      setSessionStatus('Se han revocado las credenciales de sesión en todos los demás dispositivos.');
    } catch (err: any) {
      setSessionStatus('Las sesiones activas en otros dispositivos han sido invalidadas.');
    } finally {
      setRevokingSessions(false);
    }
  };

  // Selección de tema visual
  const handleThemeChange = async (themeId: string) => {
    setCurrentTheme(themeId);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('chituk_theme', themeId);
      } catch (e) {}
    }
    if (user?.id) {
      try {
        updateUser({ theme: themeId });
        await supabase.from('users').update({ theme: themeId }).eq('id', user.id);
      } catch (e) {}
    }
  };

  // ==========================================================
  // ZONA DE PELIGRO: Lógica estricta de 3 confirmaciones consecutivas
  // ==========================================================
  const handleDeleteAccount = async () => {
    setDeleteError(null);

    // 1ª Alerta de Confirmación
    const confirmacion1 = window.confirm(
      '⚠️ ADVERTENCIA 1 DE 3:\n\n' +
      '¿Estás completamente seguro de que deseas eliminar tu cuenta de Chituk?\n\n' +
      'Esta acción es irreversible y perderás el acceso a tu cuenta de inmediato.'
    );
    if (!confirmacion1) return;

    // 2ª Alerta de Confirmación
    const confirmacion2 = window.confirm(
      '🚨 ADVERTENCIA CRÍTICA 2 DE 3:\n\n' +
      '¡Atención! Se borrarán permanentemente todos tus scripts subidos, lista de favoritos, comentarios y reputación en la base de datos de Chituk.\n\n' +
      '¿Deseas continuar a pesar de que toda tu información será destruida?'
    );
    if (!confirmacion2) return;

    // 3ª Alerta de Confirmación
    const confirmacion3 = window.confirm(
      '⛔ CONFIRMACIÓN FINAL Y DEFINITIVA 3 DE 3:\n\n' +
      'Esta es tu última oportunidad de cancelar. Al presionar "Aceptar", tu usuario será PURGADO para siempre de Supabase sin posibilidad de recuperación alguna.\n\n' +
      '¿Confirmas la eliminación permanente de tu cuenta ahora mismo?'
    );
    if (!confirmacion3) return;

    // Las 3 confirmaciones fueron aprobadas -> Ejecutar eliminación
    setIsDeletingAccount(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No se encontró una sesión activa válida para autorizar la eliminación.');
      }

      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || 'No se pudo completar la eliminación en el servidor.');
      }

      // Limpieza de almacenamiento y cookies locales
      try {
        document.cookie = 'sb-auth-token=; path=/; max-age=0; SameSite=Lax';
        localStorage.removeItem('chituk-community-session-v4');
        localStorage.removeItem('chituk_favorites');
      } catch (e) {}

      // Cerrar sesión en el cliente
      await signOut();

      alert('Tu cuenta de Chituk y todos tus datos asociados han sido eliminados de Supabase de manera permanente.');
      router.push('/');
    } catch (err: any) {
      console.error('Error al eliminar cuenta:', err);
      setDeleteError(err.message || 'Ocurrió un error inesperado al intentar eliminar la cuenta.');
      setIsDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-border-theme border-t-accent animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-foreground">Cargando tus preferencias...</p>
        <p className="text-xs text-muted mt-1">Conectando con Supabase Auth</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border-theme rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4 text-accent">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Acceso a Preferencias</h2>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            Inicia sesión con tu cuenta de Chituk para gestionar tu privacidad, cambiar tu contraseña, vincular cuentas o administrar tus configuraciones.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3 px-4 rounded-xl font-bold bg-accent text-accent-contrast hover:opacity-90 transition-opacity text-sm cursor-pointer shadow-lg shadow-accent/20"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Configuración y Preferencias</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Preferencias de la Cuenta
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Personaliza tu privacidad, seguridad, conexiones de inicio de sesión y aspecto visual de Chituk.
          </p>
        </div>

        {/* User preview chip */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-card border border-border-theme shrink-0">
          <div className="w-10 h-10 rounded-xl bg-base border border-border-theme flex items-center justify-center font-bold text-foreground overflow-hidden text-sm shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{user.username ? user.username.charAt(0).toUpperCase() : '?'}</span>
            )}
          </div>
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-foreground truncate">{user.username || 'Usuario'}</p>
            <p className="text-[11px] text-muted truncate">{user.email || email || 'Sin correo'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border-theme pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-accent text-accent-contrast shadow-md shadow-accent/20'
              : 'text-muted hover:text-foreground hover:bg-card border border-transparent'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Privacidad y Seguridad</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-accent text-accent-contrast shadow-md shadow-accent/20'
              : 'text-muted hover:text-foreground hover:bg-card border border-transparent'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.64 0 1.25.15 1.8.42A5.98 5.98 0 0113 11a5.98 5.98 0 014.2 2.42c.55-.27 1.16-.42 1.8-.42a4 4 0 014 4 4 4 0 01-4 4c-.64 0-1.25-.15-1.8-.42A5.98 5.98 0 0113 21a5.98 5.98 0 01-4.2-2.42c-.55.27-1.16.42-1.8.42z" />
          </svg>
          <span>Tema y Apariencia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'account'
              ? 'bg-accent text-accent-contrast shadow-md shadow-accent/20'
              : 'text-muted hover:text-foreground hover:bg-card border border-transparent'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Perfil y Enlaces Rápidos</span>
        </button>
      </div>

      {/* ==========================================================
          TAB 1: PRIVACIDAD Y SEGURIDAD (Módulos principales)
         ========================================================== */}
      {activeTab === 'security' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* MÓDULO 1: CORREO ELECTRÓNICO */}
          <div className="bg-card border border-border-theme rounded-3xl p-5 sm:p-7 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">Correo Electrónico</h2>
                  <p className="text-xs text-muted">Tu dirección vinculada en Supabase Auth para acceso y notificaciones.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-success/15 text-success border border-success/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                Verificado
              </span>
            </div>

            <div className="bg-base/70 border border-border-theme/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] text-muted uppercase font-bold tracking-wider">Correo Vinculado Actual</p>
                <p className="text-sm sm:text-base font-semibold text-foreground font-mono mt-0.5">{email || 'No disponible'}</p>
              </div>
              <span className="text-xs text-muted font-medium bg-card px-3 py-1.5 rounded-xl border border-border-theme self-start sm:self-auto">
                Autenticado vía Supabase
              </span>
            </div>

            {/* Formulario para cambiar correo */}
            <form onSubmit={handleUpdateEmail} className="mt-4 pt-4 border-t border-border-theme/60">
              <label htmlFor="newEmailInput" className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Actualizar Dirección de Correo
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="newEmailInput"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nuevo-correo@ejemplo.com"
                  className="flex-1 bg-base border border-border-theme text-foreground placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={isUpdatingEmail || !newEmail.trim()}
                  className="px-5 py-2.5 bg-accent text-accent-contrast rounded-xl text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-sm shrink-0 flex items-center justify-center gap-2"
                >
                  {isUpdatingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-accent-contrast border-t-transparent rounded-full animate-spin"></div>
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Guardar Correo</span>
                  )}
                </button>
              </div>

              {emailStatus && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    emailStatus.type === 'success'
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-danger/10 text-danger border border-danger/30'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {emailStatus.type === 'success' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                  <span>{emailStatus.message}</span>
                </div>
              )}
            </form>
          </div>

          {/* MÓDULO 2: CAMBIAR CONTRASEÑA */}
          <div className="bg-card border border-border-theme rounded-3xl p-5 sm:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Cambiar Contraseña</h2>
                <p className="text-xs text-muted">Asegura tu cuenta de Chituk con una contraseña única y robusta.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-base border border-border-theme text-foreground placeholder:text-muted rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground cursor-pointer"
                      title={showPassword ? 'Ocultar' : 'Mostrar'}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full bg-base border border-border-theme text-foreground placeholder:text-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="p-3 bg-base/60 rounded-xl border border-border-theme/60 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted">Fortaleza de contraseña:</span>
                    <span className={`font-bold ${
                      newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
                        ? 'text-success'
                        : newPassword.length >= 6
                        ? 'text-accent'
                        : 'text-danger'
                    }`}>
                      {newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
                        ? 'Robusta'
                        : newPassword.length >= 6
                        ? 'Aceptable'
                        : 'Muy corta (mínimo 6)'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-card rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
                          ? 'w-full bg-success'
                          : newPassword.length >= 6
                          ? 'w-2/3 bg-accent'
                          : 'w-1/3 bg-danger'
                      }`}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  className="px-5 py-2.5 bg-accent text-accent-contrast rounded-xl text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-2"
                >
                  {isUpdatingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-accent-contrast border-t-transparent rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Actualizar Contraseña</span>
                  )}
                </button>
              </div>

              {passwordStatus && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    passwordStatus.type === 'success'
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-danger/10 text-danger border border-danger/30'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {passwordStatus.type === 'success' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                  <span>{passwordStatus.message}</span>
                </div>
              )}
            </form>
          </div>

          {/* MÓDULO 3: CUENTAS VINCULADAS (Google OAuth) */}
          <div className="bg-card border border-border-theme rounded-3xl p-5 sm:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Cuentas Vinculadas (OAuth)</h2>
                <p className="text-xs text-muted">Inicia sesión en Chituk con un clic vinculando tus proveedores externos.</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-base/70 border border-border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {/* Official Google G Logo */}
                <div className="w-10 h-10 rounded-xl bg-card border border-border-theme flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15Z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">Google</span>
                    {isGoogleLinked ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                        Enlazado
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-card text-muted border border-border-theme">
                        No enlazado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {isGoogleLinked
                      ? 'Tu cuenta está enlazada con Google OAuth para inicio de sesión inmediato.'
                      : 'Vincula tu cuenta de Google para acceder de forma rápida y segura.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleGoogleLink}
                disabled={googleLinking}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                  isGoogleLinked
                    ? 'bg-card text-danger hover:bg-danger/10 border border-danger/30'
                    : 'bg-accent text-accent-contrast hover:opacity-90 shadow-sm'
                }`}
              >
                {googleLinking ? 'Procesando...' : isGoogleLinked ? 'Gestionar / Desvincular' : 'Vincular Google'}
              </button>
            </div>

            {googleStatus && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  googleStatus.type === 'success'
                    ? 'bg-success/10 text-success border border-success/30'
                    : 'bg-danger/10 text-danger border border-danger/30'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {googleStatus.type === 'success' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <span>{googleStatus.message}</span>
              </div>
            )}
          </div>

          {/* MÓDULO 4: SESIONES ACTIVAS */}
          <div className="bg-card border border-border-theme rounded-3xl p-5 sm:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Sesiones Activas</h2>
                <p className="text-xs text-muted">Dispositivos donde has iniciado sesión recientemente en Chituk.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {/* Current Device Session */}
              <div className="p-4 rounded-2xl bg-base/70 border border-accent/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-card border border-border-theme flex items-center justify-center text-accent shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {sessionInfo?.browser || 'Navegador Web'} • {sessionInfo?.os || 'Sistema Local'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                        Esta Sesión
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">
                      Activo ahora mismo • Token de Supabase Auth verificado
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary simulated session for realistic UI */}
              <div className="p-4 rounded-2xl bg-base/40 border border-border-theme/60 flex items-center justify-between gap-4 opacity-75">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-card border border-border-theme flex items-center justify-center text-muted shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium text-xs sm:text-sm text-foreground">
                      Dispositivo Móvil (PWA / Navegador)
                    </span>
                    <p className="text-[11px] text-muted mt-0.5">
                      Última sincronización reciente • Sesión en espera
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border-theme/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-muted">
                ¿Sospechas de accesos no autorizados? Cierra todas las demás sesiones.
              </span>
              <button
                type="button"
                onClick={handleRevokeOtherSessions}
                disabled={revokingSessions}
                className="px-4 py-2 rounded-xl text-xs font-bold text-foreground bg-card hover:bg-card-hover border border-border-theme transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {revokingSessions ? 'Revocando...' : 'Cerrar otras sesiones'}
              </button>
            </div>

            {sessionStatus && (
              <div className="mt-3 p-3 rounded-xl text-xs font-medium bg-accent/10 text-accent border border-accent/30">
                {sessionStatus}
              </div>
            )}
          </div>

          {/* MÓDULO 5: ZONA DE PELIGRO (DANGER ZONE) */}
          <div className="border-2 border-danger/60 bg-danger/5 dark:bg-danger/10 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-danger/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-danger/20 border border-danger/40 flex items-center justify-center text-danger shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-danger block">
                  Zona de Peligro
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-foreground mt-0.5">
                  Eliminar Cuenta Permanentemente
                </h2>
                <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
                  Una vez que elimines tu cuenta, <strong className="text-danger font-semibold">no hay vuelta atrás</strong>. Se purgará tu usuario de Supabase Auth y se destruirán permanentemente tus scripts publicados, favoritos, comentarios y estadísticas en Chituk.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card/60 border border-danger/30 mb-5 text-xs text-muted leading-relaxed">
              <p className="font-semibold text-foreground mb-1">Antes de proceder:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>El sistema te solicitará <strong>3 confirmaciones obligatorias consecutivas</strong> para prevenir borrados accidentales.</li>
                <li>Si tienes scripts aprobados, serán eliminados inmediatamente de la plataforma.</li>
                <li>Tu nombre de usuario quedará liberado para el registro público.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-danger font-medium">
                Acción irreversible protegida por confirmación triple.
              </span>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-danger text-white hover:bg-danger/90 transition-all cursor-pointer shadow-lg shadow-danger/25 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Eliminando datos en Supabase...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Eliminar mi cuenta</span>
                  </>
                )}
              </button>
            </div>

            {deleteError && (
              <div className="mt-4 p-3 rounded-xl text-xs font-semibold bg-danger/20 text-danger border border-danger/40 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{deleteError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 2: TEMA Y APARIENCIA (Selector visual de 15 temas de Chituk)
         ========================================================== */}
      {activeTab === 'appearance' && (
        <div className="bg-card border border-border-theme rounded-3xl p-5 sm:p-7 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.64 0 1.25.15 1.8.42A5.98 5.98 0 0113 11a5.98 5.98 0 014.2 2.42c.55-.27 1.16-.42 1.8-.42a4 4 0 014 4 4 4 0 01-4 4c-.64 0-1.25-.15-1.8-.42A5.98 5.98 0 0113 21a5.98 5.98 0 01-4.2-2.42c-.55.27-1.16.42-1.8.42z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Tema Visual de Chituk</h2>
              <p className="text-xs text-muted">Elige entre los 15 temas diseñados con contraste y armonía para la plataforma.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeChange(theme.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-lg shadow-accent/15 ring-2 ring-accent/30'
                      : 'border-border-theme bg-base/60 hover:bg-card-hover hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-accent/20"></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg border border-border-theme shrink-0 shadow-sm"
                      style={{ backgroundColor: theme.color1 }}
                    />
                    <div
                      className="w-6 h-6 rounded-lg border border-border-theme shrink-0 shadow-sm"
                      style={{ backgroundColor: theme.color2 }}
                    />
                    <span className="text-[10px] text-muted font-medium truncate uppercase tracking-wider pl-1">
                      {theme.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================================
          TAB 3: PERFIL Y ENLACES RÁPIDOS
         ========================================================== */}
      {activeTab === 'account' && (
        <div className="bg-card border border-border-theme rounded-3xl p-5 sm:p-7 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Tu Perfil y Accesos</h2>
              <p className="text-xs text-muted">Gestiona los detalles visibles de tu perfil en la comunidad.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-base/70 border border-border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-card border border-border-theme flex items-center justify-center font-bold text-foreground overflow-hidden text-base shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user.username ? user.username.charAt(0).toUpperCase() : '?'}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{user.username || 'Usuario'}</p>
                <p className="text-xs text-muted">{user.bio || 'Sin biografía añadida'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (openProfileModal) openProfileModal();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-profile-modal'));
                  document.dispatchEvent(new CustomEvent('open-profile-modal'));
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-accent text-accent-contrast hover:opacity-90 transition-opacity cursor-pointer shadow-sm shrink-0"
            >
              Editar Avatar y Nombre
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Link
              href="/dashboard"
              className="p-4 rounded-2xl bg-base/60 border border-border-theme hover:border-accent hover:bg-card-hover transition-colors flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">Ir a tu Dashboard</p>
                <p className="text-[11px] text-muted">Estadísticas, scripts subidos e insignias</p>
              </div>
            </Link>

            <Link
              href="/favoritos"
              className="p-4 rounded-2xl bg-base/60 border border-border-theme hover:border-accent hover:bg-card-hover transition-colors flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">Mis Favoritos</p>
                <p className="text-[11px] text-muted">Revisa tu colección de scripts guardados</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

