import React from 'react';
import { useMotion } from '../../motion/motionSystem';

interface TextShimmerProps {
  children?: React.ReactNode;
  className?: string;
}

export const TextShimmer: React.FC<TextShimmerProps> = ({
  children = 'Checking...',
  className = '',
}) => {
  const { isFull } = useMotion();

  // If motion is reduced or off, render plain un-animated text
  if (!isFull) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={`inline-block relative overflow-hidden font-mono-code font-semibold ${className}`}
      style={{
        background: 'linear-gradient(90deg, #a78bfa 0%, #44e2cd 50%, #a78bfa 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'kavach-shimmer 1.8s linear infinite',
      }}
    >
      {children}
    </span>
  );
};
