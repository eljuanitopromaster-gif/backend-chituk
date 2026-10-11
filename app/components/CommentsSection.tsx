'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, supabase } from './AuthProvider';
import CaptchaWidget, { CaptchaValue } from './CaptchaWidget';

export interface CommentItem {
  id: string;
  projectId: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  authorRole?: string;
  content: string;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
}

interface CommentsSectionProps {
  scriptId: string;
  scriptAuthorId?: string;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Hace un momento';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 30) return `Hace ${diffInDays} días`;
  return date.toLocaleDateString();
}

export default function CommentsSection({ scriptId, scriptAuthorId }: CommentsSectionProps) {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [captchaValue, setCaptchaValue] = useState<CaptchaValue>({ token: '', answer: '', honeypot: '', isReady: false });
  const [captchaKey, setCaptchaKey] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'likes' | 'newest'>('likes');
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      let headers: Record<string, string> = {};
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/scripts/${scriptId}/comments?sort=${sortBy}`, {
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scriptId) {
      fetchComments();
    }
  }, [scriptId, sortBy, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    const trimmed = newComment.trim();
    if (!trimmed) return;

    if (!captchaValue.isReady || !captchaValue.answer) {
      setErrorMessage('Por favor completa la verificación de seguridad anti-bot (5 caracteres).');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        openAuthModal('login');
        return;
      }

      const res = await fetch(`/api/scripts/${scriptId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: trimmed,
          captchaToken: captchaValue.token,
          captchaAnswer: captchaValue.answer,
          honeypot: captchaValue.honeypot
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al publicar comentario');
      }

      setNewComment('');
      setCaptchaKey(prev => prev + 1);
      setCaptchaValue({ token: '', answer: '', honeypot: '', isReady: false });
      // Add comment to state
      setComments(prev => [data.comment, ...prev]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al enviar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    // Optimistic UI update
    const previousComments = [...comments];
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const wasLiked = !!c.isLiked;
          return {
            ...c,
            isLiked: !wasLiked,
            likesCount: Math.max(0, c.likesCount + (wasLiked ? -1 : 1))
          };
        }
        return c;
      })
    );

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/scripts/${scriptId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        // Revert on error
        setComments(previousComments);
      } else {
        const data = await res.json();
        setComments(prev =>
          prev.map(c =>
            c.id === commentId
              ? { ...c, likesCount: data.likesCount, isLiked: data.action === 'like' }
              : c
          )
        );
      }
    } catch (err) {
      setComments(previousComments);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

    setDeletingId(commentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/scripts/${scriptId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-14 pt-10 border-t border-neutral-800/80 w-full" id="seccion-comentarios">
      {/* Header Row: Title, Counter & Sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Opiniones y Comentarios
              </h3>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                {comments.length}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Comparte tu experiencia, reporta bugs o apoya opiniones útiles de otros usuarios.
            </p>
          </div>
        </div>

        {/* Sorting controls */}
        {comments.length > 1 && (
          <div className="flex items-center bg-[#12141A] p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setSortBy('likes')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                sortBy === 'likes'
                  ? 'bg-card text-accent shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Más útiles
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                sortBy === 'newest'
                  ? 'bg-card text-accent shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Más recientes
            </button>
          </div>
        )}
      </div>

      {/* Input / Post Form */}
      <div className="bg-card border border-neutral-800 rounded-2xl p-5 mb-10 shadow-lg">
        {user ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-neutral-700 overflow-hidden shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(user.username || user.email || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-sm font-semibold text-neutral-200">
                Opinar como <span className="text-white font-bold">{user.username || user.email}</span>
              </span>
            </div>

            <div className="relative">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="¿Te sirvió el script? Deja tu opinión, consejos o dudas para la comunidad..."
                rows={3}
                maxLength={1000}
                className="w-full bg-[#0E1015] border border-neutral-800 rounded-xl p-3.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-y min-h-[90px]"
              />
              <div className="text-[11px] text-neutral-500 text-right mt-1">
                {newComment.length} / 1000
              </div>
            </div>

            {/* Anti-Bot Verification */}
            <CaptchaWidget key={captchaKey} onChange={setCaptchaValue} compact />

            {errorMessage && (
              <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
            )}

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-neutral-500 flex items-center gap-1.5 hidden sm:inline-flex">
                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mantén una opinión respetuosa y útil para la manada.
              </span>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-5 py-2.5 bg-accent hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ml-auto active:scale-95"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publicando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Publicar Opinión
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-400 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">¿Quieres dar tu opinión sobre este script?</h4>
                <p className="text-xs text-neutral-400">Inicia sesión o regístrate para comentar y dar like a las opiniones de otros.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-5 py-2.5 bg-accent text-black font-bold text-sm rounded-xl hover:bg-yellow-500 transition-colors cursor-pointer shrink-0 shadow-md"
            >
              Iniciar Sesión
            </button>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="py-12 text-center text-neutral-500 text-sm animate-pulse">
            Cargando opiniones de la comunidad...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 px-4 text-center bg-card/50 border border-neutral-800/60 rounded-2xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 mb-3">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-white mb-1">Aún no hay comentarios</h4>
            <p className="text-xs text-neutral-400 max-w-sm mb-4">
              ¡Sé el primero en compartir si te funcionó este script o qué tal te pareció!
            </p>
            {!user && (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-xs text-accent hover:underline font-bold"
              >
                Acceder para comentar &rarr;
              </button>
            )}
          </div>
        ) : (
          comments.map(comment => {
            const isAuthor = scriptAuthorId && (comment.userId === scriptAuthorId || comment.authorName === scriptAuthorId);
            const isSelf = user && user.id === comment.userId;
            const isStaff = user && ['admin', 'owner', 'creator', 'mod'].includes(user.role);

            return (
              <article
                key={comment.id}
                className="bg-card border border-neutral-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 hover:border-neutral-700/60 transition-colors shadow-sm"
              >
                {/* Comment Header */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* User Avatar */}
                    <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {comment.authorAvatar ? (
                        <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{comment.authorName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white hover:text-accent transition-colors">
                          {comment.authorName}
                        </span>

                        {/* Author / Staff Badges */}
                        {isAuthor && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/40 uppercase tracking-wider">
                            Autor
                          </span>
                        )}
                        {comment.authorRole && ['admin', 'owner', 'creator', 'mod'].includes(comment.authorRole) && !isAuthor && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#00ADEF]/15 text-[#00ADEF] border border-[#00ADEF]/40 uppercase tracking-wider">
                            Staff
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button for Author or Staff */}
                  {(isSelf || isStaff) && (
                    <button
                      type="button"
                      disabled={deletingId === comment.id}
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-neutral-500 hover:text-red-400 p-1 rounded-md transition-colors text-xs"
                      title="Eliminar comentario"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Comment Content / Opinion */}
                <div className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap pl-11">
                  {comment.content}
                </div>

                {/* Comment Footer: Helpful / Likes Action */}
                <div className="flex items-center justify-between pl-11 pt-2 border-t border-neutral-800/40">
                  <button
                    type="button"
                    onClick={() => handleLikeComment(comment.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      comment.isLiked
                        ? 'bg-accent/15 text-accent border border-accent/40 shadow-sm'
                        : 'text-neutral-400 hover:text-white bg-card-hover border border-neutral-800 hover:border-neutral-700'
                    }`}
                    title={comment.isLiked ? 'Quitar like' : 'Me parece útil esta opinión'}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={comment.isLiked ? 'currentColor' : 'none'}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    <span>
                      {comment.isLiked ? 'Útil' : '¿Te pareció útil?'}
                    </span>
                    {comment.likesCount > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 bg-black/40 rounded-full font-bold">
                        {comment.likesCount}
                      </span>
                    )}
                  </button>

                  {comment.likesCount > 0 && (
                    <span className="text-[11px] text-neutral-500">
                      {comment.likesCount === 1 ? '1 persona de acuerdo' : `${comment.likesCount} personas de acuerdo`}
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
