/**
 * Vlossom Icon Components (V6.0 Design System)
 *
 * Botanical icons derived from the Vlossom flower linework.
 * These replace generic icon libraries (Lucide, Heroicons, etc.)
 *
 * All icons use Primary Purple (#311E6B) and organic curves.
 * See /design/brand/icons/ICONOGRAPHY_REPORT.md for full documentation.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface VlossomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  /** Use accent color (orange #FF510D) for growth/celebration moments only */
  accent?: boolean;
}

const defaultProps = {
  size: 24,
  strokeWidth: 1.5,
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// =============================================================================
// NAVIGATION ICONS
// =============================================================================

/**
 * Home - Centered flower core
 * Meaning: Center, belonging
 * Usage: NavBar, HomeTab
 */
export const VlossomHome = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, accent: _accent, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <path d="M12 6.5c0 0-1.5 2-1.5 3.5s.67 2 1.5 2 1.5-.5 1.5-2S12 6.5 12 6.5z" />
      <path d="M17.5 12c0 0-2 1.5-3.5 1.5s-2-.67-2-1.5.5-1.5 2-1.5S17.5 12 17.5 12z" />
      <path d="M12 17.5c0 0 1.5-2 1.5-3.5s-.67-2-1.5-2-1.5.5-1.5 2S12 17.5 12 17.5z" />
      <path d="M6.5 12c0 0 2-1.5 3.5-1.5s2 .67 2 1.5-.5 1.5-2 1.5S6.5 12 6.5 12z" />
      <circle cx="12" cy="12" r="9" opacity="0.3" />
    </svg>
  )
);
VlossomHome.displayName = "VlossomHome";

/**
 * Search - Radiating petals
 * Meaning: Discovery, outward seeking
 * Usage: DiscoveryMap, SearchHeader
 */
export const VlossomSearch = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="11" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <path d="M11 5c0 0-2 2.5-2 4s.9 2 2 2 2-.5 2-2S11 5 11 5z" />
      <path d="M17 11c0 0-2.5 2-4 2s-2-.9-2-2 .5-2 2-2S17 11 17 11z" />
      <path d="M11 17c0 0 2-2.5 2-4s-.9-2-2-2-2 .5-2 2S11 17 11 17z" />
      <path d="M5 11c0 0 2.5-2 4-2s2 .9 2 2-.5 2-2 2S5 11 5 11z" />
      <line x1="16" y1="16" x2="20" y2="20" />
    </svg>
  )
);
VlossomSearch.displayName = "VlossomSearch";

/**
 * Calendar - Petal ring / cyclical bloom
 * Meaning: Time, rhythm, cycles
 * Usage: CalendarView, RhythmStrip
 */
export const VlossomCalendar = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 4c1.2 0 2 1.5 2 3s-.8 2.5-2 2.5S10 8.5 10 7 10.8 4 12 4z" />
      <path d="M20 12c0 1.2-1.5 2-3 2s-2.5-.8-2.5-2 .5-2 2.5-2S20 10.8 20 12z" />
      <path d="M12 20c-1.2 0-2-1.5-2-3s.8-2.5 2-2.5 2 .5 2 2.5-.8 3-2 3z" />
      <path d="M4 12c0-1.2 1.5-2 3-2s2.5.8 2.5 2-.5 2-2.5 2S4 13.2 4 12z" />
    </svg>
  )
);
VlossomCalendar.displayName = "VlossomCalendar";

/**
 * Wallet - Contained bloom / closed petals
 * Meaning: Value, safety, containment
 * Usage: WalletOverview, WalletSummary
 */
export const VlossomWallet = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <path d="M12 4c-2 0-3.5 2-4 4-.5 2 0 4 1 5.5S11 15 12 15s2-.5 3-1.5 1.5-3.5 1-5.5c-.5-2-2-4-4-4z" />
      <path d="M12 4c2 0 3.5 2 4 4 .5 2 0 4-1 5.5S13 15 12 15" />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M8.5 13c-1 1.5-1 3.5-.5 5s1.5 2.5 4 2.5 3.5-1 4-2.5.5-3.5-.5-5" opacity="0.5" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </svg>
  )
);
VlossomWallet.displayName = "VlossomWallet";

/**
 * Profile - Single flower mark
 * Meaning: Identity, self
 * Usage: ProfileHeader
 */
