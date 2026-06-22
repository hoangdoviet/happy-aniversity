import React from 'react';
import { TreeMode } from '../types';

interface UIOverlayProps {
  mode: TreeMode;
  onToggle: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  mode,
  onToggle,
}) => {
  const isFormed = mode === TreeMode.FORMED;

  /* ================= UI ================= */
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      <header className="absolute top-8 left-1/2 -translate-x-1/2">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5E6BF] to-[#D4AF37] font-serif">
          Merry Christmas
        </h1>
      </header>
    </div>
  );
};
