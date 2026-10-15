import React from 'react';
import { motion, Variants } from 'motion/react';
import { useMotion } from '../../motion/motionSystem';

export interface AnimatedGroupProps {
  children: React.ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  as?: React.ElementType;
}

export function AnimatedGroup({
  children,
  className = '',
  variants,
  as = 'div',
}: AnimatedGroupProps) {
  const { isOff, isFull, tokens } = useMotion();

  const defaultContainerVariants: Variants = {
    hidden: { opacity: isOff ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isFull ? tokens.stagger : 0, // 60ms stagger between siblings
      },
    },
  };

  const defaultItemVariants: Variants = {
    hidden: isOff ? {} : { opacity: 0, y: tokens.revealDistance }, // 12px up with a fade
    visible: {
      opacity: 1,
      y: 0,
      transition: isOff
        ? { duration: 0 }
        : {
            duration: tokens.duration.normal, // 250ms
            ease: tokens.ease, // gentle ease-out
          },
    },
  };

  const containerVariants = variants?.container || defaultContainerVariants;
  const itemVariants = variants?.item || defaultItemVariants;

  const Container = motion.create(as as any);

  return (
    <Container
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
      className={className}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div key={index} variants={itemVariants} className="h-full">
            {child}
          </motion.div>
        );
      })}
    </Container>
  );
}
