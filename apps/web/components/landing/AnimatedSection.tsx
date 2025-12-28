'use client';

/**
 * AnimatedSection
 *
 * Wrapper component that animates children when they scroll into view.
 * Uses Intersection Observer for performance.
 */

import React from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '../../lib/utils';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Animation type: settle (slide up), unfold (scale), fade */
  animation?: 'settle' | 'unfold' | 'fade';
  /** Delay in ms before animation starts */
  delay?: number;
  /** Threshold for when to trigger (0-1) */
  threshold?: number;
  /** Only animate once */
  triggerOnce?: boolean;
}

export function AnimatedSection({
  children,
  className,
  animation = 'settle',
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
}: AnimatedSectionProps) {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
  });

  const animationClasses = {
    settle: inView ? 'animate-settle' : 'opacity-0 translate-y-4',
    unfold: inView ? 'animate-unfoldSubtle' : 'opacity-0 scale-95',
    fade: inView ? 'animate-settleFade' : 'opacity-0',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-300',
        animationClasses[animation],
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
