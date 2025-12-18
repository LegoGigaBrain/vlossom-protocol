# Vlossom Styling Specification

> **Version**: 6.4.0
> **Purpose**: Definitive styling reference for frontend implementation
> **Audience**: Gemini, designers, developers
> **Last Updated**: December 18, 2025

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Shadows & Elevation](#5-shadows--elevation)
6. [Border Radius](#6-border-radius)
7. [Motion & Animation](#7-motion--animation)
8. [Iconography](#8-iconography)
9. [Component Specifications](#9-component-specifications)
10. [Responsive Behavior](#10-responsive-behavior)
11. [Accessibility](#11-accessibility)
12. [Reference Examples](#12-reference-examples)

---

## 1. Design Philosophy

### Core Principles

**Calm Technology**
- Interfaces should feel restful, not demanding
- Reduce cognitive load through visual hierarchy
- Premium feel through restraint, not decoration

**Botanical Metaphor**
- Growth, not gamification
- Rituals, not tasks
- Patience, not urgency

**Mobile-First Canonical**
- Mobile is the primary experience
- Desktop expands context, not changes meaning
- Touch targets (44px min) even on desktop

**Data as Narrative**
- Context before evidence
- Serif headlines, sans-serif data
- Statistics tell stories, not just numbers

### Visual Personality

| Attribute | Expression |
|-----------|------------|
| **Tone** | Encouraging, not pushy |
| **Pace** | Patient, not urgent |
| **Detail** | Refined, not cluttered |
| **Color** | Warm, not sterile |
| **Motion** | Organic, not mechanical |

### Reference Aesthetic Blend

| Reference | What We Take |
|-----------|--------------|
| **Hyperliquid** | Data density done right, tabular precision, monospace for values |
| **Wealthsimple** | Calm financial UI, serif + sans pairing, gentle transitions |
| **Linear** | Interaction polish, keyboard shortcuts, micro-animations |
| **Headspace** | Calming color palette, organic shapes, breathing animations |
| **Stripe Press** | Typography excellence, editorial quality, visual hierarchy |

---

## 2. Color System

### 2.1 Primary Palette

```css
/* Brand Colors - NEVER modify these hex values */
--brand-purple:    #311E6B;  /* Primary - CTAs, headers, links */
--brand-cream:     #EFE3D0;  /* Secondary - cards, surfaces */
--brand-orange:    #FF510D;  /* SACRED - growth moments ONLY */
--brand-green:     #A9D326;  /* Success, confirmations */
--brand-soft:      #ADA5C4;  /* Soft purple - secondary text */
```

### 2.2 Semantic Color Tokens

#### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `background.primary` | `#FFFFFF` | Page background |
| `background.secondary` | `#EFE3D0` | Cream sections |
| `background.tertiary` | `#F5F5F5` | Subtle areas |
| `surface.default` | `#EFE3D0` | Card backgrounds |
| `surface.elevated` | `#FFFFFF` | Floating elements |
| `primary.default` | `#311E6B` | Brand purple |
| `primary.soft` | `#ADA5C4` | Soft purple |
| `accent.default` | `#FF510D` | Growth/celebration ONLY |
| `text.primary` | `#161616` | Headings, body |
| `text.secondary` | `#6F6F6F` | Captions, labels |
| `text.muted` | `#9A9A9A` | Placeholders |
| `text.inverse` | `#FFFFFF` | On dark backgrounds |
| `border.default` | `#E6E6E6` | Standard borders |
| `border.subtle` | `#F0F0F0` | Delicate separators |

#### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `background.primary` | `#161616` | Page background |
| `surface.default` | `#2A1F4D` | Card backgrounds |
| `surface.elevated` | `#3D2C6B` | Floating elements |
| `primary.default` | `#ADA5C4` | Inverted for readability |
| `text.primary` | `#FFFFFF` | Headings, body |
| `text.secondary` | `#ADA5C4` | Captions, labels |
| `text.muted` | `#7A7290` | Placeholders |
| `border.default` | `#3D2C6B` | Standard borders |

### 2.3 Status Colors

| Status | Light Mode | Dark Mode | Usage |
|--------|------------|-----------|-------|
| `success` | `#A9D326` | `#A9D326` | Confirmations, completions |
| `warning` | `#F59E0B` | `#F59E0B` | Caution, attention needed |
| `error` | `#D0021B` | `#FF6B6B` | Errors, destructive actions |
| `info` | `#ADA5C4` | `#ADA5C4` | Informational messages |

### 2.4 Orange Color Governance (SACRED)

**`#FF510D` is reserved ONLY for:**
- Growth milestone celebrations
- Ritual completion moments
- Achievement unlocks
- Progress peak states
- `accent` icon variants

**NEVER use orange for:**
- Errors (use `status.error`)
- Warnings (use `status.warning`)
- CTAs (use `primary.default`)
- General UI elements

**Surface Area Rule**: Orange should occupy < 8% of any screen

### 2.5 Color Application Examples

```tsx
// Correct usage
<button className="bg-primary text-white">Book Now</button>
<Badge variant="success">Confirmed</Badge>
<span className="text-text-secondary">Last updated 2h ago</span>

// WRONG - Never do this
<button className="bg-accent text-white">Book Now</button>  // Orange is not for CTAs
<Badge className="bg-orange-500">Error</Badge>  // Orange is not for errors
```

---

## 3. Typography

### 3.1 Font Families

| Token | Font | Usage |
|-------|------|-------|
| `font-display` | Playfair Display | Headlines, editorial moments |
| `font-sans` | Inter | Body, UI, navigation, labels |
| `font-mono` | SF Mono, Fira Code | Values, wallet addresses, code |

### 3.2 Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-h1` | 28px | 1.3 | 300 | Page titles (display font) |
| `text-h2` | 22px | 1.3 | 400 | Section headers (display font) |
| `text-h3` | 18px | 1.4 | 400 | Card titles (sans) |
| `text-body` | 15px | 1.6 | 400 | Body text (sans) |
| `text-caption` | 12px | 1.4 | 400 | Labels, timestamps (sans) |

### 3.3 Font Pairing Rules

```
HEADLINE: Playfair Display (serif, display font)
├── Page titles
├── Section headers
├── Editorial moments
└── First line of narrative context

BODY: Inter (sans-serif, system font)
├── Navigation labels
├── Button text
├── Form labels
├── Card content
├── Descriptions
└── All UI elements

VALUES: SF Mono (monospace)
├── Wallet addresses
├── Transaction amounts
├── Timestamps
├── Numeric data
└── Progress percentages
```

### 3.4 Typography Examples

```tsx
// Page title - Playfair Display
<h1 className="font-display text-h1 text-text-primary">
  Your Hair Journey
</h1>

// Section header - Playfair Display
<h2 className="font-display text-h2 text-text-primary">
  Upcoming Rituals
</h2>

// Card title - Inter (default)
<h3 className="text-h3 font-semibold text-text-primary">
  Wash Day Ritual
</h3>

// Body text - Inter
<p className="text-body text-text-secondary">
  Your next ritual is scheduled for tomorrow morning.
</p>

// Caption - Inter
<span className="text-caption text-text-muted">
  Last updated 2 hours ago
</span>

// Wallet amount - Monospace
<span className="font-mono text-body tabular-nums">
  R 1,234.56
</span>
```

### 3.5 Data as Narrative Pattern

```tsx
// Correct: Context first (serif), then evidence (mono)
<div className="flex flex-col gap-1">
  <span className="font-display text-h3">Your Balance</span>
  <span className="font-mono text-h2 tabular-nums">R 12,450.00</span>
</div>

// Correct: Narrative before numbers
<div className="flex flex-col gap-1">
  <span className="font-display text-body text-text-secondary">
    You've grown 23% this month
  </span>
  <div className="flex items-baseline gap-2">
    <span className="font-mono text-h1 tabular-nums">23%</span>
    <Icon name="growing" className="text-status-success" />
  </div>
</div>
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (4px Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Micro gaps, icon padding |
| `sm` | 8px | Tight spacing, inline elements |
| `md` | 12px | Default gap, list items |
| `lg` | 16px | Section gaps, card padding |
| `xl` | 24px | Major sections |
| `2xl` | 32px | Page sections |
| `3xl` | 40px | Hero spacing |
| `4xl` | 48px | Major dividers |
| `5xl` | 64px | Page margins |

### 4.2 Component Spacing Patterns

```css
/* Cards */
.card {
  padding: 24px;        /* p-6 */
  gap: 16px;           /* gap-4 between children */
}

/* Dialogs/Modals */
.dialog {
  padding: 32px;        /* p-8 */
  gap: 24px;           /* gap-6 between sections */
}

/* Inputs */
.input {
  padding: 10px 16px;   /* py-2.5 px-4 */
  height: 44px;         /* h-11 minimum touch target */
}

/* Buttons */
.button {
  padding: 10px 24px;   /* py-2.5 px-6 */
  height: 44px;         /* h-11 minimum touch target */
}

/* List Items */
.list-item {
  padding: 12px 16px;   /* py-3 px-4 */
  gap: 12px;           /* gap-3 between elements */
}
```

### 4.3 Layout Containers

```css
/* Mobile-first containers */
.container-mobile {
  padding-left: 16px;   /* px-4 */
  padding-right: 16px;
  max-width: 100%;
}

/* Tablet+ containers */
@media (min-width: 768px) {
  .container-tablet {
    padding-left: 24px;  /* px-6 */
    padding-right: 24px;
    max-width: 768px;
    margin: 0 auto;
  }
}

/* Desktop containers */
@media (min-width: 1024px) {
  .container-desktop {
    padding-left: 32px;  /* px-8 */
    padding-right: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### 4.4 Safe Areas (Mobile)

```css
/* For devices with notches/home indicators */
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }
.pt-safe { padding-top: env(safe-area-inset-top); }
.mb-safe { margin-bottom: env(safe-area-inset-bottom); }
```

---

## 5. Shadows & Elevation

### 5.1 Shadow Scale

| Level | Token | Value (Light) | Usage |
|-------|-------|---------------|-------|
| 0 | `shadow-none` | none | Flat elements |
| 1 | `shadow-vlossom-soft` | `0 4px 16px rgba(0,0,0,0.04)` | Subtle lift |
| 2 | `shadow-vlossom` | `0 12px 30px rgba(0,0,0,0.06)` | Cards, default |
| 3 | `shadow-vlossom-elevated` | `0 20px 40px rgba(0,0,0,0.08)` | Popovers, dropdowns |
| 4 | `shadow-vlossom-modal` | `0 24px 48px rgba(0,0,0,0.12)` | Modals, sheets |

### 5.2 Dark Mode Shadows

In dark mode, shadows need higher opacity to be visible:

| Level | Value (Dark) |
|-------|--------------|
| 1 | `0 4px 16px rgba(0,0,0,0.15)` |
| 2 | `0 12px 30px rgba(0,0,0,0.25)` |
| 3 | `0 20px 40px rgba(0,0,0,0.35)` |
| 4 | `0 24px 48px rgba(0,0,0,0.45)` |

### 5.3 Elevation Hierarchy

```
Level 0: Page background (no shadow)
├── Level 1: Subtle cards, passive containers
│   └── Cream surface cards, list items
├── Level 2: Active cards, interactive elements
│   └── Booking cards, action cards
├── Level 3: Floating elements
│   └── Dropdowns, popovers, tooltips
└── Level 4: Overlay elements
    └── Modals, bottom sheets, dialogs
```

### 5.4 Shadow Application

```tsx
// Passive card
<Card className="shadow-vlossom-soft">
  <CardContent>Static information</CardContent>
</Card>

// Interactive card (lifts on hover)
<Card className="shadow-vlossom hover:shadow-vlossom-elevated transition-shadow">
  <CardContent>Clickable content</CardContent>
</Card>

// Modal/Dialog
<Dialog className="shadow-vlossom-modal">
  <DialogContent>Important action</DialogContent>
</Dialog>
```

---

## 6. Border Radius

### 6.1 Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-none` | 0 | Sharp corners (rare) |
| `rounded-sm` | 6px | Small elements, tags |
| `rounded-md` | 10px | Default, inputs |
| `rounded-lg` | 16px | Cards, large containers |
| `rounded-xl` | 24px | Hero cards, modals |
| `rounded-2xl` | 32px | Full-bleed sections |
| `rounded-pill` | 999px | Pills, full rounds |

### 6.2 Component-Specific Radius

| Component | Radius | Token |
|-----------|--------|-------|
| Buttons | 12px | `rounded-button` |
| Inputs | 12px | `rounded-input` |
| Cards | 16px | `rounded-card` |
| Badges | pill | `rounded-full` |
| Avatars | circle | `rounded-full` |
| Modals | 24px | `rounded-xl` |
| Bottom Sheets | 24px top | `rounded-t-xl` |

### 6.3 Radius Philosophy

- **Larger = More important**: Hero cards get larger radius
- **Consistent grouping**: Nested elements maintain parent radius harmony
- **No mixed systems**: If parent is 16px, children should be 12px or less

```tsx
// Card with nested elements
<Card className="rounded-card">           {/* 16px */}
  <CardContent>
    <Input className="rounded-input" />   {/* 12px - smaller than parent */}
    <Button className="rounded-button" /> {/* 12px - matches input */}
  </CardContent>
</Card>
```

---

## 7. Motion & Animation

### 7.1 Motion Philosophy

**"Earned, not constant"** - Animation only on state change, never idle decoration.

| Principle | Expression |
|-----------|------------|
| Purpose | Motion communicates change, not decoration |
| Restraint | Only animate when it adds meaning |
| Organics | Botanical metaphors: unfold, breathe, settle |
| Respect | Honor `prefers-reduced-motion` always |

### 7.2 Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 100ms | Micro-interactions (hover state) |
| `micro` | 150ms | Quick feedback (button press) |
| `nav` | 200ms | Navigation transitions |
| `standard` | 300ms | Default state changes |
| `growth` | 400ms | Expansion, growth moments |
| `dramatic` | 500ms | Hero moments, major events |

### 7.3 Easing Curves

| Token | Value | Usage |
|-------|-------|-------|
| `ease-unfold` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Opening, revealing (overshoot) |
| `ease-breathe` | `cubic-bezier(0.4, 0, 0.6, 1)` | Pulse, alive states |
| `ease-settle` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Arriving, landing |
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering |
| `ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving |

### 7.4 Motion Verbs (Keyframes)

#### UNFOLD - Organic reveal (like a petal opening)
```css
@keyframes unfold {
  0% { opacity: 0; transform: scale(0.8) rotate(-5deg); }
  60% { opacity: 1; transform: scale(1.02) rotate(1deg); }  /* overshoot */
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
```

#### BREATHE - Subtle pulse (for active/alive states)
```css
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
```

#### SETTLE - Gentle arrival (landing into place)
```css
@keyframes settle {
  0% { opacity: 0; transform: translateY(12px); }
  70% { opacity: 1; transform: translateY(-2px); }  /* slight overshoot */
  100% { opacity: 1; transform: translateY(0); }
}
```

### 7.5 Animation Classes

```tsx
// Reveal animations
<div className="animate-unfold">Opening content</div>
<div className="animate-unfold-subtle">Gentle reveal</div>
<div className="animate-settle">Arriving content</div>

// State animations
<Icon name="bloom" className="animate-breathe-once" />  // Single pulse
<div className="animate-checkmark">Success!</div>

// Staggered lists
<ul className="animate-stagger">
  <li>First (0ms delay)</li>
  <li>Second (50ms delay)</li>
  <li>Third (100ms delay)</li>
</ul>

// Transitions
<Button className="transition-standard">Standard transition</Button>
<Card className="transition-growth ease-unfold">Growth card</Card>
```

### 7.6 Hero Moments

| Moment | Animation | Duration | Screen |
|--------|-----------|----------|--------|
| **The Settle** | Page fade + staggered cards | 300ms + 50ms stagger | Home first load |
| **The Unfold** | Step transitions | 400ms | Onboarding |
| **The Bloom** | Icon pulse + badge appear | 400ms | Ritual completion |
| **The Growth** | Progress fill + counter | 400ms | Milestone reached |

### 7.7 Forbidden Animations

| Pattern | Why Forbidden | Alternative |
|---------|---------------|-------------|
| Infinite loops | Exhausting, idle motion | Use `animate-once` variants |
| Slide from edge | Feels pushy, demanding | Use `settle` (fade + small Y) |
| Bounce | Juvenile, not premium | Use `ease-unfold` overshoot |
| Shake/wiggle | Alarm-like, stressful | Use subtle color change |
| Spinning icons | Loading only, never idle | Use skeleton shimmer |

---

## 8. Iconography

### 8.1 Icon System Architecture

```
@/components/icons
├── index.ts          # Public API - ONLY import from here
├── Icon.tsx          # Unified component
├── icon-map.ts       # Semantic name → Phosphor mapping
└── USAGE.md          # Documentation
```

### 8.2 Icon Import Pattern

```tsx
// CORRECT - Always import from central location
import { Icon, NavIcon, StateIcon } from '@/components/icons';

// WRONG - Never import directly from Phosphor
import { House } from '@phosphor-icons/react';  // FORBIDDEN
```

### 8.3 Icon Sizes

| Token | Size | Usage |
|-------|------|-------|
| `xs` | 12px | Inline text icons |
| `sm` | 16px | Compact UI, badges |
| `md` | 20px | Default, most common |
| `lg` | 24px | Navigation, prominent |
| `xl` | 32px | Hero moments |
| `2xl` | 40px | Large feature icons |

### 8.4 Icon Weights

| Weight | Feel | Usage |
|--------|------|-------|
| `thin` | Delicate | Subtle indicators |
| `light` | **Default** | Most usage, organic feel |
| `regular` | Standard | Emphasis |
| `bold` | Strong | High emphasis |
| `fill` | Solid | Active/selected states |

### 8.5 Semantic Icon Names

#### Tier A: Navigation (Familiar Meaning)

| Name | Meaning | Phosphor Icon |
|------|---------|---------------|
| `home` | Shelter/Return | House |
| `calendar` | Cycle/Rhythm | CalendarDots |
| `search` | Discovery | MagnifyingGlass |
| `wallet` | Value/Resource | Wallet |
| `profile` | Identity | User |
| `notifications` | Awareness | Bell |
| `back` | Return | ArrowLeft |
| `close` | Dismiss | X |
| `add` | Create | Plus |
| `settings` | Configure | Gear |
| `menu` | Options | List |

#### Tier B: State (Botanical Latitude)

| Name | Meaning | Phosphor Icon |
|------|---------|---------------|
| `seed` | Potential/Beginning | Grains |
| `root` | Grounding/Stability | Plant |
| `petal` | Active Care | Leaf |
| `bloom` | Readiness/Growth | Flower |
| `lotus` | Full Flourishing | FlowerLotus |
| `rest` | Stillness | Moon |
| `active` | Day/Active | Sun |
| `success` | Completion | CheckCircle |
| `error` | Error State | WarningCircle |
| `empty` | Quiet Intent | DotsThreeOutline |

### 8.6 Icon Usage Examples

```tsx
// Navigation icon (24px, light)
<NavIcon name="home" />

// Inline icon (16px)
<InlineIcon name="calendar" />

// Button icon (20px)
<ButtonIcon name="add" />

// State icon with active prop
<StateIcon name="bloom" active={isHealthy} />  // fill when active

// Custom size and weight
<Icon name="success" size="xl" weight="fill" className="text-status-success" />
```

---

## 9. Component Specifications

### 9.1 Buttons

#### Variants

| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| `primary` | `#311E6B` | white | none | Main CTAs |
| `secondary` | `#F5F5F5` | primary | none | Secondary actions |
| `outline` | transparent | `#311E6B` | 2px primary | Alternative CTAs |
| `ghost` | transparent | secondary | none | Tertiary actions |
| `destructive` | `#D0021B` | white | none | Dangerous actions |

#### Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 36px | `8px 16px` | 14px |
| `default` | 44px | `10px 24px` | 15px |
| `lg` | 48px | `12px 32px` | 16px |
| `icon` | 44px × 44px | centered | - |

#### States

```css
/* Default */
.button { transition: all 150ms ease-standard; }

/* Hover */
.button:hover { filter: brightness(0.95); }

/* Active/Press */
.button:active { transform: scale(0.98); }

/* Focus */
.button:focus-visible {
  outline: none;
  ring: 2px solid #311E6B;
  ring-offset: 2px;
}

/* Disabled */
.button:disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

### 9.2 Cards

```tsx
<Card className="
  bg-surface
  rounded-card          /* 16px */
  shadow-vlossom        /* standard elevation */
  transition-shadow
  hover:shadow-vlossom-elevated
">
  <CardHeader className="p-6 pb-0">
    <CardTitle className="text-h3 font-semibold">Title</CardTitle>
    <CardDescription className="text-caption text-text-secondary">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
  <CardFooter className="p-6 pt-0 flex gap-3">
    {/* Actions */}
  </CardFooter>
</Card>
```

### 9.3 Inputs

```tsx
<div className="flex flex-col gap-2">
  <Label className="text-caption font-medium text-text-primary">
    Label
  </Label>
  <Input className="
    h-11
    px-4 py-2.5
    rounded-input           /* 12px */
    border border-border-default
    bg-background-primary
    text-body
    placeholder:text-text-muted
    focus:ring-2 focus:ring-primary focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  " />
  <span className="text-caption text-text-muted">Helper text</span>
</div>
```

### 9.4 Badges

| Variant | Background | Text |
|---------|------------|------|
| `default` | `primary/10` | primary |
| `success` | `success/10` | success |
| `warning` | `warning/10` | warning |
| `error` | `error/10` | error |
| `outline` | transparent | secondary |

```tsx
<Badge variant="success" className="
  px-2.5 py-0.5
  rounded-full
  text-caption
  font-medium
">
  Confirmed
</Badge>
```

### 9.5 Dialogs/Modals

```tsx
<Dialog>
  <DialogOverlay className="
    fixed inset-0
    bg-overlay           /* rgba(22,22,22,0.5) */
    animate-fadeIn
  " />
  <DialogContent className="
    fixed
    top-1/2 left-1/2
    -translate-x-1/2 -translate-y-1/2
    w-[90vw] max-w-md
    p-8
    rounded-xl           /* 24px */
    bg-surface-elevated
    shadow-vlossom-modal
    animate-dialogIn
  ">
    <DialogHeader>
      <DialogTitle className="font-display text-h2">Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
    <DialogFooter className="flex gap-3 mt-6">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 9.6 Bottom Sheets (Mobile)

```tsx
<Sheet>
  <SheetOverlay className="fixed inset-0 bg-overlay" />
  <SheetContent className="
    fixed
    bottom-0 left-0 right-0
    rounded-t-xl         /* 24px top corners */
    bg-surface-elevated
    shadow-vlossom-modal
    pb-safe              /* safe area for home indicator */
    max-h-[85vh]
    animate-slideUp
  ">
    <SheetHandle className="
      w-10 h-1
      mx-auto mt-3 mb-6
      rounded-full
      bg-border-default
    " />
    {/* Content */}
  </SheetContent>
</Sheet>
```

### 9.7 Navigation (Bottom Tabs)

```tsx
<nav className="
  fixed bottom-0 left-0 right-0
  flex justify-around items-center
  h-20
  bg-surface-elevated
  border-t border-border-subtle
  pb-safe
  shadow-vlossom-soft
">
  {tabs.map(tab => (
    <NavItem
      key={tab.name}
      className="
        flex flex-col items-center gap-1
        px-4 py-2
        text-caption
        transition-colors
      "
      activeClassName="text-primary"
      inactiveClassName="text-text-muted"
    >
      <NavIcon name={tab.icon} />
      <span>{tab.label}</span>
    </NavItem>
  ))}
</nav>
```

### 9.8 Empty States

```tsx
<EmptyState
  preset="noBookings"  // or custom content
  size="md"            // sm | md | lg
  className="py-12"
/>

// Custom empty state
<EmptyState size="md">
  <EmptyStateIllustration>
    <Icon name="calendar" size="2xl" className="text-text-muted" />
  </EmptyStateIllustration>
  <EmptyStateTitle>No Rituals Scheduled</EmptyStateTitle>
  <EmptyStateDescription>
    Your journey begins with a single ritual. Let's book your first session.
  </EmptyStateDescription>
  <EmptyStateAction>
    <Button>Book a Ritual</Button>
  </EmptyStateAction>
</EmptyState>
```

### 9.9 Loading States

**Skeletons (preferred over spinners)**

```tsx
<Skeleton className="
  h-4 w-3/4
  rounded-md
  bg-border-default
  animate-shimmer
" />

// Card skeleton
<Card className="shadow-vlossom-soft">
  <CardContent className="p-6 space-y-4">
    <Skeleton className="h-6 w-1/2" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </CardContent>
</Card>
```

**Spinner (only when necessary)**

```tsx
<Spinner className="
  w-5 h-5
  text-primary
  animate-spin
" />
```

---

## 10. Responsive Behavior

### 10.1 Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large displays |

### 10.2 Mobile-First Patterns

```tsx
// Mobile default, then scale up
<div className="
  px-4              /* mobile padding */
  md:px-6           /* tablet padding */
  lg:px-8           /* desktop padding */
">
  <div className="
    grid grid-cols-1     /* mobile: single column */
    md:grid-cols-2       /* tablet: 2 columns */
    lg:grid-cols-3       /* desktop: 3 columns */
    gap-4
  ">
    {/* Cards */}
  </div>
</div>
```

### 10.3 Desktop Navigation

On desktop (lg+), navigation moves from bottom tabs to top nav:

```tsx
// Desktop top nav (visible lg+)
<nav className="
  hidden lg:flex
  fixed top-0 left-0 right-0
  h-16
  items-center
  px-8
  bg-surface-elevated
  border-b border-border-subtle
  z-sticky
">
  {/* Logo + Nav Items */}
</nav>

// Mobile bottom nav (hidden lg+)
<nav className="
  lg:hidden
  fixed bottom-0 left-0 right-0
  ...
">
  {/* Tab Items */}
</nav>
```

### 10.4 Touch Targets

All interactive elements maintain 44px minimum touch target on all screen sizes:

```tsx
// Button - always 44px height
<Button className="h-11">  {/* 44px */}

// Icon button - always 44×44
<Button variant="ghost" size="icon" className="h-11 w-11">
  <Icon name="close" />
</Button>

// List item - adequate tap area
<ListItem className="py-3 px-4 min-h-[44px]">
```

---

## 11. Accessibility

### 11.1 Focus States

```css
/* Default focus ring */
.focus-visible {
  outline: none;
  ring: 2px solid var(--color-primary);
  ring-offset: 2px;
}

/* Dark mode focus ring */
.dark .focus-visible {
  ring: 2px solid var(--color-primary-soft);
}
```

### 11.2 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// In components
const prefersReducedMotion = usePrefersReducedMotion();
const animationClass = prefersReducedMotion ? '' : 'animate-unfold';
```

### 11.3 Color Contrast

All text meets WCAG AA standards:

| Combination | Contrast Ratio |
|-------------|----------------|
| Primary text on white | 12.4:1 |
| Secondary text on white | 4.8:1 |
| White text on primary | 8.2:1 |
| Dark mode primary text | 15.9:1 |

### 11.4 Screen Reader Considerations

```tsx
// Decorative icons
<Icon name="bloom" aria-hidden="true" />

// Meaningful icons
<Icon name="notifications" aria-label="Notifications" />

// Icon buttons
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <Icon name="close" />
</Button>

// Loading states
<Skeleton aria-label="Loading content" />
<Spinner aria-label="Loading" />
```

---

## 12. Reference Examples

### 12.1 Home Screen Card

```tsx
<Card className="
  bg-surface
  rounded-card
  shadow-vlossom
  transition-all
  hover:shadow-vlossom-elevated
  hover:-translate-y-0.5
">
  <CardHeader className="p-6 pb-0">
    <div className="flex items-center justify-between">
      <CardTitle className="font-display text-h3">
        Next Ritual
      </CardTitle>
      <StateIcon name="bloom" active={true} className="text-primary" />
    </div>
    <CardDescription className="text-caption text-text-secondary">
      Tomorrow at 10:00 AM
    </CardDescription>
  </CardHeader>
  <CardContent className="p-6">
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={stylist.avatar} />
        <AvatarFallback>{stylist.initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-body font-medium">{stylist.name}</p>
        <p className="text-caption text-text-muted">Wash Day Ritual</p>
      </div>
    </div>
  </CardContent>
  <CardFooter className="p-6 pt-0">
    <Button variant="outline" className="flex-1">Reschedule</Button>
    <Button variant="primary" className="flex-1">View Details</Button>
  </CardFooter>
</Card>
```

### 12.2 Wallet Balance Display

```tsx
<div className="
  p-6
  bg-surface
  rounded-card
  shadow-vlossom
">
  {/* Context first (serif) */}
  <span className="font-display text-body text-text-secondary">
    Your Balance
  </span>

  {/* Evidence (mono) */}
  <div className="flex items-baseline gap-2 mt-2">
    <span className="font-mono text-h1 tabular-nums text-text-primary">
      R 12,450.00
    </span>
  </div>

  {/* Secondary value */}
  <span className="font-mono text-caption text-text-muted tabular-nums">
    ≈ $690.28 USD
  </span>
</div>
```

### 12.3 Notification Item

```tsx
<div className="
  flex items-start gap-3
  p-4
  rounded-lg
  bg-surface
  transition-colors
  hover:bg-surface/80
  cursor-pointer
">
  <div className="
    w-10 h-10
    rounded-full
    bg-primary/10
    flex items-center justify-center
    shrink-0
  ">
    <Icon name="calendar" size="md" className="text-primary" />
  </div>

  <div className="flex-1 min-w-0">
    <p className="text-body font-medium text-text-primary">
      Ritual Reminder
    </p>
    <p className="text-caption text-text-secondary line-clamp-2">
      Your wash day ritual with Sarah is tomorrow at 10:00 AM
    </p>
    <span className="text-caption text-text-muted font-mono tabular-nums">
      2h ago
    </span>
  </div>

  {/* Unread indicator */}
  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
</div>
```

### 12.4 Onboarding Step

```tsx
<div className="
  flex flex-col items-center
  text-center
  px-6 py-12
  animate-settle
">
  {/* Illustration with botanical icon */}
  <div className="
    w-32 h-32
    rounded-full
    bg-surface
    flex items-center justify-center
    mb-8
    animate-unfold-subtle
  ">
    <Icon name="seed" size="2xl" className="text-primary" />
  </div>

  {/* Title (serif) */}
  <h2 className="font-display text-h2 text-text-primary mb-3">
    Welcome to Your Journey
  </h2>

  {/* Description (sans) */}
  <p className="text-body text-text-secondary max-w-sm">
    Every healthy head of hair starts with understanding.
    Let's learn about your unique needs.
  </p>

  {/* Progress indicator */}
  <div className="flex gap-2 mt-8">
    {[1, 2, 3, 4].map((step, i) => (
      <div
        key={step}
        className={cn(
          "w-2 h-2 rounded-full transition-colors",
          i === currentStep ? "bg-primary" : "bg-border-default"
        )}
      />
    ))}
  </div>
</div>
```

---

## Quick Reference Checklist

### Before Implementing Any Component

- [ ] Using semantic color tokens, not hex values
- [ ] Font pairing correct (display for headlines, sans for UI)
- [ ] Spacing follows 4px grid
- [ ] Touch targets minimum 44px
- [ ] Motion uses verb classes (unfold, settle, breathe)
- [ ] Icons imported from `@/components/icons`
- [ ] Shadows appropriate for elevation level
- [ ] Border radius consistent with component type
- [ ] Focus states visible and styled
- [ ] Reduced motion preference honored
- [ ] Orange color used ONLY for growth/celebration

### Design Quality Gates

- [ ] Passes "glance test" - hierarchy clear at a glance
- [ ] Calm, not demanding
- [ ] Data as narrative - context before evidence
- [ ] No idle animations
- [ ] Premium feel through restraint

---

*This specification is the source of truth for Vlossom frontend styling. When in doubt, reference the examples above. When conflicts arise, prioritize the design philosophy: calm, botanical, mobile-first.*
