import React, { createContext, useContext, useState, useEffect } from 'react';

export type MotionLevel = 'full' | 'reduced' | 'off';

export interface MotionTokens {
  duration: {
    quick: number; // 150ms -> 0.15s
    normal: number; // 250ms -> 0.25s
    slow: number; // 450ms -> 0.45s
  };
  durationMs: {
    quick: number;
    normal: number;
    slow: number;
  };
  ease: [number, number, number, number]; // gentle ease-out, strictly no bouncy springs
  stagger: number; // 60ms -> 0.06s
  revealDistance: number; // 12px
}

export const MOTION_TOKENS: MotionTokens = {
  duration: {
    quick: 0.15,
    normal: 0.25,
    slow: 0.45,
  },
  durationMs: {
    quick: 150,
    normal: 250,
    slow: 450,
  },
  ease: [0.16, 1, 0.3, 1], // Gentle ease-out
  stagger: 0.06,
  revealDistance: 12,
};

interface MotionContextType {
  motionLevel: MotionLevel;
  setMotionLevel: (level: MotionLevel) => void;
  isFull: boolean;
  isReduced: boolean;
  isOff: boolean;
  tokens: MotionTokens;
}

const MotionContext = createContext<MotionContextType>({
  motionLevel: 'full',
  setMotionLevel: () => {},
  isFull: true,
  isReduced: false,
  isOff: false,
  tokens: MOTION_TOKENS,
});

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Saved in memory only (no localStorage or browser storage as requested)
  // Default to Full on desktop and Reduced on phones, or reduced if system prefers reduced motion
  const [motionLevel, setMotionLevel] = useState<MotionLevel>(() => {
    if (typeof window === 'undefined') return 'full';
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return 'reduced';
    const isMobile = window.innerWidth < 768;
    return isMobile ? 'reduced' : 'full';
  });

  // Track system prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMotionLevel('reduced');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value: MotionContextType = {
    motionLevel,
    setMotionLevel,
    isFull: motionLevel === 'full',
    isReduced: motionLevel === 'reduced',
    isOff: motionLevel === 'off',
    tokens: MOTION_TOKENS,
  };

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
};

export const useMotion = () => useContext(MotionContext);
