/**
 * Vlossom Icon System - Public API
 *
 * This is the ONLY entry point for icons in the Vlossom app.
 * Never import directly from @phosphor-icons/react in components.
 *
 * Usage:
 *   import { Icon, NavIcon, StateIcon } from '@/components/icons';
 *   import type { IconName } from '@/components/icons';
 */

// Main icon component and variants
export { Icon, NavIcon, InlineIcon, ButtonIcon, StateIcon } from './Icon';
export type { IconProps, IconSize, IconWeight } from './Icon';

// Icon map for programmatic access
export {
  Icons,
  NavigationIcons,
  StateIcons,
  isValidIconName,
  getIconComponent,
} from './icon-map';
export type { IconName, NavigationIconName, StateIconName } from './icon-map';
