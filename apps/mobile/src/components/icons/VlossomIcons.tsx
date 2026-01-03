/**
 * Vlossom Botanical Icons (V6.0 Mobile)
 *
 * React Native SVG implementations of the Vlossom icon system
 * Derived from the Vlossom flower linework style
 *
 * These are NOT generic icons - each icon carries symbolic meaning:
 * - Home: Centered core, belonging
 * - Search: Radiating petals, discovery
 * - Calendar: Petal ring, cycles
 * - Wallet: Contained bloom, value
 * - Profile: Single flower, identity
 * - Notifications: Pulsing bud, awareness
 */

import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { colors } from '../../styles/tokens';

// =============================================================================
// Icon Props
// =============================================================================

interface VlossomIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
  accent?: boolean; // Use accent orange for growth/celebration
}

// =============================================================================
// Navigation Icons
// =============================================================================

/**
 * Home Icon - Centered flower core representing belonging
 */
export function VlossomHomeIcon({
  size = 24,
  color = colors.primary,
  focused,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;
  const strokeColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Center core */}
      <Circle cx="12" cy="12" r="2.5" fill={fillColor} />
      {/* Four petals */}
      <Path
        d="M12 6.5c0 0-1.5 2-1.5 3.5s.67 2 1.5 2 1.5-.5 1.5-2S12 6.5 12 6.5z"
        fill={focused ? fillColor : 'none'}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.5 12c0 0-2 1.5-3.5 1.5s-2-.67-2-1.5.5-1.5 2-1.5 3.5 1.5 3.5 1.5z"
        fill={focused ? fillColor : 'none'}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17.5c0 0 1.5-2 1.5-3.5s-.67-2-1.5-2-1.5.5-1.5 2 1.5 3.5 1.5 3.5z"
        fill={focused ? fillColor : 'none'}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 12c0 0 2-1.5 3.5-1.5s2 .67 2 1.5-.5 1.5-2 1.5S6.5 12 6.5 12z"
        fill={focused ? fillColor : 'none'}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Search Icon - Radiating petals representing discovery
 */
export function VlossomSearchIcon({
  size = 24,
  color = colors.primary,
  focused: _focused,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;
  const strokeColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Center with radiating lines */}
      <Circle cx="11" cy="11" r="2" fill={fillColor} />
      {/* Radiating petal lines */}
      <Path
        d="M11 5v2M11 15v2M5 11h2M15 11h2"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Diagonal petals */}
      <Path
        d="M7 7l1.5 1.5M14.5 14.5l1.5 1.5M7 15l1.5-1.5M14.5 7.5l1.5-1.5"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Search handle */}
      <Path
        d="M16 16l4 4"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Calendar Icon - Petal ring representing cycles
 */
export function VlossomCalendarIcon({
  size = 24,
  color = colors.primary,
  focused,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;
  const strokeColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Center dot */}
      <Circle cx="12" cy="13" r="1.5" fill={fillColor} />
      {/* Petal ring */}
      <Circle
        cx="12"
        cy="13"
        r="5"
        stroke={strokeColor}
        strokeWidth="1.5"
        fill={focused ? `${fillColor}20` : 'none'}
      />
      {/* Calendar top hooks */}
      <Path
        d="M8 6v3M16 6v3"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Outer frame */}
      <Path
        d="M4 10h16M4 10v9a2 2 0 002 2h12a2 2 0 002-2v-9M4 10V8a2 2 0 012-2h12a2 2 0 012 2v2"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Wallet Icon - Contained bloom representing value
 */
export function VlossomWalletIcon({
  size = 24,
  color = colors.primary,
  focused,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;
  const strokeColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Container */}
      <Path
        d="M4 8a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z"
        stroke={strokeColor}
        strokeWidth="1.5"
        fill={focused ? `${fillColor}10` : 'none'}
      />
      {/* Fold/flap */}
      <Path
        d="M4 8h16M16 6H8a2 2 0 00-2 2"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Flower bloom inside */}
      <Circle cx="16" cy="13" r="1.5" fill={fillColor} />
      <Path
        d="M16 11c0 0-.5.5-.5 1s.22.5.5.5.5-.25.5-.5-.5-1-.5-1z"
        fill={fillColor}
      />
      <Path
        d="M16 15c0 0 .5-.5.5-1s-.22-.5-.5-.5-.5.25-.5.5.5 1 .5 1z"
        fill={fillColor}
      />
    </Svg>
  );
}

