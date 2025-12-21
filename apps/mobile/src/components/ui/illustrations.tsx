/**
 * Custom SVG Illustrations for Empty States (V7.0.0)
 *
 * React Native SVG illustrations matching web illustrations.
 * Used by EmptyState component for consistent empty state visuals.
 */

import React from 'react';
import Svg, { Rect, Circle, Path, Line, Ellipse, G } from 'react-native-svg';
import { colors } from '../../styles/tokens';

interface IllustrationProps {
  size?: number;
  color?: string;
}

/**
 * Calendar illustration for "no upcoming bookings" state
 */
export function CalendarIllustration({ size = 120, color = colors.primary }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Calendar body */}
      <Rect
        x="20"
        y="30"
        width="80"
        height="70"
        rx="8"
        fill={colors.secondary}
        stroke={color}
        strokeWidth="2"
      />
      {/* Calendar top bar */}
      <Rect x="20" y="30" width="80" height="20" rx="8" fill={color} />
      <Rect x="20" y="42" width="80" height="8" fill={color} />
      {/* Calendar hangers */}
      <Rect x="35" y="22" width="6" height="16" rx="3" fill={color} />
      <Rect x="79" y="22" width="6" height="16" rx="3" fill={color} />
      {/* Calendar grid lines */}
      <Line x1="20" y1="65" x2="100" y2="65" stroke={colors.border.subtle} strokeWidth="1" />
      <Line x1="20" y1="80" x2="100" y2="80" stroke={colors.border.subtle} strokeWidth="1" />
      <Line x1="47" y1="50" x2="47" y2="100" stroke={colors.border.subtle} strokeWidth="1" />
      <Line x1="73" y1="50" x2="73" y2="100" stroke={colors.border.subtle} strokeWidth="1" />
      {/* Sparkle accent */}
      <Circle cx="95" cy="25" r="3" fill={colors.accent} />
      <Path
        d="M95 18V22M95 28V32M88 25H92M98 25H102"
        stroke={colors.accent}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Search/discovery illustration for "no stylists found"
 */
export function SearchIllustration({ size = 120, color = colors.primary }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Magnifying glass circle */}
      <Circle
        cx="52"
        cy="52"
        r="30"
        fill={colors.secondary}
        stroke={color}
        strokeWidth="3"
      />
      {/* Magnifying glass handle */}
      <Line
        x1="74"
        y1="74"
        x2="95"
        y2="95"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Inner detail - stylized person */}
      <Circle cx="52" cy="45" r="8" fill={colors.primarySoft} />
      <Path
        d="M40 62C40 55.4 45.4 50 52 50C58.6 50 64 55.4 64 62"
        stroke={colors.primarySoft}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Sparkle accent */}
      <Circle cx="28" cy="28" r="3" fill={colors.accent} />
      <Path
        d="M28 22V25M28 31V34M22 28H25M31 28H34"
        stroke={colors.accent}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Wallet illustration for empty wallet state
 */
export function WalletIllustration({ size = 120, color = colors.primary }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Wallet body */}
      <Rect
        x="15"
        y="35"
        width="75"
        height="50"
        rx="8"
        fill={colors.secondary}
        stroke={color}
        strokeWidth="2"
      />
      {/* Wallet flap */}
      <Path
        d="M15 55H90V43C90 39.6863 87.3137 37 84 37H21C17.6863 37 15 39.6863 15 43V55Z"
        fill={color}
      />
      {/* Card slot */}
      <Rect
        x="70"
        y="52"
        width="25"
        height="18"
        rx="4"
        fill={colors.background.primary}
        stroke={colors.border.subtle}
        strokeWidth="1"
      />
      {/* Clasp circle */}
      <Circle cx="82" cy="61" r="5" fill={colors.accent} />
      {/* Coins floating */}
      <Circle cx="100" cy="45" r="8" fill={colors.tertiary + '66'} stroke={colors.tertiary} strokeWidth="2" />
      <Circle cx="105" cy="70" r="6" fill={colors.tertiary + '4D'} stroke={colors.tertiary} strokeWidth="1.5" />
    </Svg>
  );
}

/**
 * Scissors illustration for stylists/services
 */
