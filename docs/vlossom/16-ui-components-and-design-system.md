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

## 2. Vlossom Visual Identity (UI) Principles

Even before brand guidelines become a separate doc, the product UI must follow these principles:

### 2.1 Luxury Beauty Aesthetic

    clean minimalism

    warm atmosphere

    soft shadows

    muted modern colors

    real beauty-industry feel (never generic app aesthetic)

2.2 Calm, Predictable Interactions

    motion that feels natural (0.2–0.3s easing)

    no jarring modals

    reducing anxiety around payments & bookings

2.3 Web2.5 Familiarity

    looks and feels like a banking app / Uber

    hides blockchain complexity

    wallet-first flow is familiar and intuitive

2.4 High Trust, High Legibility

    clear states (pending / confirmed / approved)

    clear financial information

    reputation displayed with dignity

    professional stylist & salon presentation

2.5 Component-Driven Design

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

Brand Colors

    Vlossom Rose: #EA526F (warm, emotional, premium)

    Deep Clay: #A33E55

    Black Orchid: #121212

    Soft Linen: #F7F3F0 (background)

    White: #FFFFFF

Functional Colors

    Success: #3BB273

    Warning: #F5A623

    Error: #D0021B

    Info: #4A90E2

Neutral Palette

    Text Primary: #1A1A1A

    Text Secondary: #6F6F6F

    Divider: #E6E6E6

    Card Surface: #FFFFFF

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

    Primary (Vlossom Rose background, white text)

    Secondary (outline, black orchid text)

    Tertiary (text button)

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

Flash highlight color: Soft Linen → fade.

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

## 10. Theming Support (Future-Proofing)

Support theme override:

    light / dark mode

    regional themes (future)

    brand-sponsored themes (future)

The design system must be portable to:

    React Native

    Web

    Desktop (Electron) if needed

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
    vlossom-default.json        # MVP neutral theme
    vlossom-brand-v1.json       # future: full brand identity
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

Example: vlossom-default.json (MVP neutral theme):

{
  "color": {
    "background": "#FFFFFF",
    "surface": "#F9F6F4",
    "primary": "#EA526F",
    "primarySoft": "#FCE7EC",
    "accent": "#F6B8A8",
    "success": "#28A745",
    "warning": "#FFC107",
    "error": "#DC3545",
    "textPrimary": "#1F2226",
    "textSecondary": "#5F6470",
    "borderSubtle": "#E5E1DC"
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

Later, vlossom-brand-v1.json will keep the same keys, but with updated values that match the final brand identity.

---

## A.4 Theme Provider & Hook (How Components Use Tokens)

Claude Code should create a BrandThemeProvider and a useBrandTheme() hook.

Pseudo-implementation:

// src/theme/tokens.ts
import defaultTokens from '@/design/tokens/vlossom-default.json';

export type BrandTokens = typeof defaultTokens;

export const loadTokens = (): BrandTokens => {
  // In MVP: always return default tokens
  // Later: switch based on env, A/B, or remote config
  return defaultTokens;
};

// src/theme/index.tsx
import React, { createContext, useContext } from 'react';
import { loadTokens, BrandTokens } from './tokens';

const ThemeContext = createContext<BrandTokens | null>(null);

export const BrandThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tokens = loadTokens();
  return <ThemeContext.Provider value={tokens}>{children}</ThemeContext.Provider>;
};

export const useBrandTheme = (): BrandTokens => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useBrandTheme must be used inside BrandThemeProvider');
  return ctx;
};

Usage inside components:

import { useBrandTheme } from '@/theme';

export const ServiceCard: React.FC<ServiceCardProps> = (props) => {
  const theme = useBrandTheme();

  return (
    <div
      style={{
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.card,
        backgroundColor: theme.color.surface
      }}
      className="p-4 flex flex-col gap-3"
    >
      {/* ... */}
    </div>
  );
};

Rule for Claude: no raw #hex colors inside components.
Always go through theme.color.*, theme.radius.*, theme.shadow.*, etc.

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

/theme
  ├─ vlossom-default.json   (MVP neutral theme)
  ├─ vlossom-brand-v1.json  (future brand system)
  └─ vlossom-dark.json      (future)

Switching brand identity = switching theme file.

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
















