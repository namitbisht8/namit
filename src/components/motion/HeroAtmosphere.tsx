import React, { useEffect, useState } from 'react';
import { useMotion } from '../../motion/motionSystem';

export const HeroAtmosphere: React.FC = () => {
  const { isFull } = useMotion();
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Pause the background when browser tab is hidden to save battery and GPU
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // If motion is reduced or off, render static subtle ambient glow
  const isPlaying = isFull && isTabVisible;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none -z-10 select-none"
      aria-hidden="true"
    >
      {/* Faint technical dot grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(#dfe1f6 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Blob 1: Soft Violet */}
      <div
        className="absolute top-[-10%] left-[20%] w-[380px] sm:w-[520px] h-[380px] sm:h-[520px] rounded-full blur-[100px] pointer-events-none"
        style={{
          backgroundColor: '#a78bfa',
          opacity: 0.28,
          transform: isPlaying ? undefined : 'translate(0, 0)',
          animation: isPlaying ? 'drift-blob-1 18s ease-in-out infinite alternate' : 'none',
          willChange: isPlaying ? 'transform' : 'auto',
        }}
      />

      {/* Blob 2: Surgical Teal */}
      <div
        className="absolute top-[10%] right-[15%] w-[360px] sm:w-[480px] h-[360px] sm:h-[480px] rounded-full blur-[110px] pointer-events-none"
        style={{
          backgroundColor: '#2dd4bf',
          opacity: 0.26,
          transform: isPlaying ? undefined : 'translate(0, 0)',
          animation: isPlaying ? 'drift-blob-2 22s ease-in-out infinite alternate' : 'none',
          willChange: isPlaying ? 'transform' : 'auto',
        }}
      />

      {/* Blob 3: Center Grounding Glow */}
      <div
        className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[300px] h-[220px] rounded-full blur-[90px] pointer-events-none"
        style={{
          backgroundColor: '#1b1f2e',
          opacity: 0.4,
        }}
      />
    </div>
  );
};
