# 16 — UI Components & Design System

Design Tokens, Component Library, Interaction Patterns & Frontend Architecture for Vlossom

---

## 1. Purpose of This Document

This file defines the visual and component-level foundation of the Vlossom frontend.

It ensures that:

    UI designers create consistent layouts in Illustrator/Figma.

    Frontend developers build predictable, reusable React components.

    Claude Code can generate UI logic, animations, and component variations.

    The entire product maintains a premium, cultural, beauty-industry aesthetic.

This document bridges:

    Doc 15 — Frontend UX Flows

    Doc 05 — System Architecture Blueprint

    Doc 14 — Backend Architecture & APIs

    Doc 13 — Smart Contract Architecture

This is the source of truth for:

    design tokens

    colors, typography, spacing

    component primitives

    role-specific component variations

    complex components (booking card, wallet, notification card, chair card, service card)

    patterns for error handling, loading states, real-time updates

---

## 2. Symbolic UI Language (Brand as Living System)

The Vlossom visual identity is not decorative — it is a **meaning system**.

Every visual element must correspond to a system state, user state, or ritual state.

### 2.1 The Flower Iconography System

The Vlossom flower is not just a logo — it is a **carrier of meaning** that expresses user state.

**Source files:** `/design/brand/logos/`

#### Tier 1: Core Mark (Minimal)

    Usage: Navigation icons, favicons, status indicators, app chrome
    Visual: Single-stroke linework, minimal detail
    When: Always present as identity anchor

#### Tier 2: Narrative Flower (Illustrated)

    Usage: Landing pages, onboarding, achievement moments, campaigns
    Visual: Layered lines, botanical detail, center prominence
    When: Hero moments, emotional peaks, "you are growing" states

#### Tier 3: Botanical Fragments (Micro)

    Usage: Micro-icons, progress indicators, dividers, badges
    Visual: Isolated petals, stems, center dots
    When: Functional UI elements that need brand continuity

**Continuity rule:** All iconography should derive from the Vlossom flower linework style.

### 2.1.1 V6.0 Botanical Icon Library (IMPLEMENTED)

**Location:** `design/brand/icons/` (SVG files) and `apps/web/components/ui/vlossom-icons.tsx` (React components)

28 custom botanical SVG icons have been created following the Vlossom flower linework style.

**Navigation Icons:**
| Component | SVG Path | Meaning | Usage |
|-----------|----------|---------|-------|
| `VlossomHome` | `nav/home.svg` | Centered flower core | Home tab, belonging |
| `VlossomSearch` | `nav/search.svg` | Radiating petals | Discovery, search |
| `VlossomCalendar` | `nav/calendar.svg` | Petal ring | Calendar views, cycles |
| `VlossomWallet` | `nav/wallet.svg` | Contained bloom | Wallet, value |
| `VlossomProfile` | `nav/profile.svg` | Single flower mark | Profile, identity |
| `VlossomNotifications` | `nav/notifications.svg` | Pulsing bud | Alerts, awareness |

**State Icons:**
| Component | SVG Path | Meaning | Usage |
|-----------|----------|---------|-------|
| `VlossomHealthy` | `state/healthy.svg` | Full open flower | Balanced, healthy |
| `VlossomGrowing` | `state/growing.svg` | Petals opening | Active improvement |
| `VlossomResting` | `state/resting.svg` | Closed petals | Recovery phase |
| `VlossomNeedsCare` | `state/needs-care.svg` | Drooping, asymmetric | Attention required |
| `VlossomTransition` | `state/transition.svg` | Phase change | Session progress |

**Utility Icons:** `VlossomAdd`, `VlossomClose`, `VlossomFavorite`, `VlossomSettings`

**Usage:**
```tsx
import { VlossomHome, VlossomGrowing } from '@/components/ui/vlossom-icons';

// Standard usage (inherits currentColor)
<VlossomHome size={24} />

// Growth/celebration moment (uses accent orange)
<VlossomGrowing size={24} accent />
```

