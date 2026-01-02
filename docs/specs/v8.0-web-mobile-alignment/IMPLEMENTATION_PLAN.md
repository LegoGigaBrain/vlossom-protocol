# V8.0 Web/Mobile Alignment - Implementation Plan

> **Purpose**: Align web app to mobile app design, creating a unified experience that scales from phone to desktop.
>
> **Philosophy**: Mobile is the source of truth. Web should feel like the mobile app scaling up, not a separate product.

---

## Decision Log (From Chat Discussion)

### 1. Icon System (Option A: Brand Purity)
- [x] Botanical icons for ALL navigation (web + mobile)
- [x] Phosphor icons ONLY for social sharing features
- [x] Custom botanical SVGs for map pins (not Phosphor)

### 2. Navigation Architecture
| Platform | Pattern | Details |
|----------|---------|---------|
| Mobile | Bottom tab bar | 5 tabs: Home, Browse, Wallet, Notifications, Profile |
| Tablet | Left sidebar (icons only) | Same 5 items, compact ~64px |
| Desktop | Left sidebar (icons + labels) | Same 5 items, full ~200px |
| Breakpoint | 768px | Mobile → Tablet/Desktop transition |

### 3. Tab Definitions
| Tab | Label | Purpose | Current State |
|-----|-------|---------|---------------|
| Home | Home | Map-first discovery, primary search, quick booking | Mobile: Implemented |
| Browse | Browse | Deeper exploration, following feed, timeline (future: posts/announcements) | Mobile: Partially implemented |
| Wallet | Wallet | Financial hub, DeFi layer, elevated/distinct treatment | Mobile: Implemented |
| Notifications | Alerts | Global inbox | Mobile: Implemented |
| Profile | Profile | Identity, hair health, role dashboards | Mobile: Implemented |

### 4. Header (Desktop/Tablet)
- **Minimal header**: Logo + Wallet Balance (fiat-first: R450.00) + Avatar
- **No search in header** - search IS the map on Home tab
- **No notification bell in header** - sidebar has it (avoid anxiety-inducing redundancy)
- **Intentional redundancy**: Wallet balance + avatar appear in both header and sidebar (identity anchors)

### 5. Wallet Tab Elevation
- Strategic visual distinction in sidebar
- Teaches users about the DeFi layer
- On mobile: elevated, centered, pill-shaped background
- On web: same visual treatment in sidebar

### 6. Map Experience (Uber-Style)
| Aspect | Decision |
|--------|----------|
| Provider | Google Maps (consistency with mobile) |
| Style | Muted/desaturated, brand-tinted (not default colorful) |
| Pins | Custom botanical SVGs (not Phosphor) |

### 7. Map Pin Types
| Type | Icon | Behavior | Color |
|------|------|----------|-------|
| Salon | 🪴 Potted plant | Static, larger | Primary purple |
| Fixed Stylist | 🌺 Hibiscus | Static, medium | Primary purple |
| Mobile Stylist | 🌼 Daisy | Animated pulse + live position | Primary purple with accent glow |

### 8. Pin Interactions
| Platform | Interaction |
|----------|-------------|
| Mobile | Tap → tooltip preview → bottom sheet |
| Desktop | Click → tooltip preview → side panel |

### 9. PWA Status
- [x] Already implemented (confirmed in code)
- [x] manifest.json with `display: standalone`
- [x] Apple Web App meta tags

---

## Implementation Phases

### Phase 0: Audit (Research Only)
**Goal**: Document current state, identify gaps, ensure alignment doesn't add/subtract unintentionally.

#### 0.1 Component Audit
Compare `apps/mobile/src/components/ui/` vs `apps/web/components/ui/`:
- [ ] Button styles (shape, colors, states)
- [ ] Card styles (shadows, borders, padding)
- [ ] Input styles (height, border radius, focus states)
- [ ] Modal/Dialog patterns
- [ ] Empty states (illustrations, copy)
- [ ] Skeleton loaders (shimmer style)
- [ ] Badge/Chip components

#### 0.2 User Journey Audit
Compare screen-by-screen:
- [ ] Booking flow (mobile vs web)
- [ ] Wallet flow (mobile vs web)
- [ ] Profile/Settings flow (mobile vs web)
- [ ] Discovery/Search flow (mobile vs web)
- [ ] Onboarding flow (if exists)

#### 0.3 Deliverable
- `docs/specs/v8.0-web-mobile-alignment/AUDIT_REPORT.md`

---

### Phase 1: External Services Documentation
**Goal**: Track all external services, costs, and dependencies.

#### 1.1 Create Tracking Document
- [ ] Create `docs/project/external-services.md`
- [ ] Document: Service name, purpose, pricing tier, monthly cost estimate, API key location
- [ ] Include: Google Maps, Sentry, PostHog, Vercel, Railway, Redis Cloud, etc.

#### 1.2 Deliverable
- `docs/project/external-services.md`

---

### Phase 2: Port Botanical Icons to Web Navigation
**Goal**: Unified icon system using mobile's botanical icons on web.

