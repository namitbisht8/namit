import React, { cloneElement, useState } from 'react';
import { motion, Transition } from 'motion/react';
import { useMotion } from '../../motion/motionSystem';

export interface AnimatedBackgroundProps {
  children: React.ReactElement[] | React.ReactElement;
  defaultValue?: string;
  value?: string;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  transition?: Transition;
  enableHover?: boolean;
}

interface ChildProps {
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  'data-id'?: string;
  [key: string]: any;
}

export function AnimatedBackground({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
  transition,
  enableHover = false,
}: AnimatedBackgroundProps) {
  const { isFull, tokens } = useMotion();
  const [activeId, setActiveId] = useState<string | null>(defaultValue ?? null);

  const currentActiveId = value !== undefined ? value : activeId;

  const handleSetActiveId = (id: string | null) => {
    setActiveId(id);
    onValueChange?.(id);
  };

  const defaultTransition: Transition = isFull
    ? {
        duration: tokens.duration.normal, // 250ms
        ease: tokens.ease, // gentle ease-out, no bouncy springs
      }
    : { duration: 0 };

  const finalTransition = transition ?? defaultTransition;

  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const typedChild = child as React.ReactElement<ChildProps>;
        const id = typedChild.props['data-id'] ?? String(index);
        const isActive = currentActiveId === id;

        const interactionProps = enableHover
          ? {
              onMouseEnter: () => handleSetActiveId(id),
              onMouseLeave: () => handleSetActiveId(null),
            }
          : {
              onClick: (e: React.MouseEvent) => {
                typedChild.props.onClick?.(e);
                handleSetActiveId(id);
              },
            };

        return cloneElement(
          typedChild,
          {
            key: id,
            className: `${typedChild.props.className ?? ''} relative z-10`,
            'aria-selected': isActive,
            ...interactionProps,
          },
          <>
            {isActive && (
              <motion.div
                layoutId={`animated-bg-${defaultValue || 'shared'}`}
                className={className}
                transition={finalTransition}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: -1,
                }}
              />
            )}
            {typedChild.props.children}
          </>
        );
      })}
    </>
  );
}
