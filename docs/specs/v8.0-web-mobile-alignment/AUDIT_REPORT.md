# V8.0 Web/Mobile Alignment - Audit Report

> **Date**: January 2, 2026
> **Purpose**: Document current state of mobile and web implementations to ensure alignment doesn't add or subtract unintentionally.

---

## Executive Summary

### Overall Alignment Status: ⚠️ Partial Alignment

| Category | Status | Notes |
|----------|--------|-------|
| Design Tokens | ✅ Aligned | Same colors, typography, spacing |
| Navigation Structure | ✅ Aligned | 5 tabs: Home, Browse, Wallet, Alerts, Profile |
| Icon System | ❌ Divergent | Mobile: Botanical, Web: Phosphor |
| Component Patterns | ⚠️ Partial | Similar but different prop interfaces |
| User Journeys | ✅ Aligned | Same flows, minor UI differences |
| Map Experience | ⚠️ Partial | Mobile: Google Maps, Web: Mapbox |

---

## 1. Component Audit

### 1.1 Mobile Components (`apps/mobile/src/components/ui/`)

| Component | Variants | Key Features |
|-----------|----------|--------------|
| **Button** | primary, secondary, outline, ghost, danger | 3 sizes, loading state, icons |
| **Card** | elevated, outlined, filled | Header/Footer sub-components, settle animation |
| **TextInput** | - | Label, error, helper, left/right icons |
| **Modal** | sm, md, lg, full | Unfold animation, close on backdrop |
| **Badge** | 7 color variants | 3 sizes, outline option |
| **Avatar** | 6 sizes (xs-2xl) | Auto-color from name, online indicator |
| **Skeleton** | 8 presets | Shimmer animation |
| **EmptyState** | 20 presets | 9 SVG illustrations |
| **Select** | - | Bottom sheet picker |
| **ReviewModal** | - | Star rating, text review |
| **TPSBreakdown** | default, compact, detailed | Dynamic color by score |

**Total: 13 files, 11 primary components**

### 1.2 Web Components (`apps/web/components/ui/`)

| Component | Variants | Key Features |
|-----------|----------|--------------|
| **Button** | primary, secondary, outline, ghost, destructive | 4 sizes, loading state |
| **Card** | - | Header/Title/Description/Content/Footer, settle animation |
| **Input** | - | Basic HTML input styling |
| **Dialog** | - | Unfold animation, Radix UI base |
| **Badge** | 9 color variants | Outline option |
| **Avatar** | - | Radix UI, fallback initials |
| **Skeleton** | 4 base variants + 6 presets | Pulse animation |
| **EmptyState** | 7 illustration types | Size variants |
| **Select** | - | Radix UI dropdown |
| **Toast** | 5 variants | Swipe dismiss, Radix UI |

**Total: 20+ files, comprehensive library**

### 1.3 Component Alignment Issues

| Issue | Mobile | Web | Action Needed |
|-------|--------|-----|---------------|
| Button variants | `danger` | `destructive` | Unify naming |
| Modal vs Dialog | Modal component | Dialog component | Keep names (platform convention) |
| Select pattern | Bottom sheet | Dropdown | Keep (platform appropriate) |
| Skeleton presets | 8 presets | 6 presets | Add missing presets to web |
| EmptyState presets | 20 presets | 7 illustrations | Add missing presets to web |

---

## 2. Icon System Audit

### 2.1 Current State

| Platform | System | Count | Location |
|----------|--------|-------|----------|
| Mobile | Vlossom Botanical | 28 icons | `src/components/icons/VlossomIcons.tsx` |
| Mobile | Phosphor (social only) | 11 icons | `src/components/icons/SocialIcons.tsx` |
| Web | Phosphor (via bridge) | 70+ icons | `components/icons/icon-map.ts` |
| Web | Vlossom Botanical (unused) | 15 icons | `components/ui/vlossom-icons.tsx` |

### 2.2 Navigation Icons Comparison

