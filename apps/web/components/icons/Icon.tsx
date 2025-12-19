/**
 * Vlossom Icon Component
 *
 * A unified icon component that wraps Phosphor icons with consistent
 * sizing, styling, and semantic usage patterns.
 *
 * Usage:
 *   <Icon name="home" />
 *   <Icon name="bloom" size="lg" className="text-accent" />
 *   <Icon name="notifications" weight="fill" />
 *
 * When custom botanical icons are produced, this component's internals
 * change, but the API remains stable.
 */

import * as React from 'react';
import { Icons, type IconName } from './icon-map';
import { cn } from '@/lib/utils';

// =============================================================================
// SIZE SYSTEM
// Aligned with Vlossom spacing tokens (4px grid)
// =============================================================================

const sizeMap = {
  xs: 12,   // 12px - inline text icons
  sm: 16,   // 16px - compact UI
  md: 20,   // 20px - default, most common
  lg: 24,   // 24px - navigation, prominent
  xl: 32,   // 32px - hero moments
  '2xl': 40, // 40px - large feature icons
} as const;

export type IconSize = keyof typeof sizeMap;

// =============================================================================
// WEIGHT SYSTEM
// Phosphor supports multiple weights - we default to 'light' for organic feel
// =============================================================================

export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

// =============================================================================
// ICON COMPONENT
// =============================================================================

export interface IconProps {
  /** Icon name from the Iconography Report */
  name: IconName;
  /** Size preset or custom number */
  size?: IconSize | number;
  /** Phosphor weight - default 'light' for organic feel */
  weight?: IconWeight;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Hide from screen readers if decorative */
  'aria-hidden'?: boolean;
}

export function Icon({
  name,
  size = 'md',
  weight = 'light',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = true,
}: IconProps) {
  const IconComponent = Icons[name];

  if (!IconComponent) {
    console.warn(`[Vlossom Icons] Unknown icon name: "${name}"`);
    return null;
  }

  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <IconComponent
      size={pixelSize}
      weight={weight}
      className={cn('shrink-0', className)}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    />
  );
}

// =============================================================================
// CONVENIENCE COMPONENTS
// Pre-configured for common use cases
// =============================================================================

/** Navigation icon - sized for bottom nav / sidebar */
export function NavIcon(props: Omit<IconProps, 'size' | 'weight'>) {
  return <Icon {...props} size="lg" weight="light" />;
}

/** Inline icon - sized for inline with text */
export function InlineIcon(props: Omit<IconProps, 'size'>) {
  return <Icon {...props} size="sm" />;
}

/** Button icon - sized for button interiors */
export function ButtonIcon(props: Omit<IconProps, 'size'>) {
  return <Icon {...props} size="md" />;
}

/** State icon - for health/ritual state indicators */
export function StateIcon(props: Omit<IconProps, 'weight'> & { active?: boolean }) {
  const { active, ...rest } = props;
  return <Icon {...rest} weight={active ? 'fill' : 'light'} />;
}
