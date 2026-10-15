import React, { useRef } from 'react';
import { motion, useInView, Variant, Transition } from 'motion/react';
import { useMotion } from '../../motion/motionSystem';

export interface InViewProps {
  children: React.ReactNode;
  variants?: {
    hidden: Variant;
    visible: Variant;
  };
  transition?: Transition;
  viewOptions?: {
    once?: boolean;
    margin?: string;
    amount?: 'some' | 'all' | number;
  };
  as?: React.ElementType;
  className?: string;
}

export function InView({
  children,
  variants,
  transition,
  viewOptions = { once: true },
  as = 'div',
  className = '',
}: InViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, viewOptions as any);
  const { isOff, tokens } = useMotion();

  const defaultVariants = {
    hidden: isOff ? {} : { opacity: 0, y: tokens.revealDistance }, // 12px up with a fade
    visible: { opacity: 1, y: 0 },
  };

  const defaultTransition: Transition = isOff
    ? { duration: 0 }
    : {
        duration: tokens.duration.normal, // 250ms
        ease: tokens.ease, // gentle ease-out
      };

  const Component = motion.create(as as any);

  return (
    <Component
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants || defaultVariants}
      transition={transition || defaultTransition}
      className={className}
    >
      {children}
    </Component>
  );
}
