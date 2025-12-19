# Vlossom Protocol - Root Context

> Purpose: Monorepo for Vlossom Protocol - a trust-first beauty marketplace connecting customers with mobile hair stylists via gasless Web3 payments.

## Current Version

**V6.7.1** - Direct Messaging with Mobile API Integration (December 20, 2025)

**Major Achievement**: In-app messaging between customers and stylists. Text-only MVP with conversations accessible from stylist profiles and booking pages (not in main navigation). Full backend API, web frontend, and mobile app with API integration.

**Previous**: V6.6.0 - Special Events Booking, V6.5.1 - Property Owner UI, V6.5.0 - Phosphor Icon Migration, V6.4.0 - Local Development & Service Fixes, V6.0.0 - Mobile App + Design Handover

---

## Quick Start

### For Context Stewards
1. Read `CLAUDE.project` for mission and standards
2. Check `IMPLEMENTATION_STATUS.md` for current version status
3. Review `docs/project/changelog.md` for version history
4. Scan folder-level `CLAUDE.md` files for module-specific context

### For Feature Development
1. Check relevant Codex docs in `docs/vlossom/` (00-28)
2. Find feature specs in `docs/specs/<version>/`
3. Review `docs/project/tech-stack.md` for technology decisions
4. Read module-specific `CLAUDE.md` in `apps/`, `services/`, `packages/`

### For Design Implementation
1. Read `docs/STYLE_BLUEPRINT.md` for visual system
2. Check `design/CLAUDE.md` for brand assets and tokens
3. Review `docs/audits/TYPOGRAPHY_AUDIT.md` and `docs/audits/COLOR_AUDIT.md`
4. See `design/brand/icons/ICONOGRAPHY_REPORT.md` for icon library

---

## Monorepo Structure

### `apps/` - Application Frontends
| App | Purpose | Status |
|-----|---------|--------|
| `apps/web/` | Next.js 14 PWA (customer + stylist + property owner) | ✅ V6.7.0 |
| `apps/mobile/` | React Native + Expo mobile app | ✅ V6.7.1 |
| `apps/admin/` | Admin dashboard | ✅ V6.4.0 |

### `services/` - Backend Services
| Service | Purpose | Status |
|---------|---------|--------|
| `services/api/` | Express REST API | ✅ V6.7.0 |
| `services/scheduler/` | Background job scheduler | ✅ V6.4.0 |
| `services/indexer/` | Blockchain event indexer | ✅ V3.2.0 |

### `packages/` - Shared Code
| Package | Purpose |
|---------|---------|
| `packages/sdk/` | TypeScript SDK for contracts |
| `packages/types/` | Shared TypeScript types |
| `packages/ui/` | Shared React components |
| `packages/config/` | Shared configuration |

### `contracts/` - Smart Contracts
- Hardhat project with payment escrow contracts
- Deployed on Base + Arbitrum

### `infra/` - Infrastructure
- Docker Compose for local development
- Kubernetes manifests for production
- Terraform configs (future)

### `design/` - Brand & Design Assets
- Design tokens (JSON)
- Logo assets (SVG)
- Botanical icon library (28 SVGs in `design/brand/icons/`)
- Brand identity documentation

### `docs/` - Documentation Hub
- `docs/vlossom/` - 29 canonical Codex documents (00-28)
- `docs/project/` - Core product docs (mission, roadmap, tech-stack, changelog)
- `docs/specs/` - Feature specifications by version
- `docs/audits/` - Design system audits

---

## V6.0.0 Highlights

### Phase A: Design System Completion

**A.1: Botanical Icon Library (28 SVGs)**
- Location: `design/brand/icons/` organized in 5 categories:
  - `nav/` - 6 navigation icons (home, search, calendar, wallet, profile, notifications)
  - `state/` - 5 state icons (healthy, growing, resting, needs-care, transition)
  - `care/` - 4 care icons (ritual, wash-day, protective-style, treatment)
  - `growth/` - 5 growth icons (stage-1 through stage-4, meter)
  - `community/` - 8 community icons (community, support, learning, verified, favorite, settings, add, close)
