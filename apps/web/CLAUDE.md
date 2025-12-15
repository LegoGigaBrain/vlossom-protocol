# Web App

> Purpose: Main customer-facing web application (PWA) for booking services, managing profiles, and wallet interactions.

## Canonical References
- [Doc 15: Frontend UX Flows](../../docs/vlossom/15-frontend-ux-flows.md)
- [Doc 16: UI Components and Design System](../../docs/vlossom/16-ui-components-and-design-system.md)
- [Doc 17: Property Owner and Chair Rental Module](../../docs/vlossom/17-property-owner-and-chair-rental-module.md)
- [Doc 19: Travel and Cross-Border Bookings](../../docs/vlossom/19-travel-and-cross-border-bookings.md)
- [Doc 27: UX Flows and Wireframes](../../docs/vlossom/27-ux-flows-and-wireframes.md)

## Current Implementation Status

**V1.5 Complete - Property Owner + Reputation** (Dec 15, 2025)

### Routes
| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Landing page | ✅ |
| `/onboarding` | Signup with role selection | ✅ |
| `/login` | Email/password login | ✅ |
| `/wallet` | Balance, send, receive, history | ✅ |
| `/stylists` | Stylist discovery with filters | ✅ |
| `/stylists/[id]` | Stylist profile + booking | ✅ |
| `/bookings` | My Bookings list | ✅ |
| `/bookings/[id]` | Booking details + cancel | ✅ |
| `/stylist/dashboard` | Dashboard overview | ✅ M3 |
| `/stylist/dashboard/requests` | Booking requests queue | ✅ M3 |
| `/stylist/dashboard/services` | Services CRUD | ✅ M3 |
| `/stylist/dashboard/availability` | Weekly schedule + exceptions | ✅ M3 |
| `/stylist/dashboard/profile` | Profile editor | ✅ M3 |
| `/stylist/dashboard/earnings` | Earnings dashboard | ✅ M3 |
| `/help` | Help center home | ✅ M5 |
| `/help/getting-started` | Getting started guide | ✅ M5 |
| `/help/faq` | FAQ page | ✅ M5 |
| `/admin/paymaster` | Paymaster monitoring dashboard | ✅ M5 |
| `/property-owner/dashboard` | Property owner overview | ✅ V1.5 |
| `/property-owner/properties` | Property management CRUD | ✅ V1.5 |
| `/property-owner/properties/[id]` | Property details + chairs | ✅ V1.5 |
| `/property-owner/chairs` | Chair inventory management | ✅ V1.5 |
| `/property-owner/rentals` | Chair rental requests | ✅ V1.5 |
| `/property-owner/earnings` | Property earnings dashboard | ✅ V1.5 |
| `/reputation` | Reputation dashboard | ✅ V1.5 |
| `/stylists/[id]/reviews` | Stylist reviews page | ✅ V1.5 |

## Key Directories

### `app/` — Next.js App Router Pages
- `layout.tsx` — Root layout with Playfair Display font, theme provider
- `page.tsx` — Landing page with CTAs
- `onboarding/page.tsx` — Signup flow with role selection
- `login/page.tsx` — Email/password authentication
- `wallet/page.tsx` — Wallet dashboard (balance, send, receive, history)
- `stylists/page.tsx` — Stylist discovery with category filters
- `stylists/[id]/page.tsx` — Stylist profile with services
- `bookings/page.tsx` — My Bookings with filter tabs
- `bookings/[id]/page.tsx` — Booking details with cancel option

**`stylist/dashboard/`** — Stylist Dashboard (M3)
- `layout.tsx` — Dashboard layout with tabbed navigation
- `page.tsx` — Dashboard overview with stats + today's bookings
- `requests/page.tsx` — Booking requests queue
- `services/page.tsx` — Services CRUD management
- `availability/page.tsx` — Weekly schedule + date exceptions
- `profile/page.tsx` — Profile editor with portfolio
- `earnings/page.tsx` — Earnings dashboard with chart

### `components/` — Reusable UI Components

**`ui/`** — Base primitives (Button, Input, Label, Dialog)

