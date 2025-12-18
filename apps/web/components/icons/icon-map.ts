/**
 * Vlossom Icon Map
 *
 * This file IS the Iconography Report in code form.
 * It maps semantic icon names to Phosphor icons as a bridge solution.
 *
 * When custom botanical icons are produced, only this file changes.
 * Components always import from '@/components/icons' - never directly from Phosphor.
 *
 * Icon Philosophy:
 * - Tier A (Navigation): Familiar in meaning, distinctive in form
 * - Tier B (State/Ritual): Botanical latitude, context provides meaning
 */

import {
  // Tier A: Navigation Icons
  House,
  CalendarDots,
  MagnifyingGlass,
  Wallet,
  User,
  Bell,
  Brain,
  MapPin,
  ArrowLeft,
  X,
  Plus,
  Gear,
  List,
  CaretLeft,
  CaretRight,
  CaretDown,
  CaretUp,
  Heart,
  Share,
  DotsThree,
  Check,
  Copy,
  PencilSimple,
  Trash,
  SignOut,
  Question,
  Info,

  // Tier B: State & Ritual Icons
  Grains,           // Used as "seed" - closest botanical match
  Plant,
  Leaf,
  Flower,
  FlowerLotus,
  Moon,
  Sun,
  Drop,
  Sparkle,
  CirclesThree,
  Spiral,
  Warning,
  WarningCircle,
  CheckCircle,
  XCircle,
  DotsThreeOutline,
  Clock,
  Timer,
  Star,
  Certificate,
  ShieldCheck,
  Lightning,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  Receipt,
  CreditCard,
  Scissors,
  Eye,
  EyeSlash,
  Lock,
  LockOpen,
  Image,
  Camera,
  ChatCircle,
  EnvelopeSimple,
  Phone,
  Link,
  Globe,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

// =============================================================================
// TIER A: NAVIGATION ICONS
// Familiar in meaning, distinctive in form
// =============================================================================

export const NavigationIcons = {
  // Primary Navigation
  home: House,
  calendar: CalendarDots,
  search: MagnifyingGlass,
  wallet: Wallet,
  profile: User,
  notifications: Bell,
  intelligence: Brain,
  location: MapPin,

  // Navigation Actions
  back: ArrowLeft,
  close: X,
  add: Plus,
  settings: Gear,
  menu: List,

  // Directional
  chevronLeft: CaretLeft,
  chevronRight: CaretRight,
  chevronDown: CaretDown,
  chevronUp: CaretUp,

  // Social Actions
  favorite: Heart,
  share: Share,
  more: DotsThree,

  // Utility Actions
  check: Check,
  copy: Copy,
  edit: PencilSimple,
  delete: Trash,
  logout: SignOut,
  help: Question,
  info: Info,
} as const;

// =============================================================================
// TIER B: STATE & RITUAL ICONS
// Botanical latitude, context provides meaning
// =============================================================================

export const StateIcons = {
  // Growth States (from Iconography Report)
  seed: Grains,             // Potential / Beginning (Grains = closest to seed)
  root: Plant,              // Grounding / Stability
  petal: Leaf,              // Active Care
  bloom: Flower,            // Readiness / Growth
  lotus: FlowerLotus,       // Full flourishing

  // Rest & Cycle States
  rest: Moon,               // Stillness / Night care
  active: Sun,              // Active / Day care
  moisture: Drop,           // Hydration state
  sparkle: Sparkle,         // Vitality / Health

  // Transition States
  settle: CirclesThree,     // Alignment / Harmony
  unfold: Spiral,           // Transition / Opening

  // Alert States
  calmError: Warning,       // Gentle Warning
  error: WarningCircle,     // Error state
  success: CheckCircle,     // Success state
  cancelled: XCircle,       // Cancelled / Rejected

  // Empty & Loading
  empty: DotsThreeOutline,  // Quiet Intent / Empty state

  // Time & Progress
  clock: Clock,
  timer: Timer,

  // Trust & Reputation
  star: Star,
  verified: Certificate,
  trusted: ShieldCheck,

  // Growth Indicators
  growing: TrendUp,
  declining: TrendDown,
  energy: Lightning,

  // Financial
  currency: CurrencyDollar,
  receipt: Receipt,
  payment: CreditCard,

  // Service
  scissors: Scissors,
  treatment: Sparkle,       // Using Sparkle for treatment

  // Visibility
  visible: Eye,
  hidden: EyeSlash,
  locked: Lock,
  unlocked: LockOpen,

  // Media
  image: Image,
  camera: Camera,

  // Communication
  chat: ChatCircle,
  email: EnvelopeSimple,
  phone: Phone,
  link: Link,
  web: Globe,
} as const;

// =============================================================================
// COMBINED ICON MAP
// =============================================================================

export const Icons = {
  ...NavigationIcons,
  ...StateIcons,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type NavigationIconName = keyof typeof NavigationIcons;
export type StateIconName = keyof typeof StateIcons;
export type IconName = keyof typeof Icons;

// Helper to check if an icon name is valid
export function isValidIconName(name: string): name is IconName {
  return name in Icons;
}

// Get icon component by name
export function getIconComponent(name: IconName): PhosphorIcon {
  return Icons[name];
}
