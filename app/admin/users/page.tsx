'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth, supabase } from '../../components/AuthProvider';

interface UserData {
  id: string;
  email: string;
  username: string;
  role: string;
  is_verified: boolean;
  theme: string;
  avatar?: string;
  created_at: string;
  banned?: boolean;
  banReason?: string | null;
}

export default function UsersAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const canManage = user && ['owner', 'admin', 'creator'].includes(user.role);

  const fetchUsers = async () => {
    if (authLoading || !user || !canManage) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'X-User-Id': user.id
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching users:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canManage) {
      fetchUsers();
    }
  }, [user]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-User-Id': user?.id || ''
        },
        body: JSON.stringify({ targetUserId: userId, action: 'role', value: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
    } catch (err) {
      alert("Error al actualizar rol del usuario");
      fetchUsers();
    }
  };

  const handleToggleVerified = async (userId: string, currentStatus: boolean) => {
    setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-User-Id': user?.id || ''
        },
        body: JSON.stringify({ targetUserId: userId, action: 'verify', value: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update verification');
    } catch (err) {
      alert("Error al actualizar verificación");
      fetchUsers();
    }
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean, targetUsername: string, targetRole: string) => {
    if (userId === user?.id) {
      alert("No puedes banear tu propia cuenta.");
      return;
    }

    if (targetRole === 'owner' && user?.role !== 'owner') {
      alert("Solo un Propietario (Owner) puede sancionar a otro Propietario.");
      return;
    }

    let reason = '';
    if (!currentBanned) {
      const promptReason = prompt(
        `¿Estás seguro de que deseas banear a @${targetUsername}?\n\nIngresa el motivo del ban (opcional):`,
        'Infracción de las normas de la comunidad'
      );
      if (promptReason === null) return; // Cancelado
      reason = promptReason.trim() || 'Infracción de las normas de la comunidad';
    } else {
      if (!confirm(`¿Deseas desbanear y restaurar el acceso para @${targetUsername}?`)) {
        return;
      }
    }

    const newBannedStatus = !currentBanned;
    setUsers(users.map(u => u.id === userId ? { ...u, banned: newBannedStatus, banReason: newBannedStatus ? reason : null } : u));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-User-Id': user?.id || ''
        },
        body: JSON.stringify({
          targetUserId: userId,
          action: 'ban',
          isBanned: newBannedStatus,
          reason: reason
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update ban status');
    } catch (err: any) {
      alert(err.message || "Error al actualizar estado de ban");
      fetchUsers();
    }
  };

  const handleEditEmail = async (userId: string, currentEmail: string, targetUsername: string) => {
    const promptEmail = prompt(
      `Editar o asignar correo para @${targetUsername}:`,
      currentEmail || ''
    );
    if (promptEmail === null) return;
    const cleanEmail = promptEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setUsers(users.map(u => u.id === userId ? { ...u, email: cleanEmail } : u));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-User-Id': user?.id || ''
        },
        body: JSON.stringify({ targetUserId: userId, action: 'email', email: cleanEmail })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update email');
      }
    } catch (err: any) {
      alert(err.message || "Error al actualizar correo");
      fetchUsers();
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(search.toLowerCase());
      if (roleFilter === 'banned') {
        return matchSearch && !!u.banned;
      }
      const matchRole = roleFilter === 'all' || (u.role || 'user') === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">Dueño</span>;
      case 'admin':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">Admin</span>;
      case 'mod':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Mod</span>;
      case 'creator':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">Creador</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-neutral-500/15 text-muted border border-border-theme">Usuario</span>;
    }
  };

  if (authLoading) {
    return (
      <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p>Verificando credenciales...</p>
      </div>
    );
  }

  if (!user || !canManage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border-theme rounded-2xl text-center max-w-lg mx-auto mt-8">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-10V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v3m12 4v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h12a2 2 0 012 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Acceso Restringido</h3>
        <p className="text-muted text-sm leading-relaxed">
          Esta sección está reservada para Propietarios y Administradores de Chituk.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border border-border-theme rounded-2xl">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-accent uppercase mb-1 block">Gestión de Comunidad</span>
          <h1 className="text-2xl font-bold text-foreground">Usuarios, Roles y Sanciones</h1>
          <p className="text-sm text-muted mt-1">
            Asigna privilegios de Dueño, Administrador, Moderador, verifica perfiles o gestiona suspensiones.
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative min-w-[200px]">
            <input 
              type="text"
              placeholder="Buscar por usuario o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-base border border-border-theme text-foreground rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-accent placeholder:text-muted"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-base border border-border-theme text-foreground rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-accent font-medium cursor-pointer"
          >
            <option value="all">Todos los usuarios</option>
            <option value="banned">🚫 Usuarios Baneados</option>
            <option value="owner">Dueños (Owner)</option>
            <option value="admin">Administradores</option>
            <option value="mod">Moderadores</option>
            <option value="creator">Creadores</option>
            <option value="user">Usuarios normales</option>
          </select>
          <button 
            onClick={fetchUsers} 
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-base hover:bg-card-hover border border-border-theme text-muted hover:text-foreground text-sm font-medium transition-colors cursor-pointer"
            title="Recargar lista"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border-theme rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-base/70 border-b border-border-theme">
                <th className="py-4 px-6 text-xs font-bold text-muted uppercase tracking-widest">Usuario</th>
                <th className="py-4 px-6 text-xs font-bold text-muted uppercase tracking-widest">Email</th>
                <th className="py-4 px-6 text-xs font-bold text-muted uppercase tracking-widest">Rol Actual</th>
                <th className="py-4 px-6 text-xs font-bold text-muted uppercase tracking-widest">Asignar Rol</th>
                <th className="py-4 px-6 text-xs font-bold text-muted uppercase tracking-widest text-center">Verificación</th>
                <th className="py-4 px-6 text-xs font-bold text-muted uppercase tracking-widest text-right">Sanción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted">
                    <div className="inline-block animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-3"></div>
                    <p className="font-medium">Cargando usuarios del sistema...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted font-medium">
                    {search || roleFilter !== 'all' ? 'No se encontraron usuarios con esos filtros.' : 'No hay usuarios registrados.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr 
                    key={u.id} 
                    className={`border-b border-border-theme/40 transition-colors ${
                      u.banned ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-card-hover/40'
                    }`}
                  >
                    
                    {/* User */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-base flex items-center justify-center text-xs font-bold overflow-hidden border shrink-0 ${
                          u.banned ? 'border-rose-500 text-rose-400' : 'border-border-theme text-foreground'
                        }`}>
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.username || 'Avatar'} className="w-full h-full object-cover" />
                          ) : (
                            <span>{u.username ? u.username.charAt(0).toUpperCase() : '?'}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-semibold text-sm ${u.banned ? 'line-through text-rose-300' : 'text-foreground'}`}>
                              {u.username || 'Sin Nombre'}
                            </span>
                            {u.is_verified && (
                              <span title="Verificado" className="inline-flex items-center">
                                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                            {u.banned && (
                              <span 
                                title={`Motivo: ${u.banReason || 'Infracción de normas'}`}
                                className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40"
                              >
                                🚫 BANEADO
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted font-mono">{u.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center gap-2 group/email">
                        {u.email ? (
                          <span className="text-foreground/90 font-mono text-xs select-all">{u.email}</span>
                        ) : (
                          <span className="text-muted/60 text-xs italic">Sin email (Legacy)</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEditEmail(u.id, u.email || '', u.username || 'usuario')}
                          className="opacity-0 group-hover/email:opacity-100 p-1 hover:bg-card-hover rounded text-muted hover:text-accent transition-all cursor-pointer"
                          title="Editar / Asignar correo"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </td>

                    {/* Current Role Badge */}
                    <td className="py-4 px-6">
                      {getRoleBadge(u.role || 'user')}
                    </td>

                    {/* Assign Role Dropdown */}
                    <td className="py-4 px-6">
                      <select
                        value={u.role || 'user'}
                        disabled={u.banned}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`bg-base border border-border-theme text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent font-medium ${
                          u.banned ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="owner">👑 Dueño (Owner)</option>
                        <option value="admin">🛡️ Administrador</option>
                        <option value="mod">🔨 Moderador</option>
                        <option value="creator">✨ Creador</option>
                        <option value="user">👤 Usuario Normal</option>
                      </select>
                    </td>

                    {/* Verified Toggle */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleVerified(u.id, u.is_verified || false)}
                        disabled={u.banned}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          u.banned
                            ? 'opacity-40 cursor-not-allowed bg-base border border-border-theme text-muted'
                            : u.is_verified 
                              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/40 shadow-sm cursor-pointer' 
                              : 'bg-base text-muted hover:text-foreground hover:bg-card-hover border border-border-theme cursor-pointer'
                        }`}
                      >
                        {u.is_verified ? '✓ Verificado' : '+ Verificar'}
                      </button>
                    </td>

                    {/* Ban / Unban Button */}
                    <td className="py-4 px-6 text-right">
                      {u.id === user?.id ? (
                        <span className="text-xs text-muted italic px-3 py-1.5">Tu cuenta</span>
                      ) : (
                        <button
                          onClick={() => handleToggleBan(u.id, !!u.banned, u.username || 'usuario', u.role || 'user')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                            u.banned
                              ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
                          }`}
                          title={u.banned ? 'Hacer clic para restaurar acceso' : 'Hacer clic para suspender al usuario'}
                        >
                          {u.banned ? '✓ Desbanear' : '🚫 Banear'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
