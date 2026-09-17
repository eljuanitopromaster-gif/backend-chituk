'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, supabase } from '../components/AuthProvider';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      openAuthModal('login');
    }
  }, [user, authLoading, router, openAuthModal]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session found");

        const res = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch stats");
        
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500 animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full relative h-full flex flex-col">
      {/* Header */}
      <header className="mb-8 shrink-0">
        <p className="text-sm font-bold text-[#FACC15] uppercase tracking-widest mb-1">Creator Dashboard</p>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.username || user.email}</h1>
        <p className="text-neutral-400">Rendimiento global de tus scripts y proyectos.</p>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Area (75%) - Chart */}
        <div className="lg:w-3/4 flex flex-col gap-6">
          <div className="bg-[#131A15] border border-neutral-800 rounded-xl p-6 flex flex-col flex-1 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6">Visualizaciones de Scripts</h2>
            
            {loadingStats ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-neutral-500">Cargando gráfica...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-red-400">{error}</p>
              </div>
            ) : stats?.chartData?.length === 0 ? (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-neutral-800 rounded-xl">
                <p className="text-neutral-500">Aún no tienes scripts publicados.</p>
              </div>
            ) : (
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#737373" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#737373" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{ fill: '#1A221C' }}
                      contentStyle={{ backgroundColor: '#0A0F0D', border: '1px solid #262626', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#FACC15' }}
                    />
                    <Bar 
                      dataKey="views" 
                      name="Vistas"
                      fill="#FACC15" 
                      radius={[4, 4, 0, 0]}
                      opacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Area (25%) - Totals */}
        <div className="lg:w-1/4 flex flex-col gap-4 shrink-0">
          
          <div className="bg-[#131A15] border border-neutral-800 rounded-xl p-6 shadow-xl flex items-center gap-4 group hover:border-[#FACC15]/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#0A0F0D] border border-neutral-800 flex items-center justify-center group-hover:border-[#FACC15] transition-colors">
              <svg className="w-6 h-6 text-[#FACC15]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Vistas</p>
              <h3 className="text-3xl font-bold text-white">
                {loadingStats ? '-' : (stats?.totals?.views || 0).toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-[#131A15] border border-neutral-800 rounded-xl p-6 shadow-xl flex items-center gap-4 group hover:border-[#FACC15]/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#0A0F0D] border border-neutral-800 flex items-center justify-center group-hover:border-[#FACC15] transition-colors">
              <svg className="w-6 h-6 text-[#FACC15]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Copias</p>
              <h3 className="text-3xl font-bold text-white">
                {loadingStats ? '-' : (stats?.totals?.copies || 0).toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-[#131A15] border border-neutral-800 rounded-xl p-6 shadow-xl flex items-center gap-4 group hover:border-[#FACC15]/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#0A0F0D] border border-neutral-800 flex items-center justify-center group-hover:border-[#FACC15] transition-colors">
              <svg className="w-6 h-6 text-[#FACC15]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-400">Total Likes</p>
              <h3 className="text-3xl font-bold text-white">
                {loadingStats ? '-' : (stats?.totals?.likes || 0).toLocaleString()}
              </h3>
            </div>
          </div>

        </div>
      </div>

      {/* Badges Section */}
      <div className="mt-8 bg-[#131A15] border border-neutral-800 rounded-xl p-6 shadow-xl shrink-0">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#FACC15]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Tus Logros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Badge: 100k */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${stats?.badges?.includes('100k_views') ? 'bg-[#1A221C] border-[#FACC15]/50' : 'bg-[#0A0F0D] border-neutral-800 opacity-50 grayscale'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${stats?.badges?.includes('100k_views') ? 'bg-[#FACC15]/10 border-[#FACC15] text-[#FACC15]' : 'bg-neutral-900 border-neutral-700 text-neutral-500'}`}>
              <span className="font-bold">100K</span>
            </div>
            <div>
              <p className={`font-bold ${stats?.badges?.includes('100k_views') ? 'text-white' : 'text-neutral-500'}`}>Cien Mil Club</p>
              <p className="text-xs text-neutral-500">Alcanza 100,000 vistas totales</p>
            </div>
          </div>

          {/* Badge: 1M */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${stats?.badges?.includes('1m_views') ? 'bg-[#1A221C] border-[#FACC15]/50' : 'bg-[#0A0F0D] border-neutral-800 opacity-50 grayscale'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${stats?.badges?.includes('1m_views') ? 'bg-[#FACC15]/10 border-[#FACC15] text-[#FACC15]' : 'bg-neutral-900 border-neutral-700 text-neutral-500'}`}>
              <span className="font-bold">1M</span>
            </div>
            <div>
              <p className={`font-bold ${stats?.badges?.includes('1m_views') ? 'text-white' : 'text-neutral-500'}`}>Millonario de Vistas</p>
              <p className="text-xs text-neutral-500">Alcanza 1,000,000 vistas totales</p>
            </div>
          </div>

          {/* Badge: 10M */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${stats?.badges?.includes('10m_views') ? 'bg-[#1A221C] border-[#FACC15]/50' : 'bg-[#0A0F0D] border-neutral-800 opacity-50 grayscale'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${stats?.badges?.includes('10m_views') ? 'bg-[#FACC15]/10 border-[#FACC15] text-[#FACC15]' : 'bg-neutral-900 border-neutral-700 text-neutral-500'}`}>
              <span className="font-bold">10M</span>
            </div>
            <div>
              <p className={`font-bold ${stats?.badges?.includes('10m_views') ? 'text-white' : 'text-neutral-500'}`}>Estrella de Chituk</p>
              <p className="text-xs text-neutral-500">Alcanza 10,000,000 vistas totales</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
