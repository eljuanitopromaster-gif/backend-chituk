'use client';

import React, { useState, useEffect } from 'react';
import ThemeModal from './ThemeModal';

export default function ThemeModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    document.addEventListener('open-theme-modal', handleOpen);
    
    return () => {
      document.removeEventListener('open-theme-modal', handleOpen);
    };
  }, []);

  return <ThemeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
