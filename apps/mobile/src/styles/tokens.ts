/**
 * Vlossom Design Tokens (V6.0 Mobile)
 *
 * Shared design tokens for React Native
 * Source: docs/vlossom/16-ui-components-and-design-system.md
 */

// =============================================================================
// Colors
// =============================================================================

export const colors = {
  // Brand Colors
  primary: '#311E6B',
  primarySoft: '#ADA5C4',
  secondary: '#EFE3D0',
  accent: '#FF510D', // SACRED - growth/celebration only
  tertiary: '#A9D326',

  // Neutrals
  black: '#161616',
  white: '#FFFFFF',

  // Brand Aliases
  brand: {
    purple: '#311E6B',
    orange: '#FF510D',
    cream: '#EFE3D0',
    green: '#A9D326',
    rose: '#311E6B', // Maps to primary purple
    roseLight: '#ADA5C4', // Lighter shade of rose/purple
    clay: '#241552', // Darker shade for hover
  },

  // Accent variants
  accentGold: '#D4AF37',
  accentOrange: '#FF510D',

  // Background
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F7F4',
    tertiary: '#EFE3D0',
  },

  // Text
  text: {
    primary: '#161616',
    secondary: '#6F6F6F',
    tertiary: '#9CA3AF',
    muted: '#B8B8B8',
    inverse: '#FFFFFF',
    disabled: '#B8B8B8',
  },

  // Status
  status: {
    success: '#A9D326',
    successLight: '#A9D32620', // 20% opacity success
    warning: '#F59E0B', // NOT orange - use amber for warnings
    warningLight: '#F59E0B20',
    error: '#D0021B',
    errorLight: '#D0021B20',
    info: '#ADA5C4',
    infoLight: '#ADA5C420',
  },

  // Surface
  surface: {
    light: '#EFE3D0',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },

  // Border
  border: {
    default: '#E5E5E5',
    subtle: '#F0F0F0',
    light: '#F5F5F5',
  },

  // Dark Mode
  dark: {
    background: {
      primary: '#161616',
      secondary: '#1F1F1F',
      tertiary: '#2A1F4D',
    },
    surface: {
      card: '#2A1F4D',
      elevated: '#3D2C6B',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#ADA5C4',
      tertiary: '#8B8B8B',
    },
    border: {
      default: '#3D3D3D',
      subtle: '#2A2A2A',
    },
  },
} as const;

// =============================================================================
// Typography
// =============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: 'Inter',
    display: 'PlayfairDisplay',
    mono: 'SpaceMono',
    // Weight-specific font names for React Native
    regular: 'Inter',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },

  // Font Sizes
  fontSize: {
    display: 40,
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    xl: 20,
    xxl: 24,
    lg: 18,
    body: 16,
    base: 16,
    bodySmall: 14,
    sm: 14,
    caption: 12,
    xs: 12,
    button: 14,
    label: 12,
  },

  // Line Heights
  lineHeight: {
    display: 48, // 1.2
    h1: 40, // 1.25
    h2: 31, // 1.3
    h3: 28, // 1.4
    body: 24, // 1.5
    bodySmall: 21, // 1.5
    caption: 17, // 1.4
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// =============================================================================
// Spacing (4pt grid)
// =============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 96,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// =============================================================================
// Border Radius
// =============================================================================

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
  full: 999, // Alias for pill
  circle: 9999,
} as const;

// Alias for convenience
export const radius = borderRadius;

// =============================================================================
// Shadows
// =============================================================================

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },
} as const;

// =============================================================================
// Motion / Animation
// =============================================================================

export const motion = {
  duration: {
    instant: 100,
    micro: 150,
    nav: 200,
    standard: 300,
    growth: 400,
    dramatic: 500,
  },
  easing: {
    // Converted for React Native Reanimated
    unfold: { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 },
    breathe: { x1: 0.4, y1: 0, x2: 0.6, y2: 1 },
    settle: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
    standard: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
  },
} as const;

// =============================================================================
// Breakpoints (for responsive design)
// =============================================================================

export const breakpoints = {
  sm: 375, // iPhone SE
  md: 390, // iPhone 14
  lg: 428, // iPhone 14 Pro Max
  tablet: 768, // iPad
} as const;

// =============================================================================
// Z-Index
// =============================================================================

export const zIndex = {
  base: 0,
  card: 10,
  header: 100,
  modal: 200,
  overlay: 300,
  toast: 400,
} as const;

// =============================================================================
// Touch Targets
// =============================================================================

export const touchTarget = {
  min: 44, // WCAG minimum
  button: 48,
  nav: 56,
} as const;

// =============================================================================
// Theme Object
// =============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  motion,
  breakpoints,
  zIndex,
  touchTarget,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Typography = typeof typography;
