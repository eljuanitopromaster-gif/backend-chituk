'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, supabase } from '../components/AuthProvider';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Achievement {
  id: string;
  title: string;
  desc: string;
  category: 'Creador' | 'Vistas' | 'Comunidad' | 'Popularidad' | 'Especial';
  icon: string;
  requirement: string;
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_script',
    title: 'Primer Paso',
    desc: 'Publica tu primer script o herramienta en la plataforma',
    category: 'Creador',
    icon: '🚀',
    requirement: '1 script publicado'
  },
  {
    id: '5_scripts',
    title: 'Creador Constante',
    desc: 'Publica 5 o más scripts para la comunidad',
    category: 'Creador',
    icon: '⚡',
    requirement: '5 scripts publicados'
  },
  {
    id: '1k_views',
    title: 'Primeros Mil',
    desc: 'Alcanza 1,000 visualizaciones acumuladas en tus scripts',
    category: 'Vistas',
    icon: '👁️',
    requirement: '1,000 vistas'
  },
  {
    id: '10k_views',
    title: 'Diez Mil Club',
    desc: 'Alcanza 10,000 visualizaciones acumuladas',
    category: 'Vistas',
    icon: '🎯',
    requirement: '10,000 vistas'
  },
  {
    id: '100k_views',
    title: 'Cien Mil Club',
    desc: 'Alcanza 100,000 visualizaciones acumuladas',
    category: 'Vistas',
    icon: '💎',
    requirement: '100,000 vistas'
  },
  {
    id: '1m_views',
    title: 'Millonario de Vistas',
    desc: 'Alcanza 1,000,000 de vistas en tus proyectos',
    category: 'Vistas',
    icon: '👑',
    requirement: '1,000,000 vistas'
  },
  {
    id: '10m_views',
    title: 'Estrella de Chituk',
    desc: 'Alcanza 10,000,000 de vistas totales',
    category: 'Vistas',
    icon: '🌟',
    requirement: '10,000,000 vistas'
  },
  {
    id: 'first_like',
    title: 'Primer Corazón',
    desc: 'Recibe tu primer me gusta en uno de tus scripts',
    category: 'Comunidad',
    icon: '❤️',
    requirement: '1 like recibido'
  },
  {
    id: '50_likes',
    title: 'Aclamado',
    desc: 'Acumula 50 o más likes de la comunidad',
    category: 'Comunidad',
    icon: '🔥',
    requirement: '50 likes recibidos'
  },
  {
    id: '100_copies',
    title: 'Viral en Ejecutores',
    desc: 'Tus códigos han sido copiados más de 100 veces',
    category: 'Popularidad',
    icon: '📋',
    requirement: '100 copias'
  },
  {
    id: 'verified_badge',
    title: 'Cuenta Verificada',
    desc: 'Obtén la insignia de verificación oficial de Chituk',
    category: 'Especial',
    icon: '🛡️',
    requirement: 'Verificación oficial'
  },
  {
    id: 'customizer',
    title: 'Estilista',
    desc: 'Personaliza tu avatar, biografía o tema visual',
    category: 'Especial',
    icon: '🎨',
    requirement: 'Perfil personalizado'
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

  useEffect(() => {
    if (!authLoading && !user) {
      // Usa replace en lugar de push
      router.replace('/');
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

  const unlockedSet = useMemo(() => {
    return new Set<string>(stats?.badges || []);
  }, [stats?.badges]);

  const unlockedCount = useMemo(() => {
    return ALL_ACHIEVEMENTS.filter(a => unlockedSet.has(a.id)).length;
  }, [unlockedSet]);

  const filteredAchievements = useMemo(() => {
    if (categoryFilter === 'Todos') return ALL_ACHIEVEMENTS;
    if (categoryFilter === 'Desbloqueados') return ALL_ACHIEVEMENTS.filter(a => unlockedSet.has(a.id));
    if (categoryFilter === 'Pendientes') return ALL_ACHIEVEMENTS.filter(a => !unlockedSet.has(a.id));
    return ALL_ACHIEVEMENTS.filter(a => a.category === categoryFilter);
  }, [categoryFilter, unlockedSet]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted animate-pulse font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full relative flex flex-col gap-8">
      {/* Header */}
      <header className="shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Creator Dashboard</span>
          <span className="text-xs text-muted">• Métricas en Vivo</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Bienvenido, {user.username || user.email}</h1>
        <p className="text-muted text-sm">Rendimiento global de tus scripts y estado de logros comunitarios.</p>
      </header>

      {/* Main Content: Chart + Totals */}
      <div className="flex flex-col lg:flex-row gap-6 shrink-0">

        {/* Left Area (75%) - Chart */}
        <div className="lg:w-3/4 flex flex-col gap-6">
          <div className="bg-card border border-border-theme rounded-2xl p-6 flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Visualizaciones de Scripts</h2>
                <p className="text-xs text-muted mt-0.5">Vistas por cada proyecto que has publicado</p>
              </div>
              <span className="px-2.5 py-1 bg-base border border-border-theme rounded-lg text-xs font-bold text-accent">
                {stats?.chartData?.length || 0} scripts
              </span>
            </div>

            {loadingStats ? (
              <div className="h-64 flex items-center justify-center">
                <div className="inline-block animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-2"></div>
              </div>
            ) : error ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            ) : !stats?.chartData || stats.chartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border-theme/60 rounded-xl p-6 text-center">
                <svg className="w-12 h-12 text-muted/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-foreground font-semibold">Aún no tienes scripts publicados</p>
                <p className="text-xs text-muted mt-1 max-w-sm">
                  Publica tu primer script para comenzar a registrar estadísticas de vistas, likes y copias.
                </p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-theme)" vertical={false} opacity={0.6} />
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--bg-card-hover)', opacity: 0.5 }}
                      contentStyle={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-theme)', borderRadius: '12px', color: 'var(--text-color)' }}
                      itemStyle={{ color: 'var(--color-accent)' }}
                    />
                    <Bar
                      dataKey="views"
                      name="Vistas"
                      fill="var(--color-accent)"
                      radius={[6, 6, 0, 0]}
                      opacity={0.9}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Area (25%) - Totals */}
        <div className="lg:w-1/4 flex flex-col gap-4 shrink-0">

          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-xl flex items-center gap-4 group hover:border-accent/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-base border border-border-theme flex items-center justify-center group-hover:border-accent group-hover:scale-105 transition-all shrink-0">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Vistas</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {loadingStats ? '-' : (stats?.totals?.views || 0).toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-xl flex items-center gap-4 group hover:border-accent/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-base border border-border-theme flex items-center justify-center group-hover:border-accent group-hover:scale-105 transition-all shrink-0">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Copias</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {loadingStats ? '-' : (stats?.totals?.copies || 0).toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-xl flex items-center gap-4 group hover:border-accent/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-base border border-border-theme flex items-center justify-center group-hover:border-accent group-hover:scale-105 transition-all shrink-0">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Likes</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {loadingStats ? '-' : (stats?.totals?.likes || 0).toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="bg-card border border-border-theme rounded-2xl p-5 shadow-xl flex items-center gap-4 group hover:border-accent/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-base border border-border-theme flex items-center justify-center group-hover:border-accent group-hover:scale-105 transition-all shrink-0">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Scripts Creados</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">
                {loadingStats ? '-' : (stats?.totals?.projectsCount || 0).toLocaleString()}
              </h3>
            </div>
          </div>

        </div>
      </div>

      {/* Badges & Achievements Section */}
      <div className="bg-card border border-border-theme rounded-2xl p-6 md:p-8 shadow-xl flex flex-col gap-6">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h2 className="text-xl font-bold text-foreground">Tus Logros e Insignias</h2>
            </div>
            <p className="text-sm text-muted">
              Desbloquea insignias exclusivas alcanzando hitos con tus publicaciones y en la comunidad.
            </p>
          </div>

          {/* Progress Counter */}
          <div className="flex flex-col items-start md:items-end">
            <span className="text-sm font-bold text-accent">
              {unlockedCount} de {ALL_ACHIEVEMENTS.length} Desbloqueados
            </span>
            <div className="w-48 bg-base border border-border-theme h-2.5 rounded-full overflow-hidden mt-1.5 shadow-inner">
              <div
                className="bg-accent h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(5, (unlockedCount / ALL_ACHIEVEMENTS.length) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border-theme/60">
          {['Todos', 'Desbloqueados', 'Pendientes', 'Creador', 'Vistas', 'Comunidad', 'Popularidad', 'Especial'].map(tab => (
            <button
              key={tab}
              onClick={() => setCategoryFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${categoryFilter === tab
                  ? 'bg-accent text-accent-contrast shadow-sm'
                  : 'bg-base text-muted hover:text-foreground hover:bg-card-hover border border-border-theme/70'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAchievements.map(badge => {
            const isUnlocked = unlockedSet.has(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 relative overflow-hidden group ${isUnlocked
                    ? 'bg-base/90 border-accent/50 shadow-md ring-1 ring-accent/20'
                    : 'bg-base/40 border-border-theme/50 opacity-60 hover:opacity-80'
                  }`}
              >
                {/* Top info */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 ${isUnlocked
                      ? 'bg-accent/15 border border-accent/40 text-accent shadow-sm'
                      : 'bg-card border border-border-theme text-muted grayscale'
                    }`}>
                    {badge.icon}
                  </div>

                  {isUnlocked ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      ✓ Desbloqueado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-base border border-border-theme text-muted">
                      🔒 Bloqueado
                    </span>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className={`font-bold text-sm ${isUnlocked ? 'text-foreground' : 'text-muted'}`}>
                      {badge.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    {badge.desc}
                  </p>
                </div>

                {/* Requirement Footnote */}
                <div className="pt-2.5 border-t border-border-theme/40 flex items-center justify-between text-[11px]">
                  <span className="text-muted/80 font-mono">Meta:</span>
                  <span className={`font-semibold ${isUnlocked ? 'text-accent' : 'text-muted'}`}>
                    {badge.requirement}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