/**
 * Profile Icon - Single flower mark representing identity
 */
export function VlossomProfileIcon({
  size = 24,
  color = colors.primary,
  focused,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;
  const strokeColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Head circle with flower inside */}
      <Circle
        cx="12"
        cy="9"
        r="4"
        stroke={strokeColor}
        strokeWidth="1.5"
        fill={focused ? `${fillColor}20` : 'none'}
      />
      {/* Flower center in head */}
      <Circle cx="12" cy="9" r="1" fill={fillColor} />
      {/* Small petals */}
      <Path
        d="M12 6.5c0 .5-.3.75-.3.75s.3.25.3.75.3-.25.3-.75-.3-.75-.3-.75z"
        fill={fillColor}
      />
      {/* Body/shoulders */}
      <Path
        d="M5 20v-1a7 7 0 0114 0v1"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill={focused ? `${fillColor}10` : 'none'}
      />
    </Svg>
  );
}

/**
 * Notifications Icon - Pulsing bud representing awareness
 */
export function VlossomNotificationsIcon({
  size = 24,
  color = colors.primary,
  focused,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;
  const strokeColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bell shape made of petals */}
      <Path
        d="M12 4c-3 0-5 2.5-5 5.5v4c0 1-1 2-1 2h12s-1-1-1-2v-4C17 6.5 15 4 12 4z"
        stroke={strokeColor}
        strokeWidth="1.5"
        fill={focused ? `${fillColor}20` : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stem at top */}
      <Path
        d="M12 4V2"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Bud/clapper */}
      <Circle cx="12" cy="19" r="1.5" fill={fillColor} />
      {/* Petal accents */}
      <Path
        d="M9 9c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5"
        stroke={strokeColor}
        strokeWidth="1"
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}

// =============================================================================
// State Icons
// =============================================================================

/**
 * Healthy Icon - Full open flower
 */
export function VlossomHealthyIcon({
  size = 24,
  color = colors.primary,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="2" fill={fillColor} />
      {/* Full petals */}
      <G stroke={fillColor} strokeWidth="1.5" fill={`${fillColor}30`}>
        <Path d="M12 4c-1.5 0-2.5 2.5-2.5 4s1 3 2.5 3 2.5-1.5 2.5-3-1-4-2.5-4z" />
        <Path d="M20 12c0-1.5-2.5-2.5-4-2.5s-3 1-3 2.5 1.5 2.5 3 2.5 4-1 4-2.5z" />
        <Path d="M12 20c1.5 0 2.5-2.5 2.5-4s-1-3-2.5-3-2.5 1.5-2.5 3 1 4 2.5 4z" />
        <Path d="M4 12c0 1.5 2.5 2.5 4 2.5s3-1 3-2.5-1.5-2.5-3-2.5-4 1-4 2.5z" />
      </G>
    </Svg>
  );
}

/**
 * Growing Icon - Partially opening flower
 */
export function VlossomGrowingIcon({
  size = 24,
  color = colors.primary,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="2" fill={fillColor} />
      {/* Partially open petals */}
      <Path
        d="M12 5c-.8 0-1.5 1.5-1.5 2.5s.67 2 1.5 2 1.5-1 1.5-2S12.8 5 12 5z"
        stroke={fillColor}
        strokeWidth="1.5"
        fill={`${fillColor}20`}
      />
      <Path
        d="M19 12c0-.8-1.5-1.5-2.5-1.5s-2 .67-2 1.5 1 1.5 2 1.5 2.5-.7 2.5-1.5z"
        stroke={fillColor}
        strokeWidth="1.5"
        fill={`${fillColor}20`}
      />
      {/* Arrow up indicating growth */}
      <Path
        d="M12 19v-3M10 18l2-2 2 2"
        stroke={fillColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Resting Icon - Closed flower
 */
export function VlossomRestingIcon({
  size = 24,
  color = colors.primary,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Closed bud */}
      <Path
        d="M12 6c-2 0-3 3-3 6s1 6 3 6 3-3 3-6-1-6-3-6z"
        stroke={fillColor}
        strokeWidth="1.5"
        fill={`${fillColor}20`}
      />
      {/* Inner curve */}
      <Path
        d="M10 12c0-2 1-4 2-4s2 2 2 4-1 4-2 4-2-2-2-4z"
        stroke={fillColor}
        strokeWidth="1"
        opacity={0.5}
      />
      {/* Center */}
      <Circle cx="12" cy="12" r="1" fill={fillColor} />
    </Svg>
  );
}

/**
 * Needs Care Icon - Drooping flower
 */
export function VlossomNeedsCareIcon({
  size = 24,
  color = colors.primary,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Drooping petals */}
      <Path
        d="M12 6c-1 0-2 2-2 3.5s1 2.5 2 2.5 2-1 2-2.5S13 6 12 6z"
        stroke={fillColor}
        strokeWidth="1.5"
        fill={`${fillColor}15`}
      />
      <Path
        d="M7 14c0-1 1-1.5 2-1.5s2 .5 2 1.5-1 2-2 2-2-1.5-2-1.5z"
        stroke={fillColor}
        strokeWidth="1.5"
        fill={`${fillColor}15`}
        opacity={0.7}
      />
      <Path
        d="M13 14c0-1 1-1.5 2-1.5s2 1 2 2-1 1.5-2 1.5-2-.5-2-1.5z"
        stroke={fillColor}
        strokeWidth="1.5"
        fill={`${fillColor}15`}
        opacity={0.7}
      />
      {/* Stem drooping */}
      <Path
        d="M12 18c0-2-1-3-1-5"
        stroke={fillColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// =============================================================================
// Utility Icons
// =============================================================================

export function VlossomAddIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 8v8M8 12h8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function VlossomCloseIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Back Icon - Arrow pointing left for navigation
 */
export function VlossomBackIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function VlossomFavoriteIcon({
  size = 24,
  color = colors.primary,
  focused,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        stroke={color}
        strokeWidth="1.5"
        fill={focused ? color : 'none'}
      />
    </Svg>
  );
}

export function VlossomSettingsIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Location Icon - Pin marker representing place
 */
export function VlossomLocationIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

/**
 * Check Icon - Checkmark for success/confirmation states
 */
export function VlossomCheckIcon({
  size = 24,
  color = colors.primary,
  focused,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="1.5"
        fill={focused ? `${color}20` : 'none'}
      />
      <Path
        d="M8 12l3 3 5-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Chevron Right Icon - Arrow pointing right for navigation
 */
export function VlossomChevronRightIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Verified Icon - Badge with checkmark for verified status
 */
export function VlossomVerifiedIcon({
  size = 24,
  color = colors.primary,
  focused,
  accent,
}: VlossomIconProps) {
  const fillColor = accent ? colors.accent : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Shield/badge shape */}
      <Path
        d="M12 2L4 6v5c0 5.25 3.4 10.15 8 12 4.6-1.85 8-6.75 8-12V6l-8-4z"
        stroke={fillColor}
        strokeWidth="1.5"
        fill={focused ? `${fillColor}20` : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Checkmark inside */}
      <Path
        d="M8.5 12l2.5 2.5 4.5-5"
        stroke={fillColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Community Icon - Group of connected flowers representing community
 */
export function VlossomCommunityIcon({
  size = 24,
  color = colors.primary,
  focused,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Central figure */}
      <Circle cx="12" cy="8" r="3" stroke={color} strokeWidth="1.5" fill={focused ? `${color}20` : 'none'} />
      <Path
        d="M8 20v-1a4 4 0 018 0v1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Left figure */}
      <Circle cx="6" cy="10" r="2" stroke={color} strokeWidth="1.5" opacity={0.7} />
      <Path
        d="M3 20v-.5a3 3 0 015 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Right figure */}
      <Circle cx="18" cy="10" r="2" stroke={color} strokeWidth="1.5" opacity={0.7} />
      <Path
        d="M16 19.5a3 3 0 015 0v.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.7}
      />
    </Svg>
  );
}

/**
 * Clock Icon - Time representation with botanical styling
 */
export function VlossomClockIcon({
  size = 24,
  color = colors.primary,
  focused,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Clock face */}
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="1.5"
        fill={focused ? `${color}10` : 'none'}
      />
      {/* Center dot */}
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      {/* Clock hands */}
      <Path
        d="M12 7v5l3 3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hour marks */}
      <Path
        d="M12 4v1M12 19v1M4 12h1M19 12h1"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}

/**
 * Refresh Icon - Circular arrows for refresh/reload
 */
export function VlossomRefreshIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Circular arrow path */}
      <Path
        d="M4 12a8 8 0 018-8c3.37 0 6.27 2.09 7.45 5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M20 12a8 8 0 01-8 8c-3.37 0-6.27-2.09-7.45-5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Arrow heads */}
      <Path
        d="M20 4v5h-5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20v-5h5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Star Icon - For ratings and favorites
 */
export function VlossomStarIcon({
  size = 24,
  color = colors.primary,
  focused,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? color : 'none'}
      />
    </Svg>
  );
}

/**
 * Edit Icon - Pencil for editing
 */
export function VlossomEditIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Send Icon - Paper plane for sending messages
 */
export function VlossomSendIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Message Icon - Chat bubble for messaging
 */
export function VlossomMessageIcon({
  size = 24,
  color = colors.primary,
  focused,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? `${color}20` : 'none'}
      />
    </Svg>
  );
}

/**
 * Chevron Down Icon - Dropdown indicator
 */
export function VlossomChevronDownIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Chevron Up Icon - Collapse indicator
 */
export function VlossomChevronUpIcon({
  size = 24,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 15l-6-6-6 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// =============================================================================
// MAP PIN ICONS (V8.0 - Uber-Style Map)
// =============================================================================

interface MapPinIconProps extends VlossomIconProps {
  /** Status color override */
  status?: 'available' | 'busy' | 'offline';
  /** Enable pulse animation for mobile stylists */
  animate?: boolean;
}

const statusColors = {
  available: colors.status.success,
  busy: colors.status.warning,
  offline: colors.text.muted,
};

/**
 * Salon Map Pin - Potted Plant 🪴
 * Meaning: Established salon location, rooted, stable
 * Usage: Map markers for salons
 */
export function VlossomPinSalonIcon({
  size = 32,
  color = colors.primary,
  status,
}: MapPinIconProps) {
  const pinColor = status ? statusColors[status] : color;

  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 32 40" fill="none">
      {/* Pin body - teardrop shape */}
      <Path
        d="M16 2C9 2 4 7 4 13c0 8 12 25 12 25s12-17 12-25c0-6-5-11-12-11z"
        fill={`${pinColor}25`}
        stroke={pinColor}
        strokeWidth="1.5"
      />

      {/* Pot base */}
      <Path
        d="M11 20h10l-1.5 4h-7L11 20z"
        fill={`${pinColor}40`}
        stroke={pinColor}
        strokeWidth="1.5"
      />

      {/* Plant stem */}
      <Path d="M16 18V13" stroke={pinColor} strokeWidth="2" />

      {/* Leaves - botanical style */}
      <Path
        d="M16 15c-2-1-4 0-4.5 2s.5 3 2 3c.8 0 1.8-.5 2.5-1.5"
        fill={`${pinColor}30`}
        stroke={pinColor}
        strokeWidth="1"
      />
      <Path
        d="M16 15c2-1 4 0 4.5 2s-.5 3-2 3c-.8 0-1.8-.5-2.5-1.5"
        fill={`${pinColor}30`}
        stroke={pinColor}
        strokeWidth="1"
      />
      <Path
        d="M16 12c-1.5-2-1-4 .5-4.5s3 .5 3.5 2-.5 2.5-2 2.8c-.7.1-1.5 0-2-.3"
        fill={`${pinColor}35`}
        stroke={pinColor}
        strokeWidth="1"
      />
      <Path
        d="M16 12c1.5-2 1-4-.5-4.5s-3 .5-3.5 2 .5 2.5 2 2.8c.7.1 1.5 0 2-.3"
        fill={`${pinColor}35`}
        stroke={pinColor}
        strokeWidth="1"
      />

      {/* Center dot */}
      <Circle cx="16" cy="13" r="1.5" fill={pinColor} />
    </Svg>
  );
}

/**
 * Fixed Stylist Map Pin - Hibiscus Flower 🌺
 * Meaning: Stylist at fixed location (home studio, rented chair)
 * Usage: Map markers for stylists with fixed locations
 */
export function VlossomPinFixedIcon({
  size = 32,
  color = colors.primary,
  status,
}: MapPinIconProps) {
  const pinColor = status ? statusColors[status] : color;

  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 32 40" fill="none">
      {/* Pin body - teardrop shape */}
      <Path
        d="M16 2C9 2 4 7 4 13c0 8 12 25 12 25s12-17 12-25c0-6-5-11-12-11z"
        fill={`${pinColor}25`}
        stroke={pinColor}
        strokeWidth="1.5"
      />

      {/* Hibiscus center */}
      <Circle cx="16" cy="13" r="2.5" fill={pinColor} />

      {/* 5 hibiscus petals - organic overlapping style */}
      <Path
        d="M16 6c1 0 2 2 2 3.5S17 11.5 16 11.5 14 11 14 9.5 15 6 16 6z"
        fill={`${pinColor}40`}
      />
      <Path
        d="M22 10c.3.9-.8 2.2-2 2.8s-2.5.3-2.3-.4.7-1.4 1.5-2S21.7 9.1 22 10z"
        fill={`${pinColor}40`}
      />
      <Path
        d="M20 17c-.6.8-2 .8-3 .2s-1.5-1.5-1-1.7 1.3 0 2 .3S20.6 16.2 20 17z"
        fill={`${pinColor}40`}
      />
      <Path
        d="M12 17c.6.8 2 .8 3 .2s1.5-1.5 1-1.7-1.3 0-2 .3S11.4 16.2 12 17z"
        fill={`${pinColor}40`}
      />
      <Path
        d="M10 10c-.3.9.8 2.2 2 2.8s2.5.3 2.3-.4-.7-1.4-1.5-2S10.3 9.1 10 10z"
        fill={`${pinColor}40`}
      />

      {/* Stamen details */}
      <Circle cx="16" cy="11" r="0.75" fill={pinColor} opacity={0.6} />
      <Circle cx="14.5" cy="12" r="0.5" fill={pinColor} opacity={0.6} />
      <Circle cx="17.5" cy="12" r="0.5" fill={pinColor} opacity={0.6} />
    </Svg>
  );
}

/**
 * Mobile Stylist Map Pin - Sunflower 🌼
 * Meaning: Mobile stylist who travels to clients
 * Usage: Map markers for mobile stylists (supports animation)
 */
export function VlossomPinMobileIcon({
  size = 32,
  color = colors.primary,
  status,
}: MapPinIconProps) {
  const pinColor = status ? statusColors[status] : color;

  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 32 40" fill="none">
      {/* Pin body - teardrop shape */}
      <Path
        d="M16 2C9 2 4 7 4 13c0 8 12 25 12 25s12-17 12-25c0-6-5-11-12-11z"
        fill={`${pinColor}25`}
        stroke={pinColor}
        strokeWidth="1.5"
      />

      {/* Sunflower center - textured */}
      <Circle cx="16" cy="13" r="3.5" fill={pinColor} />
      <Circle cx="16" cy="13" r="2.5" fill={pinColor} opacity={0.7} />

      {/* 8 sunflower petals - radiating outward */}
      {/* Top */}
      <Path
        d="M16 5.5c.8 0 1.5 1.5 1.5 2.5s-.7 1.5-1.5 1.5-1.5-.5-1.5-1.5.7-2.5 1.5-2.5z"
        fill={`${pinColor}45`}
      />
      {/* Top-right */}
      <Path
        d="M21.5 7.5c.4.6-.2 1.8-1 2.3s-1.8.3-1.7-.3.5-1.2 1.1-1.6 1.2-.8 1.6-.4z"
        fill={`${pinColor}45`}
      />
      {/* Right */}
      <Path
        d="M23.5 13c0 .8-1.5 1.5-2.5 1.5s-1.5-.7-1.5-1.5.5-1.5 1.5-1.5 2.5.7 2.5 1.5z"
        fill={`${pinColor}45`}
      />
      {/* Bottom-right */}
      <Path
        d="M21.5 18.5c-.4.6-1.6.2-2.1-.5s-.5-1.6.2-1.7.9.3 1.4.8.9 1 .5 1.4z"
        fill={`${pinColor}45`}
      />
      {/* Bottom */}
      <Path
        d="M16 20.5c-.8 0-1.5-1.5-1.5-2.5s.7-1.5 1.5-1.5 1.5.5 1.5 1.5-.7 2.5-1.5 2.5z"
        fill={`${pinColor}45`}
      />
      {/* Bottom-left */}
      <Path
        d="M10.5 18.5c.4.6 1.6.2 2.1-.5s.5-1.6-.2-1.7-.9.3-1.4.8-.9 1-.5 1.4z"
        fill={`${pinColor}45`}
      />
      {/* Left */}
      <Path
        d="M8.5 13c0-.8 1.5-1.5 2.5-1.5s1.5.7 1.5 1.5-.5 1.5-1.5 1.5-2.5-.7-2.5-1.5z"
        fill={`${pinColor}45`}
      />
      {/* Top-left */}
      <Path
        d="M10.5 7.5c-.4.6.2 1.8 1 2.3s1.8.3 1.7-.3-.5-1.2-1.1-1.6-1.2-.8-1.6-.4z"
        fill={`${pinColor}45`}
      />

      {/* Motion lines (indicating movement) */}
      <Path d="M7 10l-2-1" stroke={pinColor} strokeWidth="1" opacity={0.4} />
      <Path d="M7 16l-2 1" stroke={pinColor} strokeWidth="1" opacity={0.4} />
      <Path d="M25 10l2-1" stroke={pinColor} strokeWidth="1" opacity={0.4} />
      <Path d="M25 16l2 1" stroke={pinColor} strokeWidth="1" opacity={0.4} />
    </Svg>
  );
}

/**
 * Generic Map Pin - Simple botanical marker
 * Meaning: Generic location
 * Usage: User location, search results, fallback
 */
export function VlossomPinLocationIcon({
  size = 32,
  color = colors.primary,
}: VlossomIconProps) {
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 32 40" fill="none">
      {/* Pin body - teardrop shape */}
      <Path
        d="M16 2C9 2 4 7 4 13c0 8 12 25 12 25s12-17 12-25c0-6-5-11-12-11z"
        fill={`${color}25`}
        stroke={color}
        strokeWidth="1.5"
      />

      {/* Simple flower center */}
      <Circle cx="16" cy="12" r="2.5" fill={color} />

      {/* 4 simple petals */}
      <Path
        d="M16 6c.6 0 1 1.5 1 2.5s-.4 1.5-1 1.5-1-.5-1-1.5.4-2.5 1-2.5z"
        fill={`${color}35`}
      />
      <Path
        d="M22 12c0 .6-1.5 1-2.5 1s-1.5-.4-1.5-1 .5-1 1.5-1 2.5.4 2.5 1z"
        fill={`${color}35`}
      />
      <Path
        d="M16 18c-.6 0-1-1.5-1-2.5s.4-1.5 1-1.5 1 .5 1 1.5-.4 2.5-1 2.5z"
        fill={`${color}35`}
      />
      <Path
        d="M10 12c0-.6 1.5-1 2.5-1s1.5.4 1.5 1-.5 1-1.5 1-2.5-.4-2.5-1z"
        fill={`${color}35`}
      />
    </Svg>
  );
}