**Forbidden:** Lucide, Heroicons, Material, Feather, Font Awesome for navigation and state icons.

See `design/brand/icons/ICONOGRAPHY_REPORT.md` for full documentation.

### 2.2 Symbolic Meaning Map

    Petals → Stages of growth (petal count = progress level)
    Stem → Support system (platform, training, stylist relationship)
    Center → Community / Core health (health score, "heart" indicator)
    Closed flower → Rest state (recovery, pause, calm)
    Open flower → Active growth (completion, achievement, celebration)
    Petal opacity → Strength/clarity (full = strong, faded = developing)

### 2.3 State-Driven Iconography

Every icon should express state:

    Healthy → Full opacity, open form
    Needs attention → Partial opacity, subtle indicator
    Critical → Muted with gentle accent
    Growing → Animated unfold (subtle)
    Resting → Closed/settled form

### 2.4 Accent Color Governance (Orange #FF510D)

**Orange is sacred. It must be earned.**

Orange appears ONLY when:

    Growth is acknowledged
    A ritual is completed
    A transition is happening
    A celebration moment occurs

NEVER use orange for:

    Errors (use muted red)
    Warnings (use amber/yellow)
    System stress states
    Generic CTAs

**Max surface area per screen:** 5–8%

This keeps orange emotionally powerful, not decorative.

---

## 3. Vlossom Visual Identity (UI) Principles

The product UI must follow these principles:

### 3.1 Luxury Beauty Aesthetic

    clean minimalism

    warm atmosphere

    soft shadows

    muted modern colors

    real beauty-industry feel (never generic app aesthetic)

### 3.2 Calm, Predictable Interactions

    motion that feels natural (0.2–0.3s easing)

    no jarring modals

    reducing anxiety around payments & bookings

### 3.3 Web2.5 Familiarity

    looks and feels like a banking app / Uber

    hides blockchain complexity

    wallet-first flow is familiar and intuitive

### 3.4 High Trust, High Legibility

    clear states (pending / confirmed / approved)

    clear financial information

    reputation displayed with dignity

    professional stylist & salon presentation

### 3.5 Component-Driven Design

    one component = multiple variants for:

        customer

        stylist

        property owner

        LP

        admin

---

## 3. Design Tokens (The Foundation)

These tokens must be used everywhere. No ad-hoc styling.

### 3.1 Colors

#### Brand Colors (Light Mode)

    Primary Purple: #311E6B (deep purple - main CTAs, headers, brand anchor)

    Primary Soft: #ADA5C4 (muted purple - disabled states, subtle backgrounds)

    Secondary Cream: #EFE3D0 (cream - card backgrounds, soft containers)

    Accent Orange: #FF510D (orange - notifications, highlights, urgency)

    Tertiary Green: #A9D326 (green - success states, confirmations, growth)

    Black: #161616 (primary text, icons)

    White: #FFFFFF (page backgrounds, contrast text)

#### Brand Colors (Dark Mode)

    Background: #161616 (deep black - page background)

    Surface: #2A1F4D (muted purple - card backgrounds, containers)

    Surface Elevated: #3D2C6B (lighter purple - elevated cards, modals)

    Primary: #ADA5C4 (soft purple - CTAs, interactive elements)

    Primary Soft: #311E6B (deep purple - subtle backgrounds)

    Secondary: #EFE3D0 (cream - accent text, highlights)

    Accent: #FF510D (orange - notifications, highlights)

    Tertiary: #A9D326 (green - success states)

    Text Primary: #FFFFFF (main text)

    Text Secondary: #ADA5C4 (muted text)

#### Functional Colors

    Success: #A9D326 (tertiary green)

    Warning: #FF510D (accent orange)

    Error: #D0021B

    Info: #ADA5C4 (primary soft)

#### Neutral Palette

    Text Primary: #161616 (light mode) / #FFFFFF (dark mode)

    Text Secondary: #6F6F6F (light mode) / #ADA5C4 (dark mode)

    Divider: #E6E6E6 (light mode) / #3D2C6B (dark mode)

    Card Surface: #FFFFFF (light mode) / #2A1F4D (dark mode)

