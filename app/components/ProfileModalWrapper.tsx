'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import ProfileModal from './ProfileModal';

export default function ProfileModalWrapper() {
  const { isProfileModalOpen, openProfileModal, closeProfileModal } = useAuth();
  const [localOpen, setLocalOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setLocalOpen(true);
      if (openProfileModal) openProfileModal();
    };
    const handleClose = () => {
      setLocalOpen(false);
      if (closeProfileModal) closeProfileModal();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('open-profile-modal', handleOpen);
      document.addEventListener('open-profile-modal', handleOpen);
      window.addEventListener('close-profile-modal', handleClose);
      document.addEventListener('close-profile-modal', handleClose);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-profile-modal', handleOpen);
        document.removeEventListener('open-profile-modal', handleOpen);
        window.removeEventListener('close-profile-modal', handleClose);
        document.removeEventListener('close-profile-modal', handleClose);
      }
    };
  }, [openProfileModal, closeProfileModal]);

  const isOpen = Boolean(isProfileModalOpen || localOpen);

  const handleCloseModal = () => {
    setLocalOpen(false);
    if (closeProfileModal) closeProfileModal();
  };

  return <ProfileModal isOpen={isOpen} onClose={handleCloseModal} />;
}