#### 2.1 Icon Component Alignment
- [ ] Audit existing `apps/web/components/ui/vlossom-icons.tsx` (15 icons exist)
- [ ] Compare with `apps/mobile/src/components/icons/VlossomIcons.tsx` (28 icons)
- [ ] Port any missing icons from mobile to web
- [ ] Ensure identical SVG paths and styling

#### 2.2 Replace Phosphor Navigation Icons
Current web navigation uses Phosphor via `icon-map.ts`. Replace with botanical:
- [ ] Home → VlossomHome
- [ ] Search/Browse → VlossomSearch
- [ ] Wallet → VlossomWallet
- [ ] Notifications → VlossomNotifications
- [ ] Profile → VlossomProfile
- [ ] Settings → VlossomSettings
- [ ] Add → VlossomAdd
- [ ] Close → VlossomClose
- [ ] Favorite → VlossomFavorite
- [ ] Back → VlossomBack (chevron)

#### 2.3 Keep Phosphor For
- Social icons (Twitter, Facebook, Instagram, etc.)
- Generic utility icons in non-navigation contexts (if needed)

#### 2.4 Deliverables
- Updated `apps/web/components/ui/vlossom-icons.tsx`
- Updated `apps/web/components/icons/icon-map.ts` (for backward compatibility)

---

### Phase 3: Web Navigation System (Sidebar + Header)
**Goal**: Implement responsive navigation matching mobile mental model.

#### 3.1 Create Sidebar Component
File: `apps/web/components/layout/Sidebar.tsx`

```
Features:
- 5 nav items: Home, Browse, Wallet, Alerts, Profile
- Wallet item elevated/distinct (pill background, centered icon)
- Responsive: icons-only at tablet, icons+labels at desktop
- Active state with botanical icon fill
- Hover states with brand-rose background
```

#### 3.2 Create Minimal Header Component
File: `apps/web/components/layout/AppHeader.tsx`

```
Features:
- Logo (left)
- Wallet balance in fiat (right) - e.g., "R450.00"
- Avatar with dropdown (right)
- Height: 56-64px
- No search, no notification bell
```

#### 3.3 Create App Shell Layout
File: `apps/web/components/layout/AppShell.tsx`

```
Features:
- Combines Sidebar + Header + Content area
- Responsive breakpoints:
  - < 768px: Bottom nav (or hide nav, mobile-only experience)
  - 768px - 1024px: Sidebar (icons only) + Header
  - > 1024px: Sidebar (icons + labels) + Header
```

#### 3.4 Deliverables
- `apps/web/components/layout/Sidebar.tsx`
- `apps/web/components/layout/AppHeader.tsx`
- `apps/web/components/layout/AppShell.tsx`
- Update route layouts to use AppShell

---

### Phase 4: Botanical Map Pin SVGs
**Goal**: Create custom map markers matching Vlossom visual language.

