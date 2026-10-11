'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth, supabase } from './AuthProvider';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateUser, refreshUser } = useAuth();
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcular restricción de 15 días para el Username
  const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
  const lastUsernameChange = user?.username_changed_at ? new Date(user.username_changed_at).getTime() : 0;
  const timeSinceChange = Date.now() - lastUsernameChange;
  const isUsernameCooldown = lastUsernameChange > 0 && timeSinceChange < fifteenDaysMs;
  
  const remainingDays = isUsernameCooldown
    ? Math.ceil((fifteenDaysMs - timeSinceChange) / (24 * 60 * 60 * 1000))
    : 0;

  const nextAvailableDate = isUsernameCooldown
    ? new Date(lastUsernameChange + fifteenDaysMs).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null;

  useEffect(() => {
    if (user && isOpen) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || null);
      setAvatarPreview(user.avatar || null);
      setError(null);
      setSuccess(null);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado pesada. El tamaño máximo es 5MB.');
      return;
    }

    setError(null);

    // Redimensionar y comprimir la imagen en un canvas a máx 350x350
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 350;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatar(dataUrl);
          setAvatarPreview(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa. Inicia sesión nuevamente.');
      }

      const payload: { username?: string; bio?: string; avatar?: string | null } = {
        bio: bio.trim(),
        avatar: avatar
      };

      // Si el username cambió y no está en cooldown
      if (username.trim() !== user.username) {
        if (isUsernameCooldown) {
          throw new Error(`Solo puedes cambiar tu nombre de usuario cada 15 días. Próximo cambio disponible en ${remainingDays} días.`);
        }
        payload.username = username.trim();
      }

      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar el perfil.');
      }

      if (data.user) {
        updateUser(data.user);
      } else {
        await refreshUser();
      }

      setSuccess('¡Perfil actualizado con éxito!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-base border border-border-theme rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-border-theme relative bg-card">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <p className="text-[10px] font-bold tracking-widest text-accent uppercase mb-1">Ajustes</p>
          <h2 className="text-2xl font-bold text-white tracking-tight">Editar Perfil</h2>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex flex-col gap-6">
          
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-card border border-border-theme">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-border-theme overflow-hidden bg-neutral-900 flex items-center justify-center shadow-inner group-hover:border-accent transition-colors">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white uppercase">
                    {username ? username.charAt(0) : '?'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                title="Cambiar foto"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left flex-1">
              <span className="text-sm font-semibold text-white">Foto de Perfil</span>
              <p className="text-xs text-neutral-400">
                Sube una imagen para tu avatar (JPG, PNG, máx. 5MB).
              </p>
              
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-card-hover hover:bg-neutral-800 text-xs font-semibold text-white rounded-lg border border-border-theme transition-colors cursor-pointer"
                >
                  Subir foto
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Username Section */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="profile-username" className="text-sm font-semibold text-white">
                Nombre de usuario
              </label>
              {isUsernameCooldown && (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Bloqueado {remainingDays}d
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isUsernameCooldown}
                maxLength={30}
                className={`w-full bg-card border rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                  isUsernameCooldown
                    ? 'border-neutral-800/80 bg-neutral-900/50 text-neutral-400 cursor-not-allowed'
                    : 'border-border-theme focus:border-accent focus:ring-1 focus:ring-accent'
                }`}
                placeholder="Tu nombre de usuario"
                required
              />
            </div>

            {isUsernameCooldown ? (
              <p className="text-xs text-amber-400/90 flex items-center gap-1.5 mt-0.5">
                <span>⏱️</span>
                <span>
                  Solo puedes cambiar tu nombre de usuario cada 15 días. Podrás volver a cambiarlo el <strong>{nextAvailableDate}</strong>.
                </span>
              </p>
            ) : (
              <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <span>ℹ️</span>
                <span>
                  Se puede cambiar y podrás volver a cambiar dentro de los 15 días posteriores.
                </span>
              </p>
            )}
          </div>

          {/* Bio Section */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="profile-bio" className="text-sm font-semibold text-white">
                Descripción
              </label>
              <span className="text-[11px] text-neutral-500">
                {bio.length}/300
              </span>
            </div>

            <textarea
              id="profile-bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full bg-card border border-border-theme rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
              placeholder="Cuéntale a la comunidad sobre ti, tus creaciones o tus redes..."
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-card transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-accent hover:bg-yellow-400 text-black text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-accent/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