export const VlossomProfile = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" />
      <path d="M12 4c.8 0 1.5 1.2 1.5 2.5S12.8 8 12 8s-1.5-.3-1.5-1.5S11.2 4 12 4z" />
      <path d="M16.5 7.5c.4.7-.1 1.9-1 2.6s-1.9.7-1.8 0 .6-1.2 1.2-1.8S16.1 6.8 16.5 7.5z" />
      <path d="M15.5 13c-.4.7-1.5.9-2.5.6s-1.5-.9-1-.9 1.3-.1 2-.2 1.9-.2 1.5.5z" />
      <path d="M8.5 13c.4.7 1.5.9 2.5.6s1.5-.9 1-.9-1.3-.1-2-.2-1.9-.2-1.5.5z" />
      <path d="M7.5 7.5c-.4.7.1 1.9 1 2.6s1.9.7 1.8 0-.6-1.2-1.2-1.8S7.9 6.8 7.5 7.5z" />
      <path d="M12 14v6" />
      <path d="M10 17c0 0 1.5-1 2-1s2 1 2 1" opacity="0.5" />
    </svg>
  )
);
VlossomProfile.displayName = "VlossomProfile";

/**
 * Notifications - Pulsing bud or center dot
 * Meaning: Awareness, emerging
 * Usage: NotificationIndicator
 */
export const VlossomNotifications = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <path d="M12 5c-3 0-5 2.5-5.5 5-.5 2.5 0 5 1.5 7h8c1.5-2 2-4.5 1.5-7-.5-2.5-2.5-5-5.5-5z" />
      <path d="M8 12c-1 0-2-.5-2.5-1.5" opacity="0.5" />
      <path d="M16 12c1 0 2-.5 2.5-1.5" opacity="0.5" />
      <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" />
      <path d="M10 17c0 1.5 1 2.5 2 2.5s2-1 2-2.5" />
      <path d="M12 19.5v1" opacity="0.5" />
    </svg>
  )
);
VlossomNotifications.displayName = "VlossomNotifications";

// =============================================================================
// STATE ICONS
// =============================================================================

/**
 * Healthy - Open flower, full petals
 * Meaning: Balanced, stable
 * Usage: HealthStatusBadge
 */
export const VlossomHealthy = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <path d="M12 3c1.5 0 2.5 2.5 2.5 4.5S13.5 10 12 10s-2.5-.5-2.5-2.5S10.5 3 12 3z" />
      <path d="M19.5 9c.5 1.4-1.5 3.2-3.3 4s-3.3.3-3-.5.7-1.8 2-2.8S19 7.6 19.5 9z" />
      <path d="M17 18c-.9 1.2-3.2.8-4.5-.2s-2-2.5-1.2-2.7 2 .2 3.2.8S17.9 16.8 17 18z" />
      <path d="M7 18c.9 1.2 3.2.8 4.5-.2s2-2.5 1.2-2.7-2 .2-3.2.8S6.1 16.8 7 18z" />
      <path d="M4.5 9c-.5 1.4 1.5 3.2 3.3 4s3.3.3 3-.5-.7-1.8-2-2.8S5 7.6 4.5 9z" />
    </svg>
  )
);
VlossomHealthy.displayName = "VlossomHealthy";

/**
 * Growing - Petals partially opening
 * Meaning: Active improvement
 * Usage: GrowthMeter, ProgressChip
 */
export const VlossomGrowing = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, accent, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", accent && "text-accent-orange", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 4c1.2 0 2 2 2 3.5S13.2 9.5 12 9.5 10 9 10 7.5 10.8 4 12 4z" />
      <path d="M18 10c.3 1-1 2.5-2.5 3s-2.8 0-2.5-.7.8-1.5 1.8-2.2S17.7 9 18 10z" opacity="0.85" />
      <path d="M16 17c-.6.9-2.2.7-3.2-.1s-1.5-1.8-.8-2 1.5.1 2.3.5S16.6 16.1 16 17z" opacity="0.7" />
      <path d="M8 17c.6.9 2.2.7 3.2-.1s1.5-1.8.8-2-1.5.1-2.3.5S7.4 16.1 8 17z" opacity="0.55" />
      <path d="M6 10c-.3 1 1 2.5 2.5 3s2.8 0 2.5-.7-.8-1.5-1.8-2.2S6.3 9 6 10z" opacity="0.4" />
      <path d="M12 2v1" opacity="0.5" />
    </svg>
  )
);
VlossomGrowing.displayName = "VlossomGrowing";

