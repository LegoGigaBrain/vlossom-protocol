/**
 * Card Component
 *
 * A versatile card container for grouping related content.
 * Motion: Supports "settle" animation for gentle arrival into place.
 */

import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Apply settle animation on mount (default: false)
   * Use for cards that appear dynamically (search results, new items)
   */
  animate?: boolean;
}

export function Card({ children, className, animate, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface-light dark:bg-surface-dark rounded-card shadow-vlossom transition-shadow ${animate ? "animate-settle motion-reduce:animate-settleFade" : ""} ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={`p-6 pb-0 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-h3 text-text-primary font-semibold ${className || ""}`}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={`text-body text-text-secondary ${className || ""}`}
      {...props}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div
      className={`p-6 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div
      className={`p-6 pt-0 flex gap-3 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
