# Design Assets

> Purpose: Brand identity, design tokens, and visual assets for the Vlossom ecosystem.

## Canonical References
- [Doc 16: UI Components and Design System](../docs/vlossom/16-ui-components-and-design-system.md)
- [Doc 24: Brand Narrative & Lore](../docs/vlossom/24-brand-narrative-and-lore.md)

## Key Directories

### `tokens/` — Design Tokens
- `vlossom-light.json` — Light mode theme tokens (colors, typography, spacing, shadows, motion)
- `vlossom-dark.json` — Dark mode theme tokens

### `brand/logos/` — Logo Assets
- `Favicon-purple.svg` — Favicon (purple variant)
- `Favicon-cream.svg` — Favicon (cream variant)
- `Wordmark-purple.svg` — Wordmark logo (purple)
- `Wordmark-cream.svg` — Wordmark logo (cream)
- `Vertical-lock-purple.svg` — Vertical lockup (purple)
- `Vertical-lock-cream.svg` — Vertical lockup (cream)

### `brand/identity/` — Brand Identity
- `brand identity card.png` — Brand identity reference card

## Brand Colors (Light Mode)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#311E6B` | Deep purple - main brand color |
| Primary Soft | `#ADA5C4` | Soft purple - secondary brand |
| Secondary | `#EFE3D0` | Cream - surfaces, cards |
| Accent | `#FF510D` | Orange - CTAs, warnings |
| Tertiary | `#A9D326` | Green - success states |
| Background | `#FFFFFF` | Page background |
| Surface | `#EFE3D0` | Card backgrounds |
| Text Primary | `#161616` | Main body text |
| Text Secondary | `#6F6F6F` | Muted text |

## Typography

| Token | Value |
|-------|-------|
| Primary Font | Inter, system-ui |
| Display Font | Playfair Display |
| Mono Font | SF Mono, Fira Code |

## Token Structure

Each token file contains:
- `color` — Semantic color tokens
- `font` — Font family definitions
- `fontSize` — Type scale (xs → 4xl)
- `fontWeight` — Weight scale (300 → 700)
- `lineHeight` — Line height options
- `radius` — Border radius scale
- `shadow` — Box shadow presets
- `spacing` — Spacing scale (0 → 5xl)
- `motion` — Animation timing
- `breakpoint` — Responsive breakpoints
- `zIndex` — Layering z-index values

## Usage in Code

### Tailwind Integration
Tokens are integrated via `apps/web/tailwind.config.js`:
```js
colors: {
  primary: '#311E6B',
  'primary-soft': '#ADA5C4',
  secondary: '#EFE3D0',
  accent: '#FF510D',
  tertiary: '#A9D326',
}
```

### Theme Provider (Future)
When dark mode is implemented:
```tsx
import { useBrandTheme } from '@/lib/theme'

function Component() {
  const { color, font, spacing } = useBrandTheme()
  return <div style={{ color: color.primary }}>...</div>
}
```

## Brand Guidelines

### Emotional Constraints
Per CLAUDE.project (Section 5.5):
- **Calm over urgency** — No anxiety-inducing flows
- **Rest over extraction** — Respect human energy
- **Dignity over optimization** — Users are not units
- **Growth as cultivation** — Not hustle, but becoming

### Logo Usage
- Use purple variants on light backgrounds
- Use cream variants on dark/purple backgrounds
- Maintain minimum clear space around logos
- Never distort or recolor logos

## Gotchas
- Always use semantic color tokens, not raw hex values
- Playfair Display is for headings only, Inter for body
- Dark mode tokens exist but theme provider not yet implemented
- All monetary values display in local fiat first (ZAR), USDC secondary