- React components: `apps/web/components/ui/vlossom-icons.tsx`
- React Native components: `apps/mobile/src/components/icons/VlossomIcons.tsx`
- Documentation: `design/brand/icons/ICONOGRAPHY_REPORT.md`

**A.2: Animation System Implementation**
- CSS animations: `apps/web/styles/animations.css`
  - Motion verbs: unfold, breathe, settle
  - Duration tokens: instant (100ms), micro (150ms), nav (200ms), standard (300ms), growth (400ms), dramatic (500ms)
  - Easing curves: unfold (overshoot), breathe (symmetric), settle (gentle deceleration)
- TypeScript utilities: `apps/web/lib/motion.ts`
  - Motion context provider
  - Reduced motion support
  - Motion hooks (useUnfoldMotion, useBreatheMotion, useSettleMotion)

**A.3: Typography Audit**
- Documented in `docs/audits/TYPOGRAPHY_AUDIT.md`
- Playfair Display (`font-display`) for headlines, editorial moments
- Inter (`font-sans`, default) for UI elements, navigation, body text
- All user-facing pages correctly implement typography separation

**A.4: Color Token Audit**
- Documented in `docs/audits/COLOR_AUDIT.md`
- Confirmed `brand-rose` = Primary Purple (#311E6B)
- Identified accent orange (#FF510D) usage in error contexts (needs fix)
- Recommended creating separate warning color token

### Phase B: Documentation Sync

**Updated Core Design Docs**
- `docs/STYLE_BLUEPRINT.md` - Added V6.0 icon library and animation implementation
- `docs/HANDOFF_FOR_GEMINI.md` - Updated with botanical icons and animation system
- `docs/vlossom/16-ui-components-and-design-system.md` - Documented implemented icon library

### Phase C: V6.0 Mobile App Setup

**React Native + Expo Foundation**
- App structure: `apps/mobile/`
- Expo Router with 5-tab navigation: Home, Search, Wallet, Notifications, Profile
- Design tokens: `apps/mobile/src/styles/tokens.ts` (matches web tokens)
- Theme provider: `apps/mobile/src/styles/theme.tsx`
- Botanical icons (React Native SVG): `apps/mobile/src/components/icons/VlossomIcons.tsx`
- Biometric auth hook: `apps/mobile/src/hooks/useBiometricAuth.ts`
- Package version: `6.0.0`

---

## Key Architecture Patterns

### Gasless UX
- All user transactions use ERC-4337 account abstraction
- Paymaster sponsors gas fees
- Users never see wallet prompts for basic flows

### Fiat-First Design
- All prices display in local currency (ZAR) first
- USDC amounts shown as secondary information
- Currency toggle in wallet settings

### State Management
- React Query for server state (caching, mutations)
- React Context for UI state
- Zustand for mobile app state

### Design System
- Tailwind CSS with custom design tokens
- Botanical iconography (never generic icons)
- Motion philosophy: "Earned, not constant"
- Color governance: Orange (#FF510D) sacred for growth/celebration only

---

## Canonical References

### Foundation Documents (Must Read)
- `CLAUDE.project` - Mission, standards, review structure
- `docs/project/mission.md` - Product vision and mission
- `docs/vlossom/00-mission-statement.md` - Original mission statement
- `docs/vlossom/05-system-architecture-blueprint.md` - Technical architecture

### Design System
- `docs/STYLE_BLUEPRINT.md` - Visual system documentation
- `design/brand/icons/ICONOGRAPHY_REPORT.md` - Icon library
- `docs/audits/TYPOGRAPHY_AUDIT.md` - Typography rules
- `docs/audits/COLOR_AUDIT.md` - Color token governance

### Implementation Status
- `IMPLEMENTATION_STATUS.md` - Current version features and status
- `docs/project/changelog.md` - Version history
- `docs/project/roadmap.md` - Future milestones

---

## Local Conventions

### Code Organization
- Monorepo managed with Turborepo
- Path aliases: `@/` for app-local imports, `@vlossom/*` for packages
- TypeScript strict mode enabled across all packages

### Component Patterns
- Multi-step dialog pattern for booking and wallet flows
- Skeleton pattern for loading states (no spinners)
- Empty states must guide users to action
- All monetary values use `formatPrice()` utility (fiat-first)

### API Conventions
- REST API with `/api/v1/*` prefix
- React Query hooks for all data fetching
- API clients in `lib/*-client.ts` files
- Error boundaries on all route components

### Design Implementation
- Always use semantic color tokens, never raw hex
- Always use Vlossom botanical icons, never generic libraries (Lucide, Heroicons, etc.)
- Always apply motion with semantic meaning (state change, not idle)
- Always test with `prefers-reduced-motion` enabled

---

## Dependencies

### Web Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Radix UI
- **State**: React Query, React Context
- **Blockchain**: viem, wagmi, ERC-4337

### Mobile Stack
- **Framework**: React Native 0.74.5, Expo ~51.0.28
- **Navigation**: Expo Router ~3.5.23
- **State**: Zustand 4.5.2
- **Native APIs**: expo-local-authentication, expo-location, expo-notifications

### Backend Stack
- **API**: Fastify, Prisma ORM
- **Database**: PostgreSQL
- **Indexer**: Node.js, viem
- **Contracts**: Hardhat, Solidity 0.8.20

---

## Gotchas

### Web App
- Never show wallet connection prompts for basic flows (gasless UX)
- Always display fiat amounts first, crypto secondary
- Playfair Display only for headlines, Inter for everything else
- Orange color (#FF510D) sacred - only for growth/celebration, not errors

### Mobile App
- Biometric auth must gracefully fall back to PIN if unavailable
- Haptic feedback must respect device settings
- Tab bar icons must use botanical Vlossom icons (not Expo vector icons)
- Theme provider must match web design tokens exactly

### Backend
- All booking state transitions must emit events for indexer
- Payout calculations must round correctly (avoid floating point errors)
- Rate limiting enforced on all auth endpoints
- Paymaster balance must be monitored (critical alerts at 20%)

### Smart Contracts
- All contracts deployed via CREATE2 for deterministic addresses
- Escrow must prevent reentrancy (ReentrancyGuard)
- Only owner can pause emergency functions
- Gas optimization: use uint256 for counters, not uint8

---

## Recent Updates

### V6.7.0/V6.7.1 Changes (Direct Messaging)

**Direct Messaging Feature**
- ✅ Prisma models: `Conversation` and `Message` with per-participant unread counts
- ✅ REST API: 8 endpoints for conversations, messages, read receipts, archive
- ✅ Notifications: `MESSAGE_RECEIVED` type with in-app and SMS templates
- ✅ Web frontend: Messages list page, conversation threads, React Query hooks
- ✅ Entry points: Message buttons on stylist profiles and booking details
- ✅ Mobile screens: Conversations list, conversation thread with Zustand store
- ✅ Mobile API: Base client with SecureStore auth, messages API, state management

**Key Files:**
- `services/api/src/routes/conversations.ts` - Full REST API (550+ lines)
- `apps/web/app/(main)/messages/` - Messages list and thread pages
- `apps/web/hooks/use-messages.ts` - React Query hooks
- `apps/mobile/src/api/` - API client with auth
- `apps/mobile/src/stores/messages.ts` - Zustand store
- `docs/specs/messaging/feature-spec.md` - Feature documentation

**Design Decision:** Messaging is a supporting feature accessed through stylist profiles and booking pages, NOT in main navigation tabs.

---

### V6.6.0 Changes (Special Events Booking)

**Special Events Flow**
- ✅ Mobile: Landing page with categories, multi-step request form
- ✅ Web: Matching flow with Quick Actions integration
- ✅ Shared: LocationSelector, ChairSelector components
- ✅ Testing: Playwright E2E test suite

---

### V6.5.0 Changes (Phosphor Icon Migration)

**Complete Lucide to Phosphor Migration (50+ Files)**
- ✅ Icon Bridge System: `apps/web/components/icons/index.tsx` with centralized `Icon` component
- ✅ Components migrated: notification, booking, wallet, profile, dialog, review, calendar, map, admin/paymaster
- ✅ Pages migrated: settings (5), help (8), auth (2), main app (7), admin (3)
- ✅ Pattern updates: Helper components now use `IconName` type instead of `React.ComponentType`
- ✅ Size standardization: sm, md, lg, xl, 2xl size tokens
- ✅ Zero Lucide imports remain in `apps/web` directory

**Icon Mapping Reference:**
- `Sparkles` → `sparkle`, `Calendar` → `calendar`, `Heart` → `favorite`
- `Star` → `star`, `Clock` → `clock`, `MapPin` → `location`
- `AlertCircle` → `calmError`, `Check` → `check`, `Plus` → `add`
- `Loader2` → `timer`, `TrendingUp` → `growing`, `DollarSign` → `currency`

---

### V6.4.0 Changes (Local Development & Service Fixes)

**Infrastructure**
- ✅ Redis Cloud integration: Distributed rate limiting via `ioredis` package
- ✅ Scheduler endpoint fix: Changed `/api/internal/*` → `/api/v1/internal/*`
- ✅ Scheduler environment: Created `services/scheduler/.env`

**Admin Panel**
- ✅ Admin scaffold: `apps/admin/src/app/` with layout, page, globals.css
- ✅ Dashboard placeholder with Users, Bookings, Disputes, DeFi Config cards
- ✅ Admin panel now starts at http://localhost:3001

---

### V6.3.0 Changes (Phase 2 UX & Infrastructure)

**Frontend Tooling & UX**
- ✅ Frontend logger system: `apps/web/lib/logger.ts` with log levels and grouping
- ✅ ESLint no-console rule: `apps/web/.eslintrc.json` enforces structured logging
- ✅ React Query configs: `apps/web/lib/query-config.ts` with optimized defaults
- ✅ Theme system: `apps/web/components/ui/theme-toggle.tsx` with system/light/dark modes
- ✅ Desktop navigation: `apps/web/components/layout/desktop-nav.tsx` responsive top nav
- ✅ Empty state presets: 14 presets in `apps/web/components/ui/empty-state.tsx`
- ✅ Booking error handling: improved in `booking-dialog.tsx` with user-friendly messages

**Backend Infrastructure**
- ✅ Redis rate limiting: `services/api/src/lib/redis-client.ts` distributed rate limiting
- ✅ Secrets manager: `services/api/src/lib/secrets-manager.ts` centralized config management

### V6.2.0 Changes (Security & Smart Contract Hardening)

**API Security & Documentation**
- ✅ TypeScript `any` type elimination in API (MAJOR-2 security finding)
- ✅ OpenAPI/Swagger documentation at `/api/docs` endpoint

**Smart Contract Security Fixes**
- ✅ Guardian Recovery State Fix (H-2) in `VlossomAccount.sol` - nonce-based approval system
- ✅ Paymaster Selector Validation (H-1) - assembly bounds checking prevents malformed calls
- ✅ YieldEngine Utilization Fix (M-4) - real utilization tracking for accurate APY

**Testing**
- ✅ New test file: `contracts/test/VlossomAccount.test.ts` (17 tests covering guardian recovery)

### V6.1.0 Changes (Orange Color Governance)

**Design System Enforcement**
- ✅ Fixed accent orange usage in error contexts (9 files)
- ✅ Updated `status.warning` from orange to amber (#F59E0B)
- ✅ Added code comments documenting sacred orange rules in tailwind.config.js
- ✅ 12 files corrected for design system compliance
- ✅ Orange governance enforced: Red for errors, Amber for warnings, Orange for celebration only

## Next Steps (Post-V6.4)

### V6.5: Mobile App MVP
- Connect mobile app to API client
- Implement wallet screen with biometric unlock
- Add stylist discovery with map view
- Build booking flow (mobile-optimized)

### V6.6: Admin Panel MVP
- Connect admin panel to API endpoints
- User management page
- Booking management page
- Dispute resolution workflow

### V7.0: Production Readiness
- Security audit (smart contracts + API)
- Load testing (1000+ concurrent users)
- Monitoring setup (Sentry, PostHog)
- Launch checklist execution

---

## Questions?

For any questions about this codebase:
1. Check the relevant `CLAUDE.md` in the module folder
2. Review the Codex document in `docs/vlossom/`
3. Search `docs/project/changelog.md` for related changes
4. Check `docs/specs/` for feature-specific documentation
