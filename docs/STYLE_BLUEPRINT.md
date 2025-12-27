# STYLE_BLUEPRINT — Vlossom Visual System

 

A Brand-Aligned Design System for Frontend Implementation

 

---

 

## 1. Visual Philosophy

 

Vlossom's visual language embodies **"growth from rest, not pressure."**

 

The interface should feel like:

- A garden at dawn — alive but unhurried

- A sanctuary — safe, dignified, warm

- A wellness companion — intelligent but gentle

 

**Core principles:**

- **Calm over stimulation** — space is intentional, not empty

- **Meaning over decoration** — every element carries semantic weight

- **Rest as a feature** — pause states are celebrated, not hidden

- **Earned motion** — animation is a reward, not constant entertainment

 

---

 

## 2. The Symbolic UI Language

 

### 2.1 The Flower System

 

The Vlossom flower is not a logo. It is a **living symbol** that expresses user state.

 

**Three Tiers:**

 

#### Tier 1: Core Mark (Minimal)

- **Usage:** Navigation, favicons, status indicators, app chrome

- **Visual:** Single-stroke linework, minimal detail

- **Files:** `design/brand/logos/vlossom-icon.svg`

- **When:** Always present as identity anchor

 

#### Tier 2: Narrative Flower (Illustrated)

- **Usage:** Landing pages, onboarding, achievement moments, campaigns

- **Visual:** Layered lines, botanical detail, center prominence

- **Files:** Derive from core mark with added layering

- **When:** Hero moments, emotional peaks, "you are growing" states

 

#### Tier 3: Botanical Fragments (Micro)

- **Usage:** Micro-icons, progress indicators, dividers, badges

- **Visual:** Isolated petals, stems, center dots

- **When:** Functional UI elements that need brand continuity

 

### 2.2 Symbolic Meaning Map

 

| Element | Meaning | Visual Expression |

|---------|---------|-------------------|

| **Petals** | Stages of growth | Petal count = progress level |

| **Stem** | Support system | Connection lines, platform relationship |

| **Center** | Community / Core health | Health score, "heart" indicator |

| **Closed flower** | Rest state | Recovery, pause, calm |

| **Open flower** | Active growth | Completion, achievement, celebration |

| **Petal opacity** | Strength/clarity | Full = strong, faded = developing |

 

### 2.3 State-Driven Iconography



Every icon should express state:



| State | Icon Treatment |

|-------|----------------|

| **Healthy** | Full opacity, open form |

| **Needs attention** | Partial opacity, subtle indicator |

| **Critical** | Muted with gentle accent |

| **Growing** | Animated unfold (subtle) |

| **Resting** | Closed/settled form |



### 2.4 V6.0 Botanical Icon Library



**Location:** `design/brand/icons/` and `apps/web/components/ui/vlossom-icons.tsx`



All navigation and state icons are custom botanical SVGs derived from the Vlossom flower linework. Generic icon libraries (Lucide, Heroicons, Material, Feather, Font Awesome) are **forbidden** for navigation and state icons.



#### Navigation Icons

| Icon | File | Meaning | Usage |

|------|------|---------|-------|

| `VlossomHome` | `nav/home.svg` | Centered core, belonging | Home tab |

| `VlossomSearch` | `nav/search.svg` | Radiating petals, discovery | Search tab |

| `VlossomCalendar` | `nav/calendar.svg` | Petal ring, cycles | Calendar views |

| `VlossomWallet` | `nav/wallet.svg` | Contained bloom, value | Wallet tab |

| `VlossomProfile` | `nav/profile.svg` | Single flower, identity | Profile tab |

| `VlossomNotifications` | `nav/notifications.svg` | Pulsing bud, awareness | Alerts |



#### State Icons

| Icon | File | Meaning | Usage |

|------|------|---------|-------|

| `VlossomHealthy` | `state/healthy.svg` | Open flower, full petals | Health status |

| `VlossomGrowing` | `state/growing.svg` | Partially opening | Active improvement |

| `VlossomResting` | `state/resting.svg` | Closed petals | Recovery phase |

| `VlossomNeedsCare` | `state/needs-care.svg` | Drooping, asymmetric | Attention required |

| `VlossomTransition` | `state/transition.svg` | Phase change | Session progress |



#### Usage Rules

- Import from `@/components/ui/vlossom-icons`

- Use `accent` prop for growth/celebration moments only

- Size defaults: 24px for nav, 20px for inline

- All icons use Primary Purple (`#311E6B`) via `currentColor`



See `design/brand/icons/ICONOGRAPHY_REPORT.md` for full documentation.