Card Elevation Shadow: low blur for premium look

### 3.2 Typography

Primary Font

    Inter or SF Pro (depending on platform)

    We will replace with a custom beauty-industry font later, but Inter keeps dev simple.

Type Scale

    H1 — 28–32px (light, elegant)

    H2 — 22–24px

    H3 — 18–20px

    Body — 15–17px

    Caption — 12–13px

Rules

    headers always light or medium weight

    numbers (prices, wallet amounts) use tabular numerals

    always left-aligned for readability

### 3.3 Spacing System

4pt grid:
    
    4 → 8 → 12 → 16 → 20 → 24 → 32 → 40 → 48 → 64

Everything snaps to this grid.

### 3.4 Shape & Radius

    Card Radius: 16px

    Button Radius: 12px

    Input Radius: 12px

    Profile Photos: 100% circle

### 3.5 Iconography

Style:

    outline + soft rounded corners

    consistent stroke width 1.5pt

Standard icons include:

    home

    search

    calendar

    wallet

    notifications

    user

    star

    map pin

    scissors (stylist)

    salon chair icon

    sparkles (beauty aesthetic)

---

## 4. Component Architecture Overview

Everything in the Vlossom UI derives from these layers:

### Atomic components (primitives)

    button

    input

    avatar

    tag / pill

    badge

    progress bar

### Molecules

    service card

    stylist card

    property card

    chair card

    booking card

    transaction row

    notification card

### Organisms

    wallet overview

    booking quote builder

    calendar component

    stylist dashboard panels

    salon dashboard panels

    LP dashboard panels

    admin moderation panel

### Screens

    (Defined in Doc 15 UX flows)

---

## 5. Core Components (Atomic)

Each atomic component must be reusable with standardized props.

### 5.1 Buttons