**`wallet/`** — Wallet UI (M1)
- `balance-card.tsx` — Fiat-first balance with currency toggle
- `send-dialog.tsx` — P2P transfer flow
- `receive-dialog.tsx` — QR code generation
- `transaction-list.tsx` — History with filters
- `add-money-dialog.tsx` — MoonPay onramp
- `withdraw-dialog.tsx` — MoonPay offramp

**`stylists/`** — Stylist Discovery (M2)
- `stylist-card.tsx` — Grid card with avatar, rating, services
- `stylist-grid.tsx` — Responsive grid with loading skeletons
- `category-filter.tsx` — Service category dropdown
- `service-card.tsx` — Service with price and duration
- `availability-calendar.tsx` — Weekly availability display
- `portfolio-gallery.tsx` — Image gallery with lightbox

**`booking/`** — Booking Flow (M2)
- `booking-dialog.tsx` — Multi-step dialog (7 steps)
- `service-step.tsx` — Service selection
- `datetime-picker.tsx` — Calendar + time slots
- `location-step.tsx` — Location type toggle
- `summary-step.tsx` — Price breakdown
- `payment-step.tsx` — USDC payment flow

**`bookings/`** — Booking Management (M2)
- `booking-list.tsx` — List with empty states
- `booking-card.tsx` — Booking item card
- `booking-details.tsx` — Full booking info
- `status-badge.tsx` — Color-coded status
- `cancel-dialog.tsx` — Cancellation with refund preview

**`dashboard/`** — Stylist Dashboard (M3)
- `stats-cards.tsx` — Earnings, pending requests, upcoming count
- `upcoming-bookings.tsx` — Next 7 days preview
- `pending-requests-preview.tsx` — Quick action queue
- `todays-bookings.tsx` — Active bookings with start/complete actions
- `request-card.tsx` — Request with customer info + approve/decline
- `request-details-dialog.tsx` — Full request details view
- `decline-dialog.tsx` — Decline with reason
- `service-list.tsx` — Services list with actions
- `service-form.tsx` — Create/edit service form
- `service-dialog.tsx` — Service modal wrapper
- `weekly-schedule.tsx` — Recurring availability grid
- `time-block-editor.tsx` — Set hours per day
- `exception-manager.tsx` — Block specific dates
- `profile-form.tsx` — Bio, location, operating mode
- `portfolio-upload.tsx` — Image gallery manager
- `profile-preview.tsx` — Customer view preview
- `earnings-summary.tsx` — Total, this month, pending
- `earnings-chart.tsx` — Weekly bar chart (CSS-based)
- `payout-history.tsx` — List of past payouts
- `active-booking-card.tsx` — In-progress booking with actions
- `start-service-dialog.tsx` — Confirm service start
- `complete-service-dialog.tsx` — Confirm completion + payout breakdown
- `completion-success.tsx` — Payment released confirmation

### `hooks/` — React Query Hooks
- `use-auth.ts` — Authentication state
- `use-wallet.ts` — Wallet balance + transactions
- `use-stylists.ts` — Stylist listing + single stylist
- `use-bookings.ts` — Bookings CRUD + mutations
- `use-dashboard.ts` — Dashboard summary data (M3)
- `use-stylist-bookings.ts` — Stylist's bookings with mutations (M3)
- `use-stylist-services.ts` — Services CRUD hooks (M3)
- `use-stylist-availability.ts` — Availability management (M3)
- `use-stylist-profile.ts` — Profile management (M3)
- `use-stylist-earnings.ts` — Earnings queries (M3)
- `use-properties.ts` — Property CRUD + mutations (V1.5)
- `use-chairs.ts` — Chair management hooks (V1.5)
- `use-rentals.ts` — Rental request workflow (V1.5)
- `use-reputation.ts` — Reputation score queries (V1.5)
- `use-reviews.ts` — Review CRUD hooks (V1.5)

**`onboarding/`** — User Onboarding (M5)
- `welcome-modal.tsx` — First-time user welcome
- `feature-tour.tsx` — Interactive 5-step feature tour
- `onboarding-provider.tsx` — Context provider for onboarding state
- `index.ts` — Barrel export

