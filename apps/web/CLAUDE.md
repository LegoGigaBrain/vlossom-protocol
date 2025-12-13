# Web App

> Purpose: Main customer-facing web application (PWA) for booking services, managing profiles, and wallet interactions.

## Canonical References
- [Doc 15: Frontend UX Flows](../../docs/vlossom/15-frontend-ux-flows.md)
- [Doc 16: UI Components and Design System](../../docs/vlossom/16-ui-components-and-design-system.md)
- [Doc 17: Property Owner and Chair Rental Module](../../docs/vlossom/17-property-owner-and-chair-rental-module.md)
- [Doc 19: Travel and Cross-Border Bookings](../../docs/vlossom/19-travel-and-cross-border-bookings.md)
- [Doc 27: UX Flows and Wireframes](../../docs/vlossom/27-ux-flows-and-wireframes.md)

## Key Files
- `src/app/layout.tsx` — Root layout with fonts and metadata
- `src/app/page.tsx` — Landing page
- `src/components/` — Reusable UI components
- `tailwind.config.js` — Tailwind theme with Vlossom brand colors

## Local Conventions
- Use Next.js App Router (not Pages Router)
- All components use `@vlossom/ui` primitives
- Styling via Tailwind + design tokens from Doc 16
- State management: React Context + Zustand where needed
- Path alias: `@/*` maps to `./src/*`

## Dependencies
- Internal: `@vlossom/ui`, `@vlossom/types`
- External: Next.js 14, React 18, Tailwind CSS, Radix UI

## Gotchas
- Always gasless UX — no wallet connection prompts for basic flows
- Fiat-first display — show prices in local currency, token amounts secondary
- Brand tone: warm, premium, trustful (see Doc 24)