/**
 * Resting - Closed or folded petals
 * Meaning: Recovery phase
 * Usage: CalendarDayCell, ScheduleOverlay
 */
export const VlossomResting = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="11" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
      <path d="M12 5c-2 0-3 2-3.5 4-.4 1.5 0 3 .5 4.5.5 1.5 1.5 2.5 3 2.5s2.5-1 3-2.5c.5-1.5.9-3 .5-4.5-.5-2-1.5-4-3.5-4z" />
      <path d="M10 8c0 0 .5 2.5 2 2.5s2-2.5 2-2.5" opacity="0.5" />
      <path d="M9.5 12c0 0 1 2 2.5 2s2.5-2 2.5-2" opacity="0.3" />
      <path d="M12 16v4" />
      <path d="M10 18c0 0 1.5-.5 2-.5s2 .5 2 .5" opacity="0.4" />
    </svg>
  )
);
VlossomResting.displayName = "VlossomResting";

/**
 * NeedsCare - Drooping petal / asymmetry
 * Meaning: Attention required
 * Usage: CareAlertCard
 */
export const VlossomNeedsCare = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="11" r="2" fill="currentColor" stroke="none" opacity="0.8" />
      <path d="M16 8c.4.8-.3 2.2-1.5 3s-2.5.5-2.3-.3.7-1.5 1.5-2.2S15.6 7.2 16 8z" />
      <path d="M15 15c-.5.8-1.8.8-2.8.2s-1.5-1.5-1-1.7 1.3 0 2.1.3S15.5 14.2 15 15z" />
      <path d="M8 9c-.6.5-1.2 2-1 3s.5 2 1.5 1.5.5-1.5.3-2.5S8.6 8.5 8 9z" opacity="0.5" />
      <path d="M9 16c.3.9 1.2 1.5 2.2 1.2s1.8-1 1.5-1.5-1-.2-1.8-.1S8.7 15.1 9 16z" opacity="0.5" />
      <path d="M11 4c1 .2 1.8 2 1.8 3.5S12 9 11 9s-1.5-.5-1.5-2S10 3.8 11 4z" opacity="0.7" />
      <circle cx="6" cy="6" r="1.5" opacity="0.4" />
    </svg>
  )
);
VlossomNeedsCare.displayName = "VlossomNeedsCare";

/**
 * Transition - Phase change
 * Meaning: Single unfold/close motion
 * Usage: FlowStepper, SessionProgress
 */
export const VlossomTransition = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, accent, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", accent && "text-accent-orange", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 4c1 0 1.8 1.8 1.8 3.2S13 9 12 9s-1.8-.4-1.8-1.8S11 4 12 4z" />
      <path d="M18 11c.3.9-.8 2.2-2 2.8s-2.5.3-2.3-.4.7-1.4 1.5-2S17.7 10.1 18 11z" />
      <path d="M16 17c-.6.8-2 .8-3 .2s-1.5-1.5-1-1.7 1.3 0 2 .3S16.6 16.2 16 17z" opacity="0.6" />
      <path d="M8 17c.6.8 2 .8 3 .2s1.5-1.5 1-1.7-1.3 0-2 .3S7.4 16.2 8 17z" opacity="0.6" />
      <path d="M6 11c-.3.9.8 2.2 2 2.8s2.5.3 2.3-.4-.7-1.4-1.5-2S6.3 10.1 6 11z" />
      <path d="M4 8l1.5 1" opacity="0.3" />
      <path d="M20 8l-1.5 1" opacity="0.3" />
      <path d="M12 20v1" opacity="0.3" />
    </svg>
  )
);
VlossomTransition.displayName = "VlossomTransition";

// =============================================================================
// UTILITY ICONS
// =============================================================================

/**
 * Add - Emerging bud (organic plus)
 * Meaning: Create/Add
 * Usage: Add buttons, create actions
 */
