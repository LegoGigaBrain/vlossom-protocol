'use client';

/**
 * FeatureCard
 *
 * Reusable card component for feature highlights on landing page.
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-card p-6 shadow-soft',
        'hover:shadow-card transition-shadow duration-300',
        className
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-background-secondary flex items-center justify-center mb-4 text-brand-purple">
        {icon}
      </div>
      <h3 className="text-h3 font-display text-text-primary mb-2">{title}</h3>
      <p className="text-body text-text-secondary">{description}</p>
    </div>
  );
}
