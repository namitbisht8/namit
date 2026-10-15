import React, { useEffect, useState, useRef } from 'react';
import { useMotion } from '../../motion/motionSystem';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const { isFull, tokens } = useMotion();
  const [displayValue, setDisplayValue] = useState<number>(() => (isFull ? 0 : value));
  const hasAnimatedRef = useRef(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isFull) {
      setDisplayValue(value);
      return;
    }

    if (hasAnimatedRef.current) {
      setDisplayValue(value);
      return;
    }

    // Single run animation when component mounts / comes into view
    hasAnimatedRef.current = true;
    const durationMs = tokens.durationMs.slow; // 450ms
    const startTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Gentle ease-out approximation: 1 - Math.pow(1 - progress, 3)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = easedProgress * value;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, isFull, tokens.durationMs.slow]);

  const formatted = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString();

  return (
    <span ref={elementRef} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
};
