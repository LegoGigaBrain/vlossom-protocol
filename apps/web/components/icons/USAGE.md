# Vlossom Icon System

## Overview

This icon system uses [Phosphor Icons](https://phosphoricons.com/) as a bridge solution while custom botanical icons are being developed. The architecture ensures that when custom icons are ready, only the `icon-map.ts` file needs to change.

## Quick Start

```tsx
import { Icon } from '@/components/icons';

// Basic usage
<Icon name="home" />

// With size
<Icon name="calendar" size="lg" />

// With custom styling
<Icon name="bloom" className="text-accent" />

// With weight (for emphasis)
<Icon name="notifications" weight="fill" />
```

## Convenience Components

```tsx
import { NavIcon, InlineIcon, ButtonIcon, StateIcon } from '@/components/icons';

// Navigation (24px, light weight)
<NavIcon name="home" />

// Inline with text (16px)
<p>Check your <InlineIcon name="calendar" /> schedule</p>

// Inside buttons (20px)
<button><ButtonIcon name="add" /> Add Ritual</button>

// State indicators (supports active prop)
<StateIcon name="bloom" active={isHealthy} />
```

## Icon Tiers

### Tier A: Navigation Icons

Familiar in meaning, used for core navigation and actions.

| Name | Meaning | Usage |
|------|---------|-------|
| `home` | Shelter / Return | Main navigation |
| `calendar` | Cycle / Rhythm | Schedule views |
| `search` | Discovery | Search bars |
| `wallet` | Value / Resource | Financial hub |
| `profile` | Identity | User profile |
| `notifications` | Awareness | Alerts |
| `intelligence` | Insight | Hair health |
| `location` | Place | Map pins |
| `back` | Return | Navigation |
| `close` | Dismiss | Modals, sheets |
| `add` | Create | Add actions |
| `settings` | Configure | Settings |
| `menu` | Options | Menu toggle |

### Tier B: State & Ritual Icons

Botanical latitude, context provides meaning.

| Name | Meaning | Usage |
|------|---------|-------|
| `seed` | Potential / Beginning | New journey |
| `root` | Grounding / Stability | Foundation |
| `petal` | Active Care | Rituals |
| `bloom` | Readiness / Growth | Health state |
| `lotus` | Full flourishing | Peak state |
| `rest` | Stillness | Recovery |
| `settle` | Alignment | Post-ritual |
| `unfold` | Transition | Progress |
| `calmError` | Gentle Warning | Soft alerts |
| `success` | Completion | Success state |
| `empty` | Quiet Intent | Empty states |

## Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| `xs` | 12px | Inline text |
| `sm` | 16px | Compact UI |
| `md` | 20px | Default |
| `lg` | 24px | Navigation |
| `xl` | 32px | Hero moments |
| `2xl` | 40px | Large features |

## Weights

| Weight | Feel | When to use |
|--------|------|-------------|
| `thin` | Delicate | Subtle indicators |
| `light` | **Default** | Most usage |
| `regular` | Standard | Emphasis |
| `bold` | Strong | High emphasis |
| `fill` | Solid | Active/selected states |
| `duotone` | Layered | Decorative (rare) |

## Migration Guide

When custom botanical icons are ready:

1. Create new SVG components in this folder
2. Update `icon-map.ts` to point to custom components
3. No changes needed in any consuming components

## Rules

1. **Always import from `@/components/icons`** - never from `@phosphor-icons/react`
2. **Use semantic names** - `name="bloom"` not `name="flower"`
3. **Default to `light` weight** - it's more organic
4. **Use `fill` weight sparingly** - only for active/selected states
5. **Check the Icon Map** - if you need a new icon, add it to `icon-map.ts` first
