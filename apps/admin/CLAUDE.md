# Admin Dashboard

> Purpose: Internal admin panel for moderation, dispute resolution, and platform management.

## Current Version

**V7.0.0 Security & Admin Panel** (December 20, 2025)

Complete admin panel implementation with 8 functional pages, cookie-based authentication, and full API integration.

---

## V7.0.0 Changes

### Complete Admin Panel Implementation ✅

**Core Infrastructure:**
- `src/lib/admin-client.ts` - Base API client with httpOnly cookie auth + CSRF
- `src/hooks/use-admin-auth.ts` - Admin auth hook with role verification
- `src/providers/query-provider.tsx` - React Query setup
- `src/providers/auth-provider.tsx` - Admin auth context
- `src/app/login/page.tsx` - Admin login page
- `src/components/layout/admin-layout.tsx` - Main layout with sidebar
- `src/components/layout/admin-sidebar.tsx` - Navigation (8 items)
- `src/components/layout/admin-header.tsx` - Top header with user menu

**Reusable UI Components:**
- `src/components/ui/data-table.tsx` - Generic sortable table
- `src/components/ui/pagination.tsx` - Pagination controls
- `src/components/ui/filter-bar.tsx` - Search + dropdown filters
- `src/components/ui/stat-card.tsx` - Metric cards with icons
- `src/components/ui/status-badge.tsx` - Status indicators
- `src/components/ui/confirm-dialog.tsx` - Confirmation modal

**Admin Pages:**

| Page | Route | Features |
|------|-------|----------|
| Dashboard | `/` | Key metrics, quick actions overview |
| Users | `/users` | List, search, freeze/unfreeze/verify, detail panel |
| Bookings | `/bookings` | List, status filters, status change, detail panel |
| Sessions | `/sessions` | Real-time IN_PROGRESS bookings with progress tracking |
| Disputes | `/disputes`, `/disputes/[id]` | Full resolution workflow with 8 resolution types |
| Audit Logs | `/logs` | Searchable logs with action/target filters |
| DeFi Config | `/defi` | APY params, fee split, emergency controls |
| Paymaster | `/paymaster` | Balance monitoring, gas tracking, alerts |

**API Client Files:**
- `src/lib/users-client.ts` - Users CRUD operations
- `src/lib/bookings-client.ts` - Bookings management
- `src/lib/disputes-client.ts` - Dispute workflow (8 resolution types)
- `src/lib/sessions-client.ts` - Active session monitoring
- `src/lib/logs-client.ts` - Audit log queries
- `src/lib/defi-client.ts` - DeFi configuration
- `src/lib/paymaster-client.ts` - Paymaster monitoring

**React Query Hooks:**
- `src/hooks/use-users.ts` - User management hooks
- `src/hooks/use-bookings.ts` - Booking management hooks
- `src/hooks/use-disputes.ts` - Dispute workflow hooks
- `src/hooks/use-active-sessions.ts` - Real-time session hooks (30s polling)
- `src/hooks/use-logs.ts` - Audit log hooks
- `src/hooks/use-defi.ts` - DeFi config hooks
- `src/hooks/use-paymaster.ts` - Paymaster monitoring hooks

---

## Key Features

### Dispute Resolution Workflow

8 resolution types available:
- `FULL_REFUND_CUSTOMER` - 100% refund to customer
- `PARTIAL_REFUND` - Configurable partial refund
- `NO_REFUND` - Stylist receives full payment
- `SPLIT_FUNDS` - Custom split between parties
- `STYLIST_PENALTY` - Deduction from stylist
- `CUSTOMER_WARNING` - Warning issued to customer
- `MUTUAL_CANCELLATION` - Both parties agree to cancel
- `ESCALATED_TO_LEGAL` - Escalate for legal review

### Sessions Dashboard

Real-time monitoring of active bookings:
- Auto-refresh every 30 seconds
- Progress percentage display
- Overtime/on-track categorization
- Quick contact actions

### Paymaster Monitoring

- Balance health indicators (Critical/Low/Healthy)
- 7-day gas usage chart
- Transaction history with filtering
- Configurable alerts (LOW_BALANCE, HIGH_USAGE, ERROR_RATE)

---

## Canonical References
- [Doc 22: Admin Panel and Moderation](../../docs/vlossom/22-admin-panel-and-moderation.md)

## Key Directories
- `src/app/` — Next.js app router pages
- `src/app/(dashboard)/` — Authenticated admin pages
- `src/app/login/` — Admin login page
- `src/components/` — React components
- `src/hooks/` — React Query hooks
- `src/lib/` — API clients
- `src/providers/` — Context providers

## Available Admin API Endpoints

The API provides these admin endpoints (requires ADMIN role):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/admin/users` | GET | List all users |
| `/api/v1/admin/users/:id` | GET | Get user details |
| `/api/v1/admin/users/:id/freeze` | POST | Freeze user account |
| `/api/v1/admin/users/:id/unfreeze` | POST | Unfreeze user account |
| `/api/v1/admin/users/:id/verify` | POST | Verify user |
| `/api/v1/admin/users/:id/warn` | POST | Issue warning |
| `/api/v1/admin/bookings` | GET | List all bookings |
| `/api/v1/admin/bookings/:id` | GET | Get booking details |
| `/api/v1/admin/bookings/:id/status` | PATCH | Update booking status |
| `/api/v1/admin/disputes` | GET | List disputes |
| `/api/v1/admin/disputes/:id` | GET | Get dispute details |
| `/api/v1/admin/disputes/:id/assign` | POST | Assign to admin |
| `/api/v1/admin/disputes/:id/resolve` | POST | Resolve dispute |
| `/api/v1/admin/disputes/:id/escalate` | POST | Escalate dispute |
| `/api/v1/admin/disputes/:id/messages` | GET/POST | Dispute messages |
| `/api/v1/admin/logs` | GET | Audit logs |
| `/api/v1/admin/logs/stats` | GET | Audit statistics |
| `/api/v1/admin/defi/stats` | GET | DeFi statistics |
| `/api/v1/admin/defi/config` | GET | DeFi configuration |
| `/api/v1/admin/defi/apy-params` | PUT | Update APY params |
| `/api/v1/admin/defi/fee-split` | PUT | Update fee split |
| `/api/v1/admin/defi/emergency/pause-all` | POST | Emergency pause |
| `/api/v1/admin/paymaster/stats` | GET | Paymaster stats |
| `/api/v1/admin/paymaster/transactions` | GET | Transaction history |
| `/api/v1/admin/paymaster/alerts` | GET/POST | Alert configuration |

## Local Conventions
- Separate deployment from main web app (port 3001)
- Requires admin authentication with httpOnly cookies
- All actions logged for audit trail
- Cookie auth with CSRF protection (matches web app pattern)

## Dependencies
- Internal: `@vlossom/ui`, `@vlossom/types`
- External: Next.js 14, React 18, TanStack Query, Tailwind CSS

## Gotchas
- Never expose admin routes to public
- All moderation actions must be reversible where possible
- Maintain calm, dignified tone even in admin tools
- CSRF token required for all mutating operations
- Real-time session monitoring uses 30-second polling (not SSE)