Variants:

    Primary (Primary Purple #311E6B background, white text)

    Secondary (outline, Primary Purple #311E6B text)

    Tertiary (text button, Primary Soft #ADA5C4)

    Accent (Accent Orange #FF510D background, white text)

    Danger (error red)

    Floating Action Button (FAB)

Props:

    type
    label
    icon
    size: sm | md | lg
    state: default | disabled | loading
    onPress()

### 5.2 Inputs

Types:

    text input

    masked (phone, OTP)

    dropdown

    datepicker

    time selector

    segmented control

Props:

    label
    placeholder
    value
    error
    helperText

### 5.3 Avatar

Shapes:

    round

    square (for salons)

States:

    online

    offline

    verified

### 5.4 Tags / Chips / Pills

Use cases:

    service categories

    location mode (mobile / fixed / hybrid)

    reputation level

    booking status

Styles:

    filled

    outlined

    soft background

### 5.5 Badge System

Badges display:

    referrals tier

    stylist top performer

    loyalty / rewards milestone

Badge shapes:

    circular

    ribbon

    star-based

---

## 6. Primary Interaction Components (Molecules)

These map to core Vlossom flows.

### 6.1 Service Card

Appears during service browsing.

Contains:

    service name

    base price range

    duration

    soft-range indicator (budget / average / premium)

    image

Variants:

    customer browsing

    stylist setup (editable)

### 6.2 Stylist Card

Shows stylist profile summary.

Elements:

    avatar

    name

    rating

    specializations

    badges (verified, top-rated, premium)

    quick actions (Follow, View Profile, Book Now)

Variant:

    "Traveling Stylist" badge when relevant

### 6.3 Property Card (Salon)

Contains:

    salon photo

    location

    amenities icons

    number of chairs

    rating

Variant:

    owner view (edit button)

    stylist view (rent chair CTA)

### 6.4 Chair Card

Contains:

    amenity tags

    price range

    availability status

    location within salon

### 6.5 Booking Card — The Most Important Component

This must be pixel-perfect and flexible.

States:

    Draft

    Pending Payment

    Awaiting Stylist Approval

    Awaiting Property Approval

    Confirmed

    In Progress

    Awaiting Completion Confirmation

    Completed

    Cancelled

    Disputed

Content includes:

    avatar of stylist

    service name

    date & time

    location type (mobile / salon)

    pricing summary

    status pill

    CTAs depending on role/state

Conditional CTAs:

    customer: Pay / Cancel / Message stylist

    stylist: Approve / Decline / Start appointment

    owner: Approve / Decline

    admin: view logs

### 6.6 Transaction Row

Used in Wallet → History.

Displays:

    icon (booking, P2P, LP, etc.)

    amount (fiat + token)

    counterparty

    timestamp

    status

Variants:

    incoming

    outgoing

    pending

### 6.7 Notification Card

(Matches Doc 15 – Notification Patterns)

Structure:

    avatar or system icon

    title

    body text

    timestamp

    status (unread indicator)

    CTA ("View booking")

Types:

    booking updates

    payout updates

    referral milestones

    LP yield

    follow / social updates

    chair availability

---

## 7. Advanced Components (Organisms)

These represent multi-section UI blocks.

---

### 7.1 Wallet Overview Component

Contains:

    balance card

    quick actions: Fund / Send / Receive / Withdraw

    tabs: Overview / DeFi / Rewards / History / Advanced

Internal components:

    DeFi mini-dashboard

    activity feed

    reward badge strip

### 7.2 Quote Builder Component

Used before booking is created.

Contains:

    selected service

    selected add-ons

    selected location

    stylist or property card

    duration estimate

    full breakdown of costs

    wallet balance indicator

    top-up CTA

### 7.3 Scheduling & Calendar Component

Must support:

    day/week/month views

    service blocks

    travel time blocks

    chair overlays

    conflict warnings

Variant behavior for:

    stylists

    property owners

### 7.4 Stylist Dashboard Panels

Includes:

    Earnings summary

    Today’s schedule

    Pending approvals

    Reputation snapshot

    Catalog management (services)

### 7.5 Property Owner Dashboard Panels

Includes:

    Chair availability calendar

    Stylist approvals

    Income summary

    Rule configuration (auto-approval, thresholds)

    Configurations for chairs, pricing, amenities, images, descriptions,etc. 

### 7.6 DeFi Dashboard

Contains:

    VLP summary

    pool list

    yield indicators

    referral tier progress

    stake/unstake modals

### 7.7 Admin Dashboard (High-Level)

Contains:

    booking dispute resolution

    user management

    config management

    treasury flows

---

## 8. Motion & Interaction Guidelines

Smooth, luxurious motion.

### 8.1 Durations

    micro transitions: 150ms

    modal transitions: 220–300ms

    tab transitions: 200ms

### 8.2 Easing

Use cubic-bezier:

    0.25, 0.1, 0.25, 1

(standard “ease”)

### 8.3 Hover & Press States

    soft elevation (shadow 2–6%)

    color darken/lighten by 5–8%

    active state: subtle scale to 0.98

### 8.4 Real-Time Updates

Visual cues for:

    booking status changes

    payout confirmations

    pool yield updates

Flash highlight color: Secondary Cream #EFE3D0 → fade.

---

## 9. Error, Empty, Loading, and Offline States

### 9.1 Error States

    friendly language

    suggestion action (Retry / Contact Support)

    avoid technical jargon

### 9.2 Loading

Skeleton loaders for:

    service cards

    stylist cards

    booking cards

    wallet balance

    notifications

### 9.3 Empty States

Must be uplifting, not sad.

Examples:

    “No notifications yet — your beauty journey is peaceful today.”

    “No bookings — ready for a fresh new look?”

Use minimal illustrations in brand style.

---

## 10. Theming Support (Dark Mode & Future-Proofing)

### 10.1 Supported Themes

The Vlossom design system supports:

    Light Mode (vlossom-light.json) — Default theme with cream backgrounds

    Dark Mode (vlossom-dark.json) — Deep purple/black backgrounds leveraging brand identity

### 10.2 Theme Switching

Users can toggle between themes via:

    Manual toggle button in settings/header

    System preference detection (prefers-color-scheme)

    Persistent user preference (stored in local storage or account settings)

### 10.3 Future Theme Extensions

The token architecture supports future additions:

    Regional themes (cultural customization)

    Seasonal themes (holiday campaigns)

    Brand-sponsored themes (partner campaigns)

    High-contrast accessibility themes

### 10.4 Platform Portability

The design system must be portable to:

    React Native (mobile apps)

    Web (primary platform)

    Desktop (Electron) if needed

Token files remain the same across platforms; only the consumption layer changes.

---

## 11. Component Library Structure (Technical)

/components
  /atoms
    Button.tsx
    Input.tsx
    Avatar.tsx
    Chip.tsx
    Badge.tsx

  /molecules
    ServiceCard.tsx
    StylistCard.tsx
    PropertyCard.tsx
    ChairCard.tsx
    BookingCard.tsx
    TransactionRow.tsx
    NotificationCard.tsx

  /organisms
    WalletOverview.tsx
    QuoteBuilder.tsx
    Calendar.tsx
    StylistDashboard.tsx
    OwnerDashboard.tsx
    LPDashboard.tsx
    AdminPanel.tsx

Each component comes with variants controlled by props.

## 12. Summary

This Design System:

    formalizes the aesthetic + technical foundation of Vlossom

    prepares designers and engineers to scale quickly

    supports all core actor roles

    enables Web2.5 familiarity with Web3 reliability

    aligns with smart contract flows, backend APIs, and UX logic

This is the canonical reference for all UI work going forward.

---

# Appendix A — Brand Theme Layer & Claude Code Implementation Guide

How to Wire the Design System into the Frontend

---

## A.1 Purpose of This Appendix

This appendix is written directly for Claude Code and frontend engineers.

It explains how to:

    Implement the Vlossom design system as tokens, not hard-coded styles

    Keep the UI brand-neutral now, but easy to reskin later

    Make it trivial to swap vlossom-default → vlossom-brand-v1 when the visual identity is ready

The goal:

    Build the app once, skin it many times.
    Booking flows, wallet UX, and components remain the same; only theme config changes.

---

## A.2 Theme Tokens & File Structure

We separate design tokens from components and from brand assets.

Recommended structure:

/design
  /tokens
    vlossom-light.json          # Light mode brand theme
    vlossom-dark.json           # Dark mode brand theme
  /brand
    /logos                      # Brand logos and lockups
    /identity                   # Brand identity sheets
  /icons
    stylist-default.svg
    salon-default.svg
    wallet-default.svg
    ...
  /illustrations
    ...
/src
  /theme
    index.ts                    # BrandThemeProvider + hook
    tokens.ts                   # loads & normalizes JSON tokens
  /components
    ui/
      Button.tsx
      Card.tsx
      Tag.tsx
      Avatar.tsx
    vlossom/
      ServiceCard.tsx
      BookingCard.tsx
      WalletOverview.tsx
      NotificationCard.tsx

Key idea:

JSON token files are the single source of truth for:

    colors

    typography

    spacing

    radius

    shadows

UI components never use raw hex values or arbitrary spacings.

---

## A.3 Token Shape (What Claude Should Expect)

Example: vlossom-light.json (Light Mode Brand Theme):

{
  "color": {
    "background": "#FFFFFF",
    "surface": "#EFE3D0",
    "surfaceElevated": "#FFFFFF",
    "primary": "#311E6B",
    "primarySoft": "#ADA5C4",
    "secondary": "#EFE3D0",
    "accent": "#FF510D",
    "tertiary": "#A9D326",
    "success": "#A9D326",
    "warning": "#FF510D",
    "error": "#D0021B",
    "textPrimary": "#161616",
    "textSecondary": "#6F6F6F",
    "textInverse": "#FFFFFF",
    "borderSubtle": "#E6E6E6",
    "divider": "#E6E6E6"
  },
  "font": {
    "primary": "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "display": "'Playfair Display', 'Times New Roman', serif"
  },
  "radius": {
    "sm": 6,
    "md": 10,
    "lg": 16,
    "xl": 24,
    "pill": 999
  },
  "shadow": {
    "card": "0 12px 30px rgba(0,0,0,0.06)",
    "soft": "0 4px 16px rgba(0,0,0,0.04)"
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 24,
    "xxl": 32
  }
}

Example: vlossom-dark.json (Dark Mode Brand Theme):

{
  "color": {
    "background": "#161616",
    "surface": "#2A1F4D",
    "surfaceElevated": "#3D2C6B",
    "primary": "#ADA5C4",
    "primarySoft": "#311E6B",
    "secondary": "#EFE3D0",
    "accent": "#FF510D",
    "tertiary": "#A9D326",
    "success": "#A9D326",
    "warning": "#FF510D",
    "error": "#FF6B6B",
    "textPrimary": "#FFFFFF",
    "textSecondary": "#ADA5C4",
    "textInverse": "#161616",
    "borderSubtle": "#3D2C6B",
    "divider": "#3D2C6B"
  },
  "font": {
    "primary": "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "display": "'Playfair Display', 'Times New Roman', serif"
  },
  "radius": {
    "sm": 6,
    "md": 10,
    "lg": 16,
    "xl": 24,
    "pill": 999
  },
  "shadow": {
    "card": "0 12px 30px rgba(0,0,0,0.25)",
    "soft": "0 4px 16px rgba(0,0,0,0.15)"
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 24,
    "xxl": 32
  }
}

The vlossom-light.json and vlossom-dark.json files share the same token structure, enabling seamless theme switching.

---

## A.4 Theme Provider & Hook (How Components Use Tokens)

Claude Code should create a BrandThemeProvider and a useBrandTheme() hook.

Pseudo-implementation:

// src/theme/tokens.ts
import lightTokens from '@/design/tokens/vlossom-light.json';
import darkTokens from '@/design/tokens/vlossom-dark.json';

export type BrandTokens = typeof lightTokens;
export type ThemeMode = 'light' | 'dark';

export const loadTokens = (mode: ThemeMode = 'light'): BrandTokens => {
  // Switch between light and dark themes
  // Can be extended to support system preference or user preference
  return mode === 'dark' ? darkTokens : lightTokens;
};

// src/theme/index.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadTokens, BrandTokens, ThemeMode } from './tokens';

interface ThemeContextValue {
  tokens: BrandTokens;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const BrandThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}> = ({ children, defaultMode = 'light' }) => {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [tokens, setTokens] = useState<BrandTokens>(loadTokens(defaultMode));

  useEffect(() => {
    setTokens(loadTokens(mode));
  }, [mode]);

  const toggleMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ tokens, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useBrandTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useBrandTheme must be used inside BrandThemeProvider');
  return ctx;
};

Usage inside components:

import { useBrandTheme } from '@/theme';

export const ServiceCard: React.FC<ServiceCardProps> = (props) => {
  const { tokens } = useBrandTheme();

  return (
    <div
      style={{
        borderRadius: tokens.radius.lg,
        boxShadow: tokens.shadow.card,
        backgroundColor: tokens.color.surface
      }}
      className="p-4 flex flex-col gap-3"
    >
      {/* ... */}
    </div>
  );
};

// Theme toggle component example
export const ThemeToggle: React.FC = () => {
  const { mode, toggleMode, tokens } = useBrandTheme();

  return (
    <button
      onClick={toggleMode}
      style={{
        backgroundColor: tokens.color.primary,
        color: tokens.color.textInverse,
        borderRadius: tokens.radius.md
      }}
    >
      {mode === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </button>
  );
};

Rule for Claude: no raw #hex colors inside components.
Always go through tokens.color.*, tokens.radius.*, tokens.shadow.*, etc.

---

## A.5 Mapping Tokens to Tailwind / CSS Variables (Optional Layer)

If we use Tailwind:

    Claude can generate a Tailwind config that reads from the token file, or

    Define a small set of CSS variables mapped from tokens.

Example (CSS variables approach):

// In BrandThemeProvider
const rootStyle: React.CSSProperties = {
  '--color-primary': tokens.color.primary,
  '--color-surface': tokens.color.surface,
  '--radius-card': `${tokens.radius.lg}px`
};

return (
  <ThemeContext.Provider value={tokens}>
    <div style={rootStyle}>{children}</div>
  </ThemeContext.Provider>
);

Then components can mix:

    Tokens via hook for JS logic (e.g. dynamic styling)

    CSS variables via Tailwind or className for layout

Example:

<div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-card">
  {/* content */}
</div>

---

## A.6 Icon & Illustration Mapping

Icons should also be theme-aware.

Pattern:

// src/theme/icons.ts
import stylistDefault from '@/design/icons/stylist-default.svg';
import salonDefault from '@/design/icons/salon-default.svg';
// later: brand v1 icons can override these imports

export const iconMap = {
  stylist: stylistDefault,
  salon: salonDefault,
  wallet: stylistDefault // placeholder
};

Usage:

import { iconMap } from '@/theme/icons';

export const StylistBadge = () => (
  <img src={iconMap.stylist} alt="Stylist" className="w-5 h-5" />
);

When brand identity is ready, we simply:

    Swap the SVG files in /design/icons

    Or point iconMap to new SVGs

No component logic has to change.

---

## A.7 Designer Workflow (Future You)

When the Vlossom brand identity is ready:

    Create a new token file

        /design/tokens/vlossom-brand-v1.json

        Same keys, new values (colors, fonts, shadows, etc.)

    Update loadTokens() in tokens.ts

        Point to the new file (or choose based on env).

    Swap icons & illustrations

        Replace default SVGs with branded versions, or

        Add a new icon map and flip a single import.

    Optionally, add brand-specific hero components

        e.g. VlossomHeroGradient, VlossomBrandRibbon, etc.

Everything else (Flows in Docs 15, 17–29) stays intact.

---

## A.8 Prompting Claude Code (Implementation Guidance)

When you ask Claude Code to generate frontend code, you can prompt it like:

    “Use the BrandThemeProvider and useBrandTheme hook from src/theme.
    Do not hard-code colors or radii; instead use theme.color.* and theme.radius.*.
    Assume tokens come from /design/tokens/vlossom-default.json.
    Icons should be imported from @/theme/icons rather than direct SVG paths.”

This keeps AI-generated components aligned with the design system, not one-off styles.

--- 

## A.9 Summary

    The Brand Theme Layer makes Vlossom skinnable.

    All visuals live in tokens + icons + illustrations.

    Components consume tokens via a Theme Provider & hook.

    Claude Code and engineers can safely build the entire app now.

    Later, Vlossom visual identity can be plugged in by swapping token + icon config.

---

# UI Components & Design System v1.2

Brand-Ready, Token-Driven Interface Architecture for Vlossom.

---

## 1. Purpose of This Document

This document defines the structural design system for the Vlossom platform.

It specifies:

    how UI components are composed

    how visual decisions are abstracted into tokens

    how brand identity can evolve independently of logic

    how designers and engineers collaborate without friction

This document deliberately avoids final aesthetic decisions.
Instead, it ensures that brand identity can be injected, swapped, and refined without rewriting components or flows.

It serves as the bridge between:

    UX logic (Document 15)

    brand identity system (in progress)

    frontend implementation (React / Tailwind / CSS-in-JS)

    Claude Code agent workflows

---

## 2. Design System Philosophy

### 2.1 Separation of Concerns

Vlossom’s UI system separates:

    Structure → what a component is and does

    Theme → how it looks and feels

No component should ever depend on:

    hard-coded colors

    hard-coded fonts

    brand-specific imagery

This ensures:

    brand evolution without regressions

    rapid experimentation

    long-term maintainability

---

## 3. Theme Token Architecture

All brand expression lives inside theme tokens, not components.

### 3.1 Theme Token Files

Theme tokens are defined in versioned JSON (or TS) files:

/design/tokens
  ├─ vlossom-light.json    (Light mode brand theme)
  └─ vlossom-dark.json     (Dark mode brand theme)

/design/brand
  ├─ /logos                (Brand logos and lockups)
  └─ /identity             (Brand identity sheets)

Switching themes = switching token file via ThemeProvider.

### 3.2 Core Token Categories

#### Color Tokens

color.background.primary
color.background.secondary
color.text.primary
color.text.muted
color.action.primary
color.action.secondary
color.accent
color.border.subtle
color.status.success
color.status.warning
color.status.error

Components never reference hex values directly

#### Typography Tokens

font.family.primary
font.family.display
font.size.body
font.size.label
font.size.heading.sm
font.size.heading.md
font.size.heading.lg
font.weight.regular
font.weight.medium
font.weight.bold
line.height.default

This allows:

    serif → sans changes

    editorial vs utilitarian pivots

    accessibility scaling

#### Spacing & Rhythm Tokens

space.xs
space.sm
space.md
space.lg
space.xl
radius.sm
radius.md
radius.lg

Enables:

    calm, breathable layouts

    “growth from rest” pacing

    consistent rhythm across screens

#### Motion Tokens

motion.fast
motion.medium
motion.slow
motion.ease.standard
motion.ease.gentle

Used for:

    state transitions

    loading feedback

    modal entrances

Motion should never feel urgent.

---

## 4. Component Taxonomy

Components are grouped by intent, not visuals.

### 4.1 Primitive Components

Foundational building blocks:

    Button

    Text

    Icon

    Divider

    Avatar

    Badge

These consume tokens directly.

### 4.2 Composite Components

Built from primitives:

    BookingCard

    WalletBalanceCard

    NotificationCard

    ReviewItem

    CalendarBlock

    StatTile

They define layout + behavior, not style.

### 4.3 Layout Components

Structural scaffolding:

    PageShell

    Section

    Stack

    Grid

    Modal

    Drawer

Used to enforce consistency across flows.

---

## 5. Brand-Safe Component Rules

All components must obey:

No hard-coded copy (text comes from copy layer)

    No embedded brand metaphors

    No emotional language inside components themselves

Emotion is expressed via:

    copy

    spacing

    motion

    hierarchy

Not via logic.

---

## 6. Iconography System

Icons are referenced semantically:

icon.stylist
icon.salon
icon.wallet
icon.booking
icon.approval
icon.location

Actual SVG assets are resolved via the theme layer.

This allows:

    outline → filled swaps

    illustrative → minimal transitions

    cultural refinement over time

---

## 7. Accessibility & Calm-First Design

Vlossom prioritizes emotional accessibility, not just technical compliance.

Design system requirements:

    minimum tap target sizes

    readable contrast ratios

    non-alarming color usage

    no flashing or aggressive motion

    clear focus states

Accessibility is treated as care, not compliance.

---

## 8. Designer–Developer Workflow

### 8.1 Designer Responsibilities

    Define brand tokens

    Design component variants using token references

    Never “design in hex”

### 8.2 Developer Responsibilities

    Enforce token usage

    Reject hard-coded styles

    Keep components stateless where possible

### 8.3 Claude Code Role

Claude Code agents:

    consume tokens as constants

    generate components using semantic props

    never invent visual styles

---

## 9. Future-Ready Extensions

This system supports future additions without refactor:

    dark mode

    seasonal themes

    regional themes

    campaign skins

    accessibility presets

All via token swaps.

---

## 10. Summary

The Vlossom UI system is:

    brand-agnostic by default

    emotionally intentional by design

    structurally consistent

    future-proof

This document ensures that when the Vlossom brand identity is finalized, the product will receive it effortlessly — like water filling a well-prepared vessel.
