export const VlossomAdd = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 5c.5 0 1 1.5 1 3s-.5 2-1 2-1-.5-1-2 .5-3 1-3z" />
      <path d="M19 12c0 .5-1.5 1-3 1s-2-.5-2-1 .5-1 2-1 3 .5 3 1z" />
      <path d="M12 19c-.5 0-1-1.5-1-3s.5-2 1-2 1 .5 1 2-.5 3-1 3z" />
      <path d="M5 12c0-.5 1.5-1 3-1s2 .5 2 1-.5 1-2 1-3-.5-3-1z" />
    </svg>
  )
);
VlossomAdd.displayName = "VlossomAdd";

/**
 * Close - Folding petals (organic X)
 * Meaning: Close/Dismiss
 * Usage: Close buttons, dismiss actions
 */
export const VlossomClose = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M6 6c0 0 2.5 2.5 4 4s2 2 2 2" />
      <path d="M18 6c0 0-2.5 2.5-4 4s-2 2-2 2" />
      <path d="M6 18c0 0 2.5-2.5 4-4s2-2 2-2" />
      <path d="M18 18c0 0-2.5-2.5-4-4s-2-2-2-2" />
      <circle cx="6" cy="6" r="1" opacity="0.4" />
      <circle cx="18" cy="6" r="1" opacity="0.4" />
      <circle cx="6" cy="18" r="1" opacity="0.4" />
      <circle cx="18" cy="18" r="1" opacity="0.4" />
    </svg>
  )
);
VlossomClose.displayName = "VlossomClose";

/**
 * Favorite - Heart-shaped petals
 * Meaning: Love/Favorite
 * Usage: Favorite buttons, likes
 */
export const VlossomFavorite = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <path d="M12 6c-2-2.5-5-2.5-6.5-.5s-1 5 .5 7c1.5 2 6 5.5 6 5.5s4.5-3.5 6-5.5 2-5-.5-7S14 3.5 12 6z" />
      <path d="M12 8c-1.5-1.5-3-1.5-4-.5s-.5 3 .5 4 3.5 3 3.5 3" opacity="0.4" />
      <path d="M12 8c1.5-1.5 3-1.5 4-.5s.5 3-.5 4-3.5 3-3.5 3" opacity="0.4" />
      <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
);
VlossomFavorite.displayName = "VlossomFavorite";

/**
 * Settings - Flower with adjustable petals
 * Meaning: Configuration
 * Usage: Settings, preferences
 */
export const VlossomSettings = React.forwardRef<SVGSVGElement, VlossomIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("vlossom-icon", className)}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 4c.5 0 1 1 1 2s-.5 1.5-1 1.5-1-.5-1-1.5.5-2 1-2z" />
      <path d="M18 7c.2.5-.3 1.3-1 1.8s-1.5.3-1.3-.2.5-1 1-1.4.8-.7 1.3-.2z" />
      <path d="M19 13c-.2.5-1 .7-1.8.5s-1-.8-.8-1.2.8-.5 1.5-.4 1.3.6 1.1 1.1z" />
      <path d="M14 18.5c-.3.4-1 .5-1.7.2s-1-.8-.7-1.2.8-.4 1.4-.2 1.3.8 1 1.2z" />
      <path d="M10 18.5c.3.4 1 .5 1.7.2s1-.8.7-1.2-.8-.4-1.4-.2-1.3.8-1 1.2z" />
      <path d="M5 13c.2.5 1 .7 1.8.5s1-.8.8-1.2-.8-.5-1.5-.4-1.3.6-1.1 1.1z" />
      <path d="M6 7c-.2.5.3 1.3 1 1.8s1.5.3 1.3-.2-.5-1-1-1.4-.8-.7-1.3-.2z" />
      <circle cx="12" cy="12" r="4.5" opacity="0.15" />
    </svg>
  )
);
VlossomSettings.displayName = "VlossomSettings";

// =============================================================================
// EXPORT ALL ICONS
// =============================================================================

export const VlossomIcons = {
  // Navigation
  Home: VlossomHome,
  Search: VlossomSearch,
  Calendar: VlossomCalendar,
  Wallet: VlossomWallet,
  Profile: VlossomProfile,
  Notifications: VlossomNotifications,
  // States
  Healthy: VlossomHealthy,
  Growing: VlossomGrowing,
  Resting: VlossomResting,
  NeedsCare: VlossomNeedsCare,
  Transition: VlossomTransition,
  // Utility
  Add: VlossomAdd,
  Close: VlossomClose,
  Favorite: VlossomFavorite,
  Settings: VlossomSettings,
};

export default VlossomIcons;
