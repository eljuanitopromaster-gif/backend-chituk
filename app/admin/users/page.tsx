'use client';

import React, { useEffect, useState } from 'react';
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
}

export default function UsersAdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!user || user.role !== 'owner') return;
    
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
      
      setUsers(data);
    } catch (err: any) {
      console.error("Error fetching users:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
          'X-User-Id': user.id
        },
        body: JSON.stringify({ targetUserId: userId, action: 'role', value: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
    } catch (err) {
      alert("Error al actualizar rol");
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
          'X-User-Id': user.id
        },
        body: JSON.stringify({ targetUserId: userId, action: 'verify', value: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update verification');
    } catch (err) {
      alert("Error al actualizar verificación");
      fetchUsers();
    }
  };

  if (!user || user.role !== 'owner') {
    return (
      <div className="flex justify-center items-center h-64 bg-card border border-border-theme rounded-2xl">
        <p className="text-neutral-400 font-medium">No tienes permisos de Propietario para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border-theme rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20 border-b border-border-theme">
              <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Usuario</th>
              <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Email</th>
              <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Rol</th>
              <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">Verificación</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-neutral-500">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mb-2"></div>
                  <p>Cargando usuarios...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-neutral-500 font-medium">No hay usuarios registrados.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-b border-border-theme/50 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden border border-neutral-700 shrink-0">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username || 'Avatar'} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.username ? u.username.charAt(0).toUpperCase() : '?'}</span>
                        )}
                      </div>
                      <span className="font-medium text-white">{u.username || 'Sin Nombre'}</span>
                      {u.is_verified && (
                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-neutral-400">{u.email}</td>
                  <td className="py-4 px-6">
                    <select
                      value={u.role || 'user'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-base border border-border-theme text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent"
                    >
                      <option value="owner">Dueño (Owner)</option>
                      <option value="mod">Moderador</option>
                      <option value="creator">Creador</option>
                      <option value="user">Usuario</option>
                    </select>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleToggleVerified(u.id, u.is_verified || false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                        u.is_verified 
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                      }`}
                    >
                      {u.is_verified ? 'Verificado' : 'Verificar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