---

 

## 3. Color System

 

### 3.1 Brand Palette (Light Mode)

 

| Token | Hex | Usage |

|-------|-----|-------|

| `primary` | `#311E6B` | CTAs, headers, brand anchor |

| `primarySoft` | `#ADA5C4` | Disabled states, subtle backgrounds |

| `secondary` | `#EFE3D0` | Card backgrounds, soft containers |

| `accent` | `#FF510D` | **Sacred** — celebrations only |

| `tertiary` | `#A9D326` | Success, growth, confirmations |

| `background` | `#FFFFFF` | Page backgrounds |

| `textPrimary` | `#161616` | Primary text |

| `textSecondary` | `#6F6F6F` | Muted text |

 

### 3.2 Brand Palette (Dark Mode)

 

| Token | Hex | Usage |

|-------|-----|-------|

| `background` | `#161616` | Page background |

| `surface` | `#2A1F4D` | Card backgrounds |

| `surfaceElevated` | `#3D2C6B` | Elevated cards, modals |

| `primary` | `#ADA5C4` | CTAs in dark mode |

| `textPrimary` | `#FFFFFF` | Primary text |

| `textSecondary` | `#ADA5C4` | Muted text |

 

### 3.3 Accent Color Governance (CRITICAL) — V6.1.0 ENFORCED