#### 4.1 Design Specifications
All pins derived from botanical icon style:
- Stroke width: 1.5px
- Primary fill: #311E6B (brand purple)
- Container: Cream (#EFE3D0) background with soft shadow
- Size: 40x40px base, scalable

#### 4.2 Pin Designs
| Pin | SVG Concept | Notes |
|-----|-------------|-------|
| Salon | Potted plant with 3-4 leaves | Stationary, larger (48x48) |
| Fixed Stylist | Single hibiscus flower | Stationary, medium (40x40) |
| Mobile Stylist | Daisy with radiating petals | Animated, medium (40x40) |

#### 4.3 Animation (Mobile Stylist)
- Subtle "breathing" pulse (scale 1.0 → 1.05 → 1.0)
- Duration: 2s, ease-in-out
- Position updates smoothly (not jumping)

#### 4.4 Deliverables
- `apps/web/components/map/markers/SalonMarker.tsx`
- `apps/web/components/map/markers/FixedStylistMarker.tsx`
- `apps/web/components/map/markers/MobileStylistMarker.tsx`
- `apps/mobile/src/components/map/markers/` (same for mobile)
- SVG source files in `design/brand/icons/map-pins/`

---

### Phase 5: Google Maps Styled Theme
**Goal**: Create Uber-like muted map aesthetic.

#### 5.1 Map Style JSON
Create custom Google Maps style that:
- Desaturates all colors (grayscale base)
- Simplifies labels (fewer POIs)
- Uses brand purple (#311E6B) for main roads
- Uses cream (#EFE3D0) for land areas
- Makes botanical pins stand out against muted background

#### 5.2 Deliverables
- `apps/web/lib/map-styles.json`
- `apps/mobile/src/lib/map-styles.json` (same)
- Shared config in `packages/config/map-styles.json` (optional)

---

### Phase 6: Stylized Map Component (Web)
**Goal**: Full-featured map component for web discovery.

#### 6.1 Map Component
File: `apps/web/components/map/DiscoveryMap.tsx`

```
Features:
- Google Maps with custom styling
- Botanical pin markers (Phase 4)
- Clustered pins when zoomed out
- Click pin → tooltip preview
- Click tooltip → side panel with stylist details
- User location indicator
- Zoom/pan controls
```

#### 6.2 Side Panel Component
File: `apps/web/components/map/StylistPanel.tsx`

```
Features:
- Slides in from right (or expands inline)
- Shows: Avatar, name, rating, distance, services, pricing
- Quick book CTA
- Message CTA
- Close button
```

#### 6.3 Deliverables
- `apps/web/components/map/DiscoveryMap.tsx`
- `apps/web/components/map/MapTooltip.tsx`
- `apps/web/components/map/StylistPanel.tsx`
- `apps/web/components/map/MapControls.tsx`

---

### Phase 7: Component Alignment Fixes
**Goal**: Address findings from Phase 0 audit.

#### 7.1 Scope
Based on audit report, fix any inconsistencies in:
- Button styles
- Card styles
- Input styles
- Modal patterns
- Empty states
- Loading states

#### 7.2 Approach
- Mobile is source of truth
- Web components should match mobile exactly
- Use same border-radius, shadows, spacing, colors

#### 7.3 Deliverables
- Updated web components to match mobile
- Shared component documentation

---

### Phase 8: User Journey Alignment
**Goal**: Ensure user flows match between platforms.

#### 8.1 Priority Flows
1. Booking flow (discovery → stylist profile → book → confirm → track)
2. Wallet flow (balance → fund → send → history)
3. Profile flow (view → edit → settings)

#### 8.2 Approach
- Document current mobile flow (screenshots/descriptions)
- Compare to web flow
- Identify gaps
- Implement missing screens/steps on web

#### 8.3 Deliverables
- Updated web pages to match mobile flows
- Flow documentation in `docs/specs/v8.0-web-mobile-alignment/`

---

### Phase 9: Documentation Sync
**Goal**: Update all context files to reflect V8.0 changes.

#### 9.1 Files to Update
- [ ] `CLAUDE.md` (root)
- [ ] `apps/web/CLAUDE.md`
- [ ] `apps/mobile/CLAUDE.md`
- [ ] `IMPLEMENTATION_STATUS.md`
- [ ] `docs/project/changelog.md`
- [ ] `docs/STYLE_BLUEPRINT.md`

#### 9.2 New Documentation
- [ ] `docs/specs/v8.0-web-mobile-alignment/AUDIT_REPORT.md`
- [ ] `docs/specs/v8.0-web-mobile-alignment/IMPLEMENTATION_PLAN.md` (this file)
- [ ] `docs/project/external-services.md`

---

## File Structure Summary

```
docs/
├── project/
│   └── external-services.md (NEW)
├── specs/
│   └── v8.0-web-mobile-alignment/
│       ├── IMPLEMENTATION_PLAN.md (this file)
│       └── AUDIT_REPORT.md (Phase 0 output)

apps/web/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx (NEW)
│   │   ├── AppHeader.tsx (NEW)
│   │   └── AppShell.tsx (NEW)
│   ├── map/
│   │   ├── DiscoveryMap.tsx (NEW)
│   │   ├── MapTooltip.tsx (NEW)
│   │   ├── StylistPanel.tsx (NEW)
│   │   ├── MapControls.tsx (NEW)
│   │   └── markers/
│   │       ├── SalonMarker.tsx (NEW)
│   │       ├── FixedStylistMarker.tsx (NEW)
│   │       └── MobileStylistMarker.tsx (NEW)
│   └── ui/
│       └── vlossom-icons.tsx (UPDATED)
├── lib/
│   └── map-styles.json (NEW)

design/brand/icons/
└── map-pins/
    ├── salon-pin.svg (NEW)
    ├── fixed-stylist-pin.svg (NEW)
    └── mobile-stylist-pin.svg (NEW)
```

---

## Success Criteria

### Visual Alignment
- [ ] Web and mobile use identical botanical icons for navigation
- [ ] Web sidebar matches mobile bottom nav mental model
- [ ] Design tokens (colors, spacing, typography) are identical
- [ ] Component patterns (cards, buttons, inputs) look identical

### Functional Alignment
- [ ] User flows (booking, wallet, profile) match between platforms
- [ ] Map experience feels consistent (Uber-like, botanical pins)
- [ ] PWA experience on mobile web matches native mobile feel

### Documentation
- [ ] All CLAUDE.md files updated
- [ ] External services documented with costs
- [ ] V8.0 changelog entry added

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Google Maps costs | Monitor usage, implement caching, consider rate limiting |
| Icon inconsistency | Single source of truth in `design/brand/icons/`, generate both platforms |
| Breaking existing flows | Audit first (Phase 0), incremental changes, test after each phase |
| Context loss | Commit after each phase, detailed documentation |

---

## Timeline

No time estimates provided (per project conventions). Phases are sequential with dependencies noted. Execute in order, commit after each phase.

---

## Approval

- [ ] User approves this implementation plan
- [ ] Proceed with Phase 0 (Audit)