| Tab | Mobile Icon | Web Icon | Aligned? |
|-----|-------------|----------|----------|
| Home | VlossomHomeIcon (botanical) | House (Phosphor) | ❌ |
| Browse | VlossomSearchIcon (botanical) | MagnifyingGlass (Phosphor) | ❌ |
| Wallet | VlossomWalletIcon (botanical) | Wallet (Phosphor) | ❌ |
| Notifications | VlossomNotificationsIcon (botanical) | Bell (Phosphor) | ❌ |
| Profile | VlossomProfileIcon (botanical) | User (Phosphor) | ❌ |

### 2.3 Icon Migration Plan

Web already has botanical icons in `vlossom-icons.tsx` but doesn't use them for navigation. Migration requires:
1. Update navigation components to use VlossomX icons
2. Keep Phosphor for social icons (aligned with mobile)
3. Port any missing botanical icons from mobile

---

## 3. User Journey Audit

### 3.1 Booking Flow

| Step | Mobile | Web | Aligned? |
|------|--------|-----|----------|
| Discovery | Map with pins | Map with pins | ✅ |
| Stylist selection | Bottom sheet | Click marker/card | ✅ |
| Stylist detail | Full screen | Full page | ✅ |
| Service selection | Step 1 of 4 | Step 1 of modal | ✅ |
| Date/time | Step 2 of 4 | Step 2 of modal | ✅ |
| Location | Step 3 of 4 | Step 3 of modal | ✅ |
| Confirmation | Step 4 of 4 | Step 4 of modal | ✅ |
| Balance check | Warning banner (V7.0) | Warning banner | ✅ |

**Status: ✅ Aligned**

### 3.2 Wallet Flow

| Feature | Mobile | Web | Aligned? |
|---------|--------|-----|----------|
| Balance display | Fiat-first | Fiat-first | ✅ |
| Send | Modal flow | Dialog flow | ✅ |
| Receive | QR code | QR code | ✅ |
| Fund | On-ramp | On-ramp | ✅ |
| Withdraw | Off-ramp | Off-ramp | ✅ |
| History | Full list | Full list | ✅ |
| Rewards | XP, badges, tiers | XP, badges, tiers | ✅ |
| DeFi | Staking | Liquidity pools | ✅ |

**Status: ✅ Aligned**

### 3.3 Profile Flow

| Feature | Mobile | Web | Aligned? |
|---------|--------|-----|----------|
| Avatar/name | Header | Header | ✅ |
| Role tabs | Overview/Stylist/Properties | Same | ✅ |
| Hair health | Summary card | Summary card | ✅ |
| Settings access | Settings screen | Settings pages | ✅ |
| Edit profile | Dedicated screen | Settings tab | ⚠️ Different location |

**Status: ⚠️ Minor differences**

### 3.4 Discovery Flow

| Feature | Mobile | Web | Aligned? |
|---------|--------|-----|----------|
| Home tab | Full-screen map | Map + overlay | ⚠️ Different emphasis |
| Map provider | Google Maps | Mapbox | ⚠️ Different provider |
| Pin colors | Green/Amber/Red | Custom markers | ⚠️ Different visual |
| Quick filters | Chips above map | Chips on map | ✅ |
| Search | Routes to Browse | Redirects to stylists | ✅ |

**Status: ⚠️ Needs alignment for Uber-style**

### 3.5 Browse/Search Flow

| Feature | Mobile | Web | Aligned? |
|---------|--------|-----|----------|
| Screen header | "Discover" | Redirects to /stylists | ⚠️ |
| Search input | Debounced | Part of map overlay | ⚠️ |
| Category filters | Horizontal chips | Dropdown | ⚠️ |
| Sort options | Dropdown menu | In grid | ⚠️ |
| Results display | Card list | Grid | ⚠️ |

**Status: ⚠️ Visual differences, same function**

---

## 4. Navigation Audit

### 4.1 Mobile Navigation

```
Bottom Tab Bar (5 tabs)
├── Home (index) - Map discovery
├── Browse (search) - Search & filter
├── Wallet (center, elevated) - Financial hub
├── Notifications - Alerts
└── Profile - Identity + roles
```