**The orange accent (#FF510D) is sacred and now strictly enforced in code.**



**Allowed usage:**

- Completion celebrations

- Growth acknowledgments

- Ritual completions

- Transition moments

- The flower's center (when active)

- VlossomIcon components with `accent` prop

- Achievement moments



**Forbidden usage (NEVER):**

- Errors (use `status-error` - red #D0021B)

- Warnings (use `status-warning` - amber #F59E0B)

- System alerts

- Generic buttons

- Decorative elements

- Any negative or cautionary states



**Maximum surface area:** 5–8% per screen



**Code Enforcement (V6.1.0):**

- `tailwind.config.js` includes governance comments
- `status.warning` token changed from orange to amber
- 12 files corrected to use proper status colors
- Orange reserved exclusively for celebration



**Rationale:** Orange represents the "blossom moment" — when growth is realized. Overuse destroys its emotional power.

**Color Separation:**
- Red (`#D0021B`) = Errors, destructive actions
- Amber (`#F59E0B`) = Warnings, caution, validation
- Orange (`#FF510D`) = Growth, celebration, achievement ONLY

 

---

 

## 4. Typography System

 

### 4.1 Font Pairing

 

| Role | Font | Weight Range | Usage |

|------|------|--------------|-------|

| **UI Primary** | Inter | 400–600 | All system text, labels, inputs |

| **Editorial** | Playfair Display | 400–700 | Headlines, philosophy, onboarding |

 

### 4.2 Type Scale

 

| Name | Size | Line Height | Usage |

|------|------|-------------|-------|

| `display` | 40px | 1.2 | Hero headlines |

| `h1` | 32px | 1.25 | Page titles |

| `h2` | 24px | 1.3 | Section headers |

| `h3` | 20px | 1.4 | Card titles |

| `body` | 16px | 1.5 | Primary text |

| `small` | 14px | 1.5 | Secondary text |

| `caption` | 12px | 1.4 | Labels, metadata |

 

### 4.3 Typography Rules

 

- **Never** use all-caps for primary actions

- **Always** use tabular numerals for financial data

- **Editorial font** only in low-density contexts (landing, onboarding)

- **Line height** minimum 1.4 for body text

- **Left-align** for readability (never center long text)

 

---

 

## 5. Spacing System

 

### 5.1 Scale (4pt grid)

 

| Token | Value | Usage |

|-------|-------|-------|

| `xs` | 4px | Icon padding, tight gaps |

| `sm` | 8px | Inline elements |

| `md` | 12px | Component internal |

| `lg` | 16px | Standard gaps |

| `xl` | 24px | Section spacing |

| `2xl` | 32px | Major sections |

| `3xl` | 48px | Page-level breathing |

| `4xl` | 64px | Hero spacing |

 

### 5.2 Spacing Philosophy

 

- **Vertical rhythm > horizontal density**

- **Empty space is intentional** — it represents "rest"

- **Cards never touch** without breathing room

- **Dense screens** should feel "well-held," not cramped

 

---

 

## 6. Shape & Surface

 

### 6.1 Border Radius

 

| Token | Value | Usage |

|-------|-------|-------|

| `sm` | 6px | Buttons, inputs |

| `md` | 10px | Small cards |

| `lg` | 16px | Standard cards |

| `xl` | 24px | Large cards, modals |

| `pill` | 999px | Pills, tags |

| `circle` | 50% | Avatars |

 

### 6.2 Shadows (Light Mode)

 

| Token | Value | Usage |

|-------|-------|-------|

| `soft` | `0 4px 16px rgba(0,0,0,0.04)` | Subtle elevation |

| `card` | `0 12px 30px rgba(0,0,0,0.06)` | Cards |

| `elevated` | `0 20px 40px rgba(0,0,0,0.08)` | Modals, overlays |

 

### 6.3 Shadows (Dark Mode)

 

| Token | Value | Usage |

|-------|-------|-------|

| `soft` | `0 4px 16px rgba(0,0,0,0.15)` | Subtle elevation |

| `card` | `0 12px 30px rgba(0,0,0,0.25)` | Cards |

| `elevated` | `0 20px 40px rgba(0,0,0,0.35)` | Modals, overlays |

 

### 6.4 Surface Philosophy

 

- **Soft separation** over harsh borders

- Cards feel "rested," not aggressively elevated

- Borders are low contrast, often optional

- Surfaces should breathe, not box

 

---

 

## 7. Motion System

 

### 7.1 Duration Scale

 

| Token | Value | Usage |

|-------|-------|-------|

| `fast` | 150ms | Micro-interactions |

| `medium` | 220ms | State changes |

| `slow` | 300ms | Modal transitions |

| `ritual` | 500ms | Celebration moments |

 

### 7.2 Easing

 

| Token | Value | Usage |

|-------|-------|-------|

| `standard` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Default |

| `gentle` | `cubic-bezier(0.4, 0, 0.2, 1)` | Calm transitions |

| `unfold` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Expansion |

| `settle` | `cubic-bezier(0.4, 0, 1, 1)` | Completion |

 

### 7.3 Motion Rules

 

| Rule | Description |

|------|-------------|

| **State-driven** | Motion only on state change |

| **No loops** | No perpetual animations |

| **Earned** | Animation is a reward |

| **Slow** | Slightly slower than industry default |

| **Gentle** | Never snappy or jarring |

 

### 7.4 Motion Language



Use these verbs when describing motion:

- **Unfold** (not snap)

- **Breathe** (not bounce)

- **Settle** (not slam)

- **Emerge** (not pop)

- **Rest** (not freeze)



### 7.5 V6.0 Animation Implementation



**Location:** `apps/web/styles/animations.css` and `apps/web/lib/motion.ts`



The animation system implements the motion verbs as CSS classes and TypeScript utilities:



#### CSS Animation Classes

```css
/* Unfold - organic reveal like a petal opening */

.animate-unfold { animation: unfold 400ms var(--motion-ease-unfold) forwards; }

.animate-unfold-subtle { animation: unfold-subtle 300ms var(--motion-ease-settle) forwards; }



/* Breathe - subtle life pulse (use SPARINGLY) */

.animate-breathe-once { animation: breathe 600ms var(--motion-ease-breathe) forwards; }



/* Settle - gentle arrival into place */

.animate-settle { animation: settle 300ms var(--motion-ease-settle) forwards; }

.animate-settle-fade { animation: settle-fade 200ms var(--motion-ease-settle) forwards; }

```



#### TypeScript Motion Utilities

```typescript

import { motionUnfold, motionSettle, MOTION_CLASSES } from '@/lib/motion';



// Apply animation classes

<div className={motionSettle('default')} />



// Transition utilities

<button className={MOTION_CLASSES.transitionNav} />

```



#### Duration Tokens

| Token | Value | Usage |

|-------|-------|-------|

| `--motion-duration-instant` | 100ms | Micro-interactions |

| `--motion-duration-micro` | 150ms | Small feedback |

| `--motion-duration-nav` | 200ms | Navigation transitions |

| `--motion-duration-standard` | 300ms | State changes |

| `--motion-duration-growth` | 400ms | Growth/celebration |

| `--motion-duration-dramatic` | 500ms | Hero moments |



#### Reduced Motion Support

All animations respect `prefers-reduced-motion: reduce` automatically.

#### V7.4 Motion Implementation Status

The motion system is now integrated into core UI components:

| Component | Motion | Trigger |
|-----------|--------|---------|
| **Dialog (Web)** | `unfold` | On open |
| **Card (Web/Mobile)** | `settle` | When `animate` prop is true |
| **EmptyState (Web/Mobile)** | `settle` | On mount |
| **BookingSuccess (Web)** | `unfold` + `settle` stagger | On success screen |

**Web Usage:**
```tsx
// Dialog automatically uses unfold animation
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>...</DialogContent>
</Dialog>

// Card with settle animation
<Card animate>
  <CardContent>...</CardContent>
</Card>
```

**Mobile Usage (React Native):**
```tsx
import { useSettleMotion, useUnfoldMotion } from '@/hooks/useMotion';

// In component
const { style: settleStyle } = useSettleMotion({ autoPlay: true });

return (
  <Animated.View style={settleStyle}>
    <Card animate>...</Card>
  </Animated.View>
);
```

---



## 8. Component Ethos

 

### 8.1 Component Principles

 

Components should be:

- **Composable** — work together predictably

- **Stateful** — express their current state visually

- **Semantic** — carry meaning, not just style

- **Accessible** — keyboard nav, focus visible, ARIA where needed

 

### 8.2 Required Component Library

 

**Atoms:**

- Button (primary, secondary, ghost, accent, danger)

- Input (text, select, date, time)

- Avatar (round, square, with status)

- Badge (status, achievement, role)

- Tag/Chip (category, filter)

 

**Molecules:**

- Card (service, stylist, salon, booking)

- NotificationCard

- TransactionRow

- EventChip (calendar)

- SearchResult

 

**Organisms:**

- WalletOverview

- CalendarMonthGarden

- CalendarRhythmStrip

- DayFlow

- MapWithPins

- BookingSheet

- ProfileHeader

- RoleTabs

 

### 8.3 State Expression

 

Every component must visually express:

- Default

- Hover

- Active/Pressed

- Focus

- Disabled

- Loading

- Error

- Success

 

---

 

## 9. Page-by-Page Application

 

### 9.1 Marketing Pages (/, /protocol, /docs)

 

**Primary influence:** Hyper Foundation + Stripe Press

 

- Editorial typography (Playfair Display for headlines)

- Generous whitespace

- Calm structural hierarchy

- Narrative flower (Tier 2) for hero moments

- Long-form readability

 

### 9.2 App Dashboard (/app)

 

**Primary influence:** Wealthsimple + Linear

 

- UI typography (Inter)

- Soft CTA hierarchy

- Core mark (Tier 1) for chrome

- Balance card, quick actions

- Calm financial UI

 

### 9.3 Home Map (/app/home)

 

**Primary influence:** Uber (mental model)

 

- Full-screen map

- Bottom sheet booking overlay

- Stylist/salon pins with semantic colors

- Never leave map during booking initiation

 

### 9.4 Profile + Hair Health (/app/profile)

 

**Primary influence:** Apple Health + Headspace

 

- Calendar as rhythm (not grid)

- Hair health as wellness companion

- Botanical fragments (Tier 3) for indicators

- Progress feels like growth, not metrics

 

### 9.5 Onboarding

 

**Primary influence:** Headspace + Calm

 

- Narrative flower prominent

- Editorial typography

- Step-by-step ritual framing

- Motion: slow unfold

 

---

 

## 10. Accessibility Requirements

 

| Requirement | Standard |

|-------------|----------|

| **Color contrast** | WCAG AA minimum |

| **Focus states** | Visible on all interactive elements |

| **Keyboard nav** | Full keyboard accessibility |

| **Screen reader** | Semantic HTML + ARIA where needed |

| **Touch targets** | Minimum 44px × 44px |

| **Motion** | Respect `prefers-reduced-motion` |

 

---

 

## 11. Non-Negotiables

 

These rules cannot be broken:

 

1. **Orange is sacred** — never for errors/warnings

2. **Flower tiers are intentional** — don't mix levels inappropriately

3. **Space is restful** — don't fill every gap

4. **Motion is earned** — don't animate without state change

5. **States must be complete** — every screen needs loading/empty/error/success

6. **Brand tokens are law** — never hard-code hex values

7. **Symbolic meaning matters** — decorative elements without meaning are forbidden

 

---

 

## 12. Implementation Checklist

 

Before submitting frontend output, verify:

 

- [ ] All colors from `design/tokens/*.json`

- [ ] Flower iconography uses correct tier

- [ ] Orange accent used only for celebrations

- [ ] Typography pairing respected

- [ ] Motion follows rules (no loops, gentle easing)

- [ ] All UX states implemented

- [ ] Accessibility requirements met

- [ ] Symbolic meaning documented in manifest

 

---

 

*This blueprint translates Vlossom's brand identity into implementable UI rules.*

*It should be used alongside `docs/HANDOFF_FOR_GEMINI.md` for frontend generation.*