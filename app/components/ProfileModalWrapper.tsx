'use client';

import React, { useState, useEffect } from 'react';
import ProfileModal from './ProfileModal';

export default function ProfileModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    document.addEventListener('open-profile-modal', handleOpen);
    
    return () => {
      document.removeEventListener('open-profile-modal', handleOpen);
    };
  }, []);

  return <ProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
