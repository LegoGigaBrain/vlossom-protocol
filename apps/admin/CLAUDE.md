# Admin Dashboard

> Purpose: Internal admin panel for moderation, dispute resolution, and platform management.

## Current Version

**V6.4.0 Local Development & Service Fixes** (December 18, 2025)

Admin panel scaffold created with Next.js 14 app router structure. Dashboard placeholder with navigation cards.

---

### V6.4.0 Changes

**App Structure Created:**
- `src/app/layout.tsx` - Root layout with metadata
- `src/app/page.tsx` - Dashboard with Users, Bookings, Disputes, DeFi Config cards
- `src/app/globals.css` - Base CSS styles

**Features:**
- Next.js 14 app router (not pages router)
- Placeholder dashboard UI
- Runs at http://localhost:3001

---

## Canonical References
- [Doc 22: Admin Panel and Moderation](../../docs/vlossom/22-admin-panel-and-moderation.md)

## Key Directories
- `src/app/` — Next.js app router pages
- `src/app/layout.tsx` — Root layout
- `src/app/page.tsx` — Dashboard home

## Available Admin API Endpoints

The API provides these admin endpoints (requires admin role):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/admin/users` | GET | List all users |
| `/api/v1/admin/users/:id/freeze` | POST | Freeze user account |
| `/api/v1/admin/bookings` | GET | List all bookings |
| `/api/v1/admin/disputes` | GET | List disputes |
| `/api/v1/admin/disputes/:id/resolve` | POST | Resolve dispute |
| `/api/v1/admin/logs` | GET | Audit logs |
| `/api/v1/admin/defi/config` | GET/POST | DeFi configuration |
| `/api/v1/admin/paymaster` | GET/POST | Paymaster management |

## Local Conventions
- Separate deployment from main web app (port 3001)
- Requires admin authentication
- All actions logged for audit trail

## Dependencies
- Internal: `@vlossom/ui`, `@vlossom/types`
- External: Next.js 14, React 18

## Gotchas
- Never expose admin routes to public
- All moderation actions must be reversible where possible
- Maintain calm, dignified tone even in admin tools

## Next Steps

Future admin panel features:
- [ ] Connect to admin API endpoints
- [ ] User management page
- [ ] Booking management page
- [ ] Dispute resolution workflow
- [ ] DeFi configuration dashboard
- [ ] Audit log viewer