- Wallet tab is elevated with pill background
- Uses botanical icons
- Labels: Home, Browse, Wallet, Alerts, Profile

### 4.2 Web Navigation

```
Desktop: Top horizontal nav (DesktopNav)
Mobile: Bottom tab bar (BottomNav)
├── Home - Map discovery
├── Search → redirects to /stylists
├── Wallet (center) - Financial hub
├── Notifications - Alerts
└── Profile - Identity + roles
```

- Uses Phosphor icons
- Search redirects to /stylists (not a tab)

### 4.3 Navigation Gaps

| Gap | Description | Fix Needed |
|-----|-------------|------------|
| Icon mismatch | Web uses Phosphor, mobile uses Botanical | Port botanical to web |
| No sidebar | Web uses top nav on desktop | Implement left sidebar |
| No header | Web has DesktopNav, need minimal header | Add AppHeader with balance |
| Wallet elevation | Mobile has elevated wallet, web is flat | Match elevation style |

---

## 5. Design Token Audit

### 5.1 Color Tokens

| Token | Mobile Value | Web Value | Status |
|-------|-------------|-----------|--------|
| primary | #311E6B | #311E6B | ✅ |
| accent (sacred) | #FF510D | #FF510D | ✅ |
| secondary | #EFE3D0 | #EFE3D0 | ✅ |
| tertiary | #A9D326 | #A9D326 | ✅ |
| warning | #F59E0B | #F59E0B | ✅ |
| error | #D0021B | #D0021B | ✅ |

**Status: ✅ Fully Aligned**

### 5.2 Typography

| Token | Mobile | Web | Status |
|-------|--------|-----|--------|
| Body font | Inter | Inter | ✅ |
| Display font | PlayfairDisplay | Playfair Display | ✅ |
| Body size | 16px | 15px | ⚠️ Minor |
| H1 size | 32px | 28px | ⚠️ Minor |

**Status: ⚠️ Minor size differences**

### 5.3 Spacing

| Token | Mobile | Web | Status |
|-------|--------|-----|--------|
| xs | 4px | 4px | ✅ |
| sm | 8px | 8px | ✅ |
| md | 12px (mobile: 16px) | 12px | ⚠️ |
| lg | 16px (mobile: 24px) | 16px | ⚠️ |

**Status: ⚠️ Some inconsistency in naming**

### 5.4 Border Radius

| Token | Mobile | Web | Status |
|-------|--------|-----|--------|
| sm | 6px | 6px | ✅ |
| md | 10px | 10px | ✅ |
| lg | 16px | 16px | ✅ |
| pill | 999px | 999px | ✅ |

**Status: ✅ Fully Aligned**

---

## 6. Motion System Audit

### 6.1 Animation Comparison

| Motion | Mobile | Web | Status |
|--------|--------|-----|--------|
| Unfold | `useUnfoldMotion` hook | `animate-unfold` CSS | ✅ Same effect |
| Settle | `useSettleMotion` hook | `animate-settle` CSS | ✅ Same effect |
| Breathe | Defined in tokens | `animate-breathe` CSS | ✅ Same effect |
| Shimmer | `Animated.timing` loop | `animate-pulse` | ⚠️ Different approach |

**Status: ✅ Conceptually aligned**

---

## 7. Map Experience Audit

### 7.1 Current Implementation

| Aspect | Mobile | Web | Status |
|--------|--------|-----|--------|
| Provider | Google Maps | Mapbox GL | ❌ Different |
| Pin style | Color-coded dots | Custom markers | ⚠️ |
| Bottom sheet | Spring-animated | Click to panel | ⚠️ |
| Filters | Chips overlay | Chips overlay | ✅ |
| Search | Routes to Browse | Overlay results | ⚠️ |

### 7.2 Target State (Uber-Style)

