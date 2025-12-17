# Vlossom Iconography Report

**Version:** 1.0.0
**Created:** December 17, 2025
**Total Icons:** 28

---

## Overview

All icons in this collection derive from the Vlossom flower SVG linework style located in `/design/brand/logos/`. Every icon represents a **system state, ritual phase, or growth condition** - never decoration.

### Design Principles

1. **Stroke weight:** Consistent 1.5pt matching brand SVGs
2. **Curvature:** Organic, rounded, no sharp angles
3. **Color:** Primary Purple (#311E6B) only
4. **Meaning:** Every icon communicates state, not action alone

---

## Navigation Icons (6)

| Icon | File | System Meaning | Familiar Metaphor | Flower Derivation |
|------|------|----------------|-------------------|-------------------|
| Home | `nav/home.svg` | Center, belonging | House | Flower core with radiating petals |
| Search | `nav/search.svg` | Discovery, outward seeking | Magnifier | Radiating petals with stem extension |
| Calendar | `nav/calendar.svg` | Time, rhythm, cycles | Calendar | Cyclical petal ring |
| Wallet | `nav/wallet.svg` | Value, safety, containment | Wallet | Closed bud (contained bloom) |
| Profile | `nav/profile.svg` | Identity, self | User | Single flower mark with stem |
| Notifications | `nav/notifications.svg` | Awareness, emerging | Bell | Budding flower about to bloom |

### Navigation Icon Rules
- **Meaning must be familiar** (users recognize intent)
- **Drawing must be botanical** (never literal icons)
- Animation: subtle scale/opacity shift on active tab (180-220ms)

---

## State Icons (5)

| Icon | File | System Meaning | Visual Expression |
|------|------|----------------|-------------------|
| Healthy | `state/healthy.svg` | Balanced, stable | Full open bloom, all petals visible |
| Growing | `state/growing.svg` | Active improvement | Petals partially opening, varied opacity |
| Resting | `state/resting.svg` | Recovery phase | Closed/folded petals, settled form |
| Needs Care | `state/needs-care.svg` | Attention required | Asymmetric petals, slight droop |
| Transition | `state/transition.svg` | Phase change | Mid-unfold motion, transitional opacity |

### State Icon Rules
- Icons must **visibly change form** across states
- Healthy = full opacity, open form
- Needs attention = partial opacity, subtle asymmetry
- Animation: one-time unfold/settle on state change (300-500ms)

---

## Care Icons (4)

| Icon | File | System Meaning | Component Usage |
|------|------|----------------|-----------------|
| Ritual | `care/ritual.svg` | Hair ritual (intentional care) | RitualListItem |
| Wash Day | `care/wash-day.svg` | Wash routine (cleansing) | ScheduledEvent |
| Protective Style | `care/protective-style.svg` | Protective care (safety) | ServicePrepCard |
| Treatment | `care/treatment.svg` | Treatment phase (focused care) | TreatmentSuggestion |

### Care Icon Rules
- Icons feel **instructional and supportive**, not task-driven
- Based on stem + petal combinations
- Used in intentional care moments only

---

## Growth Icons (5)

| Icon | File | System Meaning | Visual Expression |
|------|------|----------------|-------------------|
| Stage 1 | `growth/stage-1.svg` | Early growth | Single petal emerging |
| Stage 2 | `growth/stage-2.svg` | Developing | Two opposite petals |
| Stage 3 | `growth/stage-3.svg` | Maturing | Four petals (cardinal directions) |
| Stage 4 | `growth/stage-4.svg` | Flourishing | Full five-petal bloom |
| Meter | `growth/meter.svg` | Progress over time | Radial petal segments |

### Growth Icon Rules
- Growth visualized as **opening and clarity**, not points or bars
- Petal count = progress level
- Animation: gradual petal opening on milestone (300-500ms, earned)

---

## Community Icons (8)

| Icon | File | System Meaning | Usage |
|------|------|----------------|-------|
| Community | `community/community.svg` | Community presence | Social features |
| Support | `community/support.svg` | Platform support | Help center |
| Learning | `community/learning.svg` | Knowledge/potential | Tutorials, education |
| Verified | `community/verified.svg` | Trust/authenticity | Verification badges |
| Favorite | `community/favorite.svg` | Affection/love | Like buttons, favorites |
| Settings | `community/settings.svg` | Configuration | Settings, preferences |
| Add | `community/add.svg` | Create/new | Add buttons |
| Close | `community/close.svg` | Dismiss/close | Modal close, dismiss |

---

## Icon Consistency Checklist

All icons in this collection pass the following checks:

- [x] Stroke weight matches flower SVG (1.5pt)
- [x] No sharp angles (all organic curves)
- [x] Organic curvature preserved
- [x] Semantic meaning is clear
- [x] No decorative-only usage
- [x] Derived from flower core/petals/stems/center
- [x] Primary Purple (#311E6B) only

---

## Usage Guidelines

### DO
- Use icons to represent **system states**
- Derive variations from existing linework
- Maintain consistent stroke weight
- Apply organic curves throughout

### DO NOT
- Use generic icon libraries (Heroicons, Lucide, Material, Feather)
- Use literal representations (no actual house, bell, wallet)
- Use sharp angles or geometric forms
- Use icons as decoration without semantic meaning

---

## Animation Specifications

### Navigation Icons
- Trigger: Active tab change
- Duration: 180-220ms
- Easing: ease-out
- Motion: Subtle scale or opacity shift
- Rule: Never pulse or bounce

### State Icons
- Trigger: State change only
- Duration: 300-500ms
- Easing: ease-out
- Motion: One-time unfold/close
- Rule: Never loop or flash

### Growth Icons
- Trigger: Milestone reached
- Duration: 300-500ms
- Motion: Gradual petal opening
- Feel: Earned, not automatic

---

## File Structure

```
design/brand/icons/
├── nav/
│   ├── home.svg
│   ├── search.svg
│   ├── calendar.svg
│   ├── wallet.svg
│   ├── profile.svg
│   └── notifications.svg
├── state/
│   ├── healthy.svg
│   ├── growing.svg
│   ├── resting.svg
│   ├── needs-care.svg
│   └── transition.svg
├── care/
│   ├── ritual.svg
│   ├── wash-day.svg
│   ├── protective-style.svg
│   └── treatment.svg
├── growth/
│   ├── stage-1.svg
│   ├── stage-2.svg
│   ├── stage-3.svg
│   ├── stage-4.svg
│   └── meter.svg
├── community/
│   ├── community.svg
│   ├── support.svg
│   ├── learning.svg
│   ├── verified.svg
│   ├── favorite.svg
│   ├── settings.svg
│   ├── add.svg
│   └── close.svg
└── ICONOGRAPHY_REPORT.md
```

---

## Source Reference

All icons derive from the Vlossom flower linework:
- **Source:** `/design/brand/logos/Vlossom-icon-purple.svg`
- **Color:** Primary Purple #311E6B
- **Style:** Organic curves, botanical forms, semantic meaning