**`admin/paymaster/`** — Paymaster Dashboard (M5)
- `stats-cards.tsx` — Paymaster stats (balance, total sponsored, tx count)
- `gas-usage-chart.tsx` — Recharts visualization
- `transactions-table.tsx` — Paginated transaction history
- `alerts-panel.tsx` — Alert configuration UI

**`property-owner/`** — Property Owner Dashboard (V1.5)
- `dashboard-stats.tsx` — Property overview stats
- `property-list.tsx` — Property cards grid
- `property-form.tsx` — Create/edit property
- `chair-inventory.tsx` — Chair management
- `chair-form.tsx` — Create/edit chair
- `rental-requests.tsx` — Rental request queue
- `rental-card.tsx` — Rental request card
- `earnings-summary.tsx` — Property earnings

**`reputation/`** — Reputation System (V1.5)
- `reputation-dashboard.tsx` — User reputation overview
- `score-card.tsx` — Reputation score display
- `score-breakdown.tsx` — TPS, reliability, feedback breakdown
- `event-history.tsx` — Reputation event timeline
- `review-list.tsx` — Reviews list
- `review-form.tsx` — Submit review form
- `verification-badge.tsx` — Verified badge component

### `lib/` — Utilities & API Clients
- `auth-client.ts` — Auth API (signup, login, logout)
- `wallet-client.ts` — Wallet API (balance, send, receive)
- `stylist-client.ts` — Stylist API with types
- `booking-client.ts` — Booking API with cancellation logic
- `dashboard-client.ts` — Dashboard API client with all types (M3)
- `stylist-api-client.ts` — Stylist-specific API calls (M3)
- `utils.ts` — Formatting utilities (price, duration, date)
- `theme/` — Brand theme provider system
- `posthog.ts` — PostHog analytics client (M5)
- `property-client.ts` — Property API client (V1.5)
- `chair-client.ts` — Chair management API (V1.5)
- `rental-client.ts` — Chair rental API (V1.5)
- `reputation-client.ts` — Reputation score API (V1.5)
- `review-client.ts` — Review CRUD API (V1.5)

### Monitoring & Analytics (M5)
- `sentry.client.config.ts` — Browser error tracking
- `sentry.server.config.ts` — Server-side error tracking
- `sentry.edge.config.ts` — Edge runtime tracking

## Local Conventions
- Use Next.js App Router (not Pages Router)
- All components use design tokens from `lib/theme/`
- Styling via Tailwind + CSS variables for theming
- State management: React Query for server state, React Context for UI state
- Path alias: `@/*` maps to `./*`

## Dependencies
- External: Next.js 14, React 18, Tailwind CSS, Radix UI, React Query, qrcode.react

## Key Patterns

### Multi-Step Dialog Pattern
Used for booking flow and wallet dialogs:
```typescript
type Step = "step1" | "step2" | "processing" | "success";
const [step, setStep] = useState<Step>("step1");
```

### Price Formatting (Fiat-First)
```typescript
formatPrice(35000) // → "R350.00" (ZAR)
formatDuration(90) // → "1h 30min"
```

### Cancellation Policy (Time-Based)
| Hours Before | Refund |
|--------------|--------|
| > 24 hours | 100% |
| 12-24 hours | 75% |
| 2-12 hours | 50% |
| < 2 hours | 0% |

### Booking State Machine (M3)
```
REQUESTED → (approve) → PENDING_PAYMENT → (pay) → CONFIRMED
CONFIRMED → (start) → IN_PROGRESS → (complete) → AWAITING_CUSTOMER_CONFIRMATION
AWAITING_CUSTOMER_CONFIRMATION → (confirm/timeout) → SETTLED
```

### Payout Calculation
```typescript
// Platform fee: 10%
platformFeeCents = Math.round(quoteAmountCents * 0.10)
stylistPayoutCents = quoteAmountCents - platformFeeCents
```

## Gotchas
- Always gasless UX — no wallet connection prompts for basic flows
- Fiat-first display — show prices in local currency (ZAR), token amounts secondary
- Brand tone: warm, premium, trustful (see Doc 24)
- All API calls use React Query with appropriate stale times
- Loading states must use skeleton patterns, not spinners
- Empty states must be helpful and guide user to action
