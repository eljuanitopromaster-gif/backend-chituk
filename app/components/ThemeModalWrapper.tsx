'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import ThemeModal from './ThemeModal';

export default function ThemeModalWrapper() {
  const { isThemeModalOpen, openThemeModal, closeThemeModal } = useAuth();
  const [localOpen, setLocalOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setLocalOpen(true);
      if (openThemeModal) openThemeModal();
    };
    const handleClose = () => {
      setLocalOpen(false);
      if (closeThemeModal) closeThemeModal();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('open-theme-modal', handleOpen);
      document.addEventListener('open-theme-modal', handleOpen);
      window.addEventListener('close-theme-modal', handleClose);
      document.addEventListener('close-theme-modal', handleClose);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-theme-modal', handleOpen);
        document.removeEventListener('open-theme-modal', handleOpen);
        window.removeEventListener('close-theme-modal', handleClose);
        document.removeEventListener('close-theme-modal', handleClose);
      }
    };
  }, [openThemeModal, closeThemeModal]);

  const isOpen = Boolean(isThemeModalOpen || localOpen);

  const handleCloseModal = () => {
    setLocalOpen(false);
    if (closeThemeModal) closeThemeModal();
  };

  return <ThemeModal isOpen={isOpen} onClose={handleCloseModal} />;
}
