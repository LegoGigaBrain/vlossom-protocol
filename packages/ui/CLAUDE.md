# UI Design System

**Version**: V7.4.0 | December 2025

> Purpose: Shared React component library implementing Vlossom's design system with brand tokens and Radix primitives.

## Canonical References
- [Doc 16: UI Components and Design System](../../docs/vlossom/16-ui-components-and-design-system.md)
- [Doc 24: Brand Narrative and Lore](../../docs/vlossom/24-brand-narrative-and-lore.md)

## Key Files
- `src/index.ts` — Public exports
- `src/utils.ts` — `cn()` utility for class merging

## Local Conventions
- Components built on Radix UI primitives
- Use `class-variance-authority` for variants
- All components support dark mode (future)
- Export from `src/index.ts` only

## Dependencies
- External: Radix UI, clsx, tailwind-merge, class-variance-authority
- Peer: React 18, React DOM 18

## Design Tokens
- Primary (brand-rose): `#311E6B` (deep purple — empowerment)
- Accent Orange: `#FF510D` (sacred — growth/celebration only)
- Success: `#10B981` (green — healthy states)
- Warning: `#F59E0B` (amber — caution, NOT orange)
- Error: `#EF4444` (red — errors, NOT orange)

## Gotchas
- Emotional constraints apply: calm over urgency, dignity over optimization
- No aggressive colors (red warnings sparingly)
- All interactions should feel unhurried
