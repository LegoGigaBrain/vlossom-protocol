# Admin Dashboard

> Purpose: Internal admin panel for moderation, dispute resolution, and platform management.

## Canonical References
- [Doc 22: Admin Panel and Moderation](../../docs/vlossom/22-admin-panel-and-moderation.md)

## Key Files
- `src/` — Admin dashboard source code (placeholder)

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