| Feature | Current | Target |
|---------|---------|--------|
| Map style | Default | Muted/desaturated, brand-tinted |
| Pin icons | Dots/markers | Botanical SVGs (🪴🌺🌼) |
| Mobile stylist | Static pin | Animated + live position |
| Interaction | Click | Tooltip → panel/sheet |

---

## 8. Recommendations

### 8.1 Critical (Must Fix)

1. **Port botanical icons to web navigation**
   - Replace Phosphor icons in BottomNav and DesktopNav
   - Keep Phosphor for social sharing only

2. **Implement responsive sidebar**
   - Add left sidebar for tablet/desktop
   - Icons only on tablet, icons+labels on desktop
   - Elevated wallet tab style

3. **Add minimal header**
   - Logo + Wallet Balance (fiat) + Avatar
   - No search, no notification bell

### 8.2 Important (Should Fix)

4. **Unify map provider or styling**
   - Either switch web to Google Maps
   - Or create matching custom styles for both

5. **Create botanical map pins**
   - 🪴 Salon, 🌺 Fixed Stylist, 🌼 Mobile Stylist
   - Animated pulse for mobile stylists

6. **Align EmptyState presets**
   - Add 13 missing presets to web
   - Ensure same illustrations

### 8.3 Nice to Have (Could Fix)

7. **Typography size normalization**
   - Decide on consistent body/heading sizes

8. **Spacing token naming**
   - Align md/lg meanings across platforms

---

## 9. Files Inventory

### 9.1 Mobile UI Components
```
apps/mobile/src/components/ui/
├── Button.tsx
├── Card.tsx
├── TextInput.tsx
├── Modal.tsx
├── Badge.tsx
├── Avatar.tsx
├── Skeleton.tsx
├── EmptyState.tsx
├── Select.tsx
├── ReviewModal.tsx
├── TPSBreakdown.tsx
├── illustrations.tsx
└── index.ts
```

### 9.2 Web UI Components
```
apps/web/components/ui/
├── button.tsx
├── card.tsx
├── input.tsx
├── textarea.tsx
├── dialog.tsx
├── badge.tsx
├── avatar.tsx
├── skeleton.tsx
├── empty-state.tsx
├── error-state.tsx
├── select.tsx
├── toast.tsx
├── toaster.tsx
├── checkbox.tsx
├── switch.tsx
├── tabs.tsx
├── label.tsx
├── copy-button.tsx
├── password-strength.tsx
├── theme-toggle.tsx
├── network-badge.tsx
├── vlossom-logo.tsx
├── vlossom-icons.tsx
├── illustrations.tsx
└── confirmation-dialog.tsx
```

### 9.3 Mobile App Screens
```
apps/mobile/app/
├── (tabs)/
│   ├── index.tsx (Home/Map)
│   ├── search.tsx (Browse)
│   ├── wallet.tsx
│   ├── notifications.tsx
│   └── profile.tsx
├── wallet/
├── stylists/
├── bookings/
├── settings/
├── messages/
├── hair-health/
├── special-events/
└── property-owner/
```

### 9.4 Web App Pages
```
apps/web/app/
├── page.tsx (Landing)
├── (main)/
│   ├── home/page.tsx
│   ├── stylists/page.tsx
│   ├── stylists/[id]/page.tsx
│   ├── bookings/page.tsx
│   ├── schedule/page.tsx
│   ├── profile/page.tsx
│   ├── messages/page.tsx
│   └── special-events/page.tsx
├── wallet/
├── settings/
├── notifications/
└── search/page.tsx (redirect)
```

---

## 10. Conclusion

The mobile and web apps share the same design tokens, user journeys, and overall structure. The main divergence is in the **icon system** (botanical vs Phosphor) and **navigation pattern** (bottom tabs vs top nav).

The V8.0 implementation should:
1. Port botanical icons to web (brand purity)
2. Add responsive sidebar navigation
3. Create Uber-style map with botanical pins
4. Maintain all existing functionality

**Mobile is the source of truth. Web aligns TO mobile.**

---

*Generated from Phase 0 Audit - V8.0 Web/Mobile Alignment*