export function ScissorsIllustration({ size = 120, color = colors.primary }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Background shape */}
      <Ellipse cx="60" cy="60" rx="45" ry="40" fill={colors.secondary} />
      {/* Scissor blade 1 */}
      <Path
        d="M30 45C30 45 45 55 60 60C75 65 95 60 95 60"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Scissor blade 2 */}
      <Path
        d="M30 75C30 75 45 65 60 60C75 55 95 60 95 60"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Handle rings */}
      <Circle cx="30" cy="45" r="10" fill={colors.background.primary} stroke={color} strokeWidth="3" />
      <Circle cx="30" cy="75" r="10" fill={colors.background.primary} stroke={color} strokeWidth="3" />
      {/* Pivot point */}
      <Circle cx="60" cy="60" r="5" fill={colors.accent} />
      {/* Sparkle */}
      <Circle cx="85" cy="35" r="4" fill={colors.tertiary} />
      <Path
        d="M85 28V32M85 38V42M78 35H82M88 35H92"
        stroke={colors.tertiary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Notification/inbox illustration
 */
export function InboxIllustration({ size = 120, color = colors.primary }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Main inbox shape */}
      <Path
        d="M20 50L35 30H85L100 50V85C100 89.4183 96.4183 93 92 93H28C23.5817 93 20 89.4183 20 85V50Z"
        fill={colors.secondary}
        stroke={color}
        strokeWidth="2"
      />
      {/* Top opening detail */}
      <Path
        d="M20 50H40L50 60H70L80 50H100"
        stroke={color}
        strokeWidth="2"
      />
      {/* Envelope inside */}
      <Rect x="35" y="60" width="50" height="25" rx="4" fill={colors.background.primary} stroke={colors.border.subtle} strokeWidth="1" />
      <Path d="M35 64L60 77L85 64" stroke={color} strokeWidth="2" />
      {/* Notification dot */}
      <Circle cx="90" cy="35" r="8" fill={colors.accent} />
    </Svg>
  );
}

/**
 * Star rating illustration for reviews
 */
export function ReviewsIllustration({ size = 120, color = colors.primary }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Background */}
      <Rect x="20" y="30" width="80" height="60" rx="8" fill={colors.secondary} />
      {/* Stars */}
      <Path
        d="M40 55L42.5 50L45 55L50 55.5L46.5 59L47.5 64L43 61.5L38.5 64L39.5 59L36 55.5L40 55Z"
        fill={colors.status.warning}
      />
      <Path
        d="M60 50L63 44L66 50L72 50.5L68 55L69 61L64 58L59 61L60 55L56 50.5L60 50Z"
        fill={colors.status.warning}
      />
      <Path
        d="M80 55L82.5 50L85 55L90 55.5L86.5 59L87.5 64L83 61.5L78.5 64L79.5 59L76 55.5L80 55Z"
        fill={colors.primarySoft}
      />
      {/* Lines representing text */}
      <Rect x="30" y="72" width="40" height="4" rx="2" fill={colors.border.subtle} />
      <Rect x="30" y="80" width="60" height="3" rx="1.5" fill={colors.border.subtle} />
    </Svg>
  );
}

/**
 * Message illustration for conversations
 */
export function MessageIllustration({ size = 120, color = colors.primary }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Speech bubble */}
      <Path
        d="M20 35C20 30.5817 23.5817 27 28 27H82C86.4183 27 90 30.5817 90 35V65C90 69.4183 86.4183 73 82 73H50L35 88V73H28C23.5817 73 20 69.4183 20 65V35Z"
        fill={colors.secondary}
        stroke={color}
        strokeWidth="2"
      />
      {/* Text lines */}
      <Rect x="30" y="40" width="50" height="4" rx="2" fill={colors.primarySoft} />
      <Rect x="30" y="50" width="40" height="4" rx="2" fill={colors.border.subtle} />
      <Rect x="30" y="60" width="30" height="4" rx="2" fill={colors.border.subtle} />
      {/* Sparkle */}
      <Circle cx="100" cy="35" r="4" fill={colors.accent} />
      <Path
        d="M100 28V32M100 38V42M93 35H97M103 35H107"
        stroke={colors.accent}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * House/property illustration for property owner
 */
export function PropertyIllustration({ size = 120, color = colors.primary }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Roof */}
      <Path d="M60 20L20 55H100L60 20Z" fill={color} />
      {/* House body */}
      <Rect x="25" y="55" width="70" height="45" fill={colors.secondary} />
      {/* Door */}
      <Rect x="50" y="70" width="20" height="30" rx="2" fill={color} />
      <Circle cx="65" cy="85" r="2" fill={colors.accent} />
      {/* Windows */}
      <Rect x="30" y="62" width="15" height="12" rx="2" fill={colors.background.primary} stroke={color} strokeWidth="2" />
      <Rect x="75" y="62" width="15" height="12" rx="2" fill={colors.background.primary} stroke={color} strokeWidth="2" />
      {/* Chimney */}
      <Rect x="75" y="30" width="12" height="20" fill={color} />
      {/* Smoke */}
      <Circle cx="81" cy="22" r="3" fill={colors.border.subtle} />
      <Circle cx="85" cy="17" r="2" fill={colors.border.subtle} />
    </Svg>
  );
}

/**
 * Checkmark/completed illustration
 */
export function CompletedIllustration({ size = 120, color = colors.status.success }: IllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Background circle */}
      <Circle cx="60" cy="60" r="45" fill={colors.secondary} />
      {/* Inner circle */}
      <Circle cx="60" cy="60" r="35" fill={color + '33'} />
      {/* Checkmark */}
      <Path
        d="M42 62L54 74L78 50"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparkles */}
      <Circle cx="95" cy="30" r="4" fill={colors.tertiary} />
      <Circle cx="25" cy="40" r="3" fill={colors.accent + '99'} />
      <Circle cx="100" cy="75" r="2" fill={colors.primarySoft} />
    </Svg>
  );
}
