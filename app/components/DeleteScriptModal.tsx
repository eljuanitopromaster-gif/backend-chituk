'use client';

import React, { useEffect } from 'react';

interface DeleteScriptModalProps {
  isOpen: boolean;
  scriptTitle?: string;
  isDeleting: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteScriptModal({
  isOpen,
  scriptTitle,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: DeleteScriptModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-script-modal-title"
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
    >
      <div
        className="w-full max-w-md bg-card border border-border-theme rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-danger/15 border border-danger/30 text-danger flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="delete-script-modal-title"
              className="text-lg font-bold text-foreground"
            >
              Eliminar Script
            </h3>
            {scriptTitle && (
              <p className="text-xs font-semibold text-accent truncate mt-0.5">
                {scriptTitle}
              </p>
            )}
            <p className="text-sm text-muted leading-relaxed mt-2">
              ¿Estás seguro de que deseas eliminar este script? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2 border-t border-border-theme">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-base hover:bg-card-hover border border-border-theme text-foreground text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-danger hover:opacity-90 text-white text-sm font-bold transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-md"
          >
            {isDeleting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isDeleting ? 'Eliminando...' : 'Eliminar Script'}
          </button>
        </div>
      </div>
    </div>
  );
}

