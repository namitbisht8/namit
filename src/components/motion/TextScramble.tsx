import React, { useEffect, useState, useRef } from 'react';
import { useMotion } from '../../motion/motionSystem';

interface TextScrambleProps {
  targetText: string;
  duration?: number; // max 600ms
  className?: string;
  trigger?: any;
}

const GLYPHS = '0123456789ABCDEF!#*&@$%/=<>~';

export const TextScramble: React.FC<TextScrambleProps> = ({
  targetText,
  duration = 450, // default 450ms, strictly capped <= 600ms
  className = '',
  trigger,
}) => {
  const { isFull } = useMotion();
  const [displayText, setDisplayText] = useState<string>(targetText);
  const mountedRef = useRef(false);

  useEffect(() => {
    // If motion is reduced or off, display targetText immediately without any scrambling
    if (!isFull) {
      setDisplayText(targetText);
      return;
    }

    const maxDuration = Math.min(duration, 600);
    const startTime = performance.now();
    let frameId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / maxDuration, 1);

      if (progress >= 1) {
        setDisplayText(targetText);
        return;
      }

      // Compute how many characters are finalized based on progress
      const length = targetText.length;
      const settledCount = Math.floor(progress * length);

      let scrambled = '';
      for (let i = 0; i < length; i++) {
        if (i < settledCount) {
          scrambled += targetText[i];
        } else {
          const char = targetText[i];
          if (char === '[' || char === ']' || char === '_' || char === ' ') {
            scrambled += char;
          } else {
            scrambled += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
      }

      setDisplayText(scrambled);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [targetText, isFull, duration, trigger]);

  return <span className={className}>{displayText}</span>;
};
