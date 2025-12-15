# Changelog

All notable changes to Vlossom Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### V1.6: Wallet AA & DeFi (Planned)

**Goal**: Full wallet AA integration and DeFi foundation.

#### 📝 Planned Features

- Wallet AA full integration
- Paymaster gasless transactions for all flows
- On/off ramp production (MoonPay SDK)
- DeFi tab foundation
- Rewards engine + SBT mapping
- Referrals engine

---

## [1.5.0] - 2025-12-15

### V1.5: Property Owner + Reputation - COMPLETE ✅

**Goal**: Add property owner module and full reputation system.

**All 17 features implemented and production-ready** 🎉

#### ✅ F6.1-F6.6: Property Owner Module

**F6.1: Property Database Models**
- New Prisma models: `Property`, `Chair`, `ChairRentalRequest`
- New enums: `PropertyCategory`, `ChairType`, `RentalMode`, `ApprovalMode`, `ChairRentalStatus`
- Property categories: LUXURY, BOUTIQUE, STANDARD, HOME_BASED
- Chair types: BRAID_CHAIR, BARBER_CHAIR, STYLING_STATION, WASH_STATION, MAKEUP_STATION
- Rental modes: PER_BOOKING, PER_HOUR, PER_DAY, PER_WEEK, PER_MONTH
- **Files**: `services/api/prisma/schema.prisma`

**F6.2: Property API Endpoints**
- CRUD endpoints for properties and chairs
- Chair rental request workflow (create, approve, reject)
- Filtering by owner, city, category
- **Files**: `services/api/src/routes/properties.ts`, `chairs.ts`

**F6.3: PropertyRegistry Smart Contract**
- On-chain property registration with metadata hash
- Chair count tracking per property
- Owner verification and deactivation
- **Files**: `contracts/contracts/PropertyRegistry.sol`

**F6.4: Property Owner Dashboard**
- Dashboard overview (`/property-owner`) with stats cards
- Properties page (`/property-owner/properties`) with add/edit forms
- Chairs page (`/property-owner/chairs`) with filtering by property
- Requests page (`/property-owner/requests`) with approve/reject actions
- Sidebar navigation layout
- **Files**: `apps/web/src/app/property-owner/` (5 files)

**F6.5: Chair Rental Flow**
- Status workflow: PENDING → APPROVED/REJECTED → ACTIVE → COMPLETED/CANCELLED
- Stylist information with reputation badge on requests
- Rental mode and pricing display

**F6.6: Approval Modes**
- APPROVAL_REQUIRED (default) - Manual approval for every request
- AUTO_APPROVE - Auto-confirm unless blocklisted
- CONDITIONAL - Reputation threshold-based approval

#### ✅ F7.1-F7.7: Reputation System

**F7.1: Reputation Database Models**
- New Prisma models: `ReputationScore`, `ReputationEvent`, `Review`
- New enum: `ReviewType` (CUSTOMER_TO_STYLIST, STYLIST_TO_CUSTOMER, STYLIST_TO_PROPERTY, PROPERTY_TO_STYLIST)
- Score stored as 0-10000 (displayed as 0-100%)
- **Files**: `services/api/prisma/schema.prisma`

**F7.2: Review API Endpoints**
- Create review after completed booking
- List reviews by booking or user
- Get reputation score for user
- **Files**: `services/api/src/routes/reviews.ts`

**F7.3: TPS Calculation Pipeline**
- Full implementation (~670 lines)
- Start Punctuality scoring (50% of TPS):
  - On time or early: 100%
  - 1-5 min late: 90%
  - 5-15 min late: 70%
  - 15-30 min late: 40%
  - 30+ min late: 10%
- Duration Accuracy scoring (50% of TPS):
  - Within 10%: 100%
  - Within 20%: 80%
  - Within 30%: 60%
  - Over 30%: 40%
- **Files**: `services/api/src/lib/reputation.ts`

**F7.4: Reputation Scheduler**
- 6-hour batch recalculation job
- Internal API endpoint for triggering recalculation
- **Files**: `services/scheduler/src/index.ts`, `services/api/src/routes/internal.ts`

**F7.5: ReputationRegistry Smart Contract**
- On-chain score anchoring with hash commitment
- Verification status storage
- Checkpoint timestamps
- **Files**: `contracts/contracts/ReputationRegistry.sol`

**F7.6: Reputation UI Components**
- `ReputationBadge` - Score circle with color coding (Excellent/Great/Good/Fair/Average)
- `ReputationCard` - Full score breakdown with progress bars
- `StarRating` - Interactive 1-5 star rating input
- `ReviewList` - Review feed with avatars and comments
- **Files**: `apps/web/src/components/reputation/` (5 files)

**F7.7: Verification Logic**
- Threshold: 70% score + 5 completed bookings
- `isVerified` flag on ReputationScore
- Verification badge display in UI

#### ✅ F6.7-F6.10: Quick Wins

**F6.7: Auto-confirm Customer Start**
- Customer no-show eliminated as trust issue
- Stylist can start service without customer confirmation

**F6.8: Buffer Time Configuration**
- 15-minute default buffer between bookings
- Configurable per stylist

**F6.9: Location Verification Flag**
- Stylist confirms arrival at location
- Timestamp recorded in booking

**F6.10: Vercel Deployment**
- Web app deployed to Vercel
- Environment configuration for production

**Score Weights**:
- TPS (Time Performance): 30%
- Reliability: 30%
- Feedback: 30%
- Disputes: 10%

**New API Endpoints (17 total)**:
- Property: `GET/POST /api/properties`, `GET/PUT /api/properties/:id`, `GET /api/properties/:id/chairs`
- Chairs: `POST/PUT/DELETE /api/chairs/:id`
- Rentals: `POST /api/chair-rentals`, `POST /api/chair-rentals/:id/approve`, `POST /api/chair-rentals/:id/reject`, `GET /api/chair-rentals/property/:propertyId`
- Reviews: `POST /api/reviews`, `GET /api/reviews/booking/:bookingId`, `GET /api/reviews/user/:userId`
- Reputation: `GET /api/reputation/:userId`, `POST /api/internal/reputation/recalculate`

**New Smart Contracts (2 total)**:
- `PropertyRegistry.sol` - Property and chair on-chain registry
- `ReputationRegistry.sol` - Score anchoring with verification

**New Frontend Files (15 total)**:
- Property Owner Dashboard: 5 pages (layout, dashboard, properties, chairs, requests)
- Reputation Components: 5 files (badge, card, star-rating, review-list, index)
- API Client: `apps/web/src/lib/api.ts`

**Database Changes**:
- 6 new Prisma models: Property, Chair, ChairRentalRequest, ReputationScore, ReputationEvent, Review
- 6 new enums: PropertyCategory, ChairType, RentalMode, ApprovalMode, ChairRentalStatus, ReviewType

---

## [1.4.0] - 2025-12-14

### Milestone 5: Beta Launch (Week 9-10) - COMPLETE ✅

**Goal**: Deploy to production and launch beta with monitoring, CI/CD, and user onboarding.

**All 5 features implemented and production-ready** 🎉

#### ✅ F5.1: Paymaster Monitoring Dashboard
- Admin-only dashboard for gas sponsorship tracking
- Real-time stats: balance, total sponsored, transaction count
- Gas usage chart with daily/weekly visualization (Recharts)
- Paginated transaction history table
- Alert configuration panel (low balance, high usage, error rate)
- Slack/email notifications on threshold breach
- New Prisma models: `PaymasterTransaction`, `PaymasterAlert`, `PaymasterDailyStats`
- **Files**: `services/api/src/lib/paymaster/*`, `apps/web/app/admin/paymaster/*`

#### ✅ F5.2: CI/CD Pipeline (GitHub Actions)
- PR checks workflow: lint, typecheck, unit tests, build, contract tests
- Staging deployment: Auto-deploy to Vercel/Railway on push to main
- Production deployment: Manual trigger with health check verification
- Deployment scripts: `deploy-frontend.sh`, `deploy-backend.sh`, `run-migrations.sh`
- Rollback script with step-by-step procedures
- **Files**: `.github/workflows/ci.yml`, `deploy-staging.yml`, `deploy-production.yml`

#### ✅ F5.3: Production Monitoring (Sentry + PostHog)
- Sentry integration for error tracking (browser + server + edge)
- PostHog integration for product analytics
- Health check endpoint: `GET /api/health`
- Events tracked: user_signup, booking_created, booking_completed, wallet_funded, faucet_claimed
- Performance monitoring with 10% sample rate
- **Files**: `services/api/src/lib/monitoring/*`, `apps/web/sentry.*.config.ts`, `apps/web/lib/posthog.ts`

#### ✅ F5.4: Beta User Onboarding Materials
- Welcome modal with role-specific messaging (first-time users)
- 5-step interactive feature tour (wallet, browse, book, track, help)
- Onboarding context provider with localStorage persistence
- Help center home page with topic grid
- Getting started guide (4 steps: account, wallet, fund, book/service)
- FAQ page with 13 questions across 5 categories (accordion UI)
- Beta program documentation
- **Files**: `apps/web/components/onboarding/*`, `apps/web/app/help/*`, `docs/beta/*`

#### ✅ F5.5: Beta Launch Checklist & Runbooks
- 50+ item pre-launch verification checklist
- Launch day procedures (T-24h, T-0, T+1h, T+24h)
- Incident response runbook with severity levels (P0-P3)
- Rollback procedures for all systems (Frontend, Backend, Database, Contracts)
- Post-incident review template
- **Files**: `docs/operations/launch-checklist.md`, `incident-response.md`, `rollback-procedure.md`

**New Files Created (34 total)**:
- CI/CD: 3 workflow files + 4 scripts
- Monitoring: 4 backend + 4 frontend files
- Paymaster: 4 backend + 5 frontend files
- Onboarding: 4 components + 3 pages
- Documentation: 5 files

**New API Endpoints (4 total)**:
- `GET /api/admin/paymaster/stats` - Paymaster statistics
- `GET /api/admin/paymaster/transactions` - Transaction history
- `GET /api/admin/paymaster/gas-usage` - Gas usage chart data
- `POST /api/admin/paymaster/alerts/config` - Alert configuration
- `GET /api/health` - Health check endpoint

**New Dependencies**:
- Backend: `@sentry/node`, `posthog-node`
- Frontend: `@sentry/nextjs`, `posthog-js`, `recharts`

---

## [1.3.0] - 2025-12-14

### Milestone 4: Production Ready (Week 7-8) - COMPLETE ✅

**Goal**: Prepare Vlossom Protocol for beta launch with scheduling, notifications, testing, and security hardening.

**All 7 features implemented and production-ready** 🎉

#### ✅ F4.1: Scheduling Engine (Conflict Detection)
- Conflict detection with travel-time awareness
- New endpoint: `POST /api/bookings/check-availability`
- Check weekly schedule + blocked exceptions + existing bookings
- 30-minute buffer calculation for mobile stylists
- Return availability status + suggested alternative slots
- New endpoint: `GET /api/bookings/available-slots`
- **Files**: `services/api/src/lib/scheduling/scheduling-service.ts`

#### ✅ F4.2: Travel Time Calculation
- Google Distance Matrix API integration
- New endpoint: `GET /api/bookings/travel-time`
- In-memory LRU caching (60 min TTL, 1000 entries)
- Haversine formula fallback if API unavailable
- Support for DRIVING, WALKING, BICYCLING, TRANSIT modes
- **Files**: `services/api/src/lib/scheduling/travel-time-service.ts`

#### ✅ F4.3: Notification Service (Email/SMS/In-App)
- Multi-channel: SendGrid (email), Clickatell (SMS), In-app
- New Prisma model: `Notification` with NotificationType, NotificationChannel, NotificationStatus enums
- New endpoints:
  - `GET /api/notifications` - List notifications (paginated)
  - `POST /api/notifications/:id/read` - Mark as read
  - `POST /api/notifications/read-all` - Mark all as read
  - `GET /api/notifications/unread-count` - Badge count
- Replaced all 6 TODOs in bookings.ts with `notifyBookingEvent()` calls
- Events: Booking created, approved, declined, started, completed, cancelled
- **Files**: `services/api/src/lib/notifications/` (6 files), `services/api/src/routes/notifications.ts`

#### ✅ F4.4: Search & Filter API Enhancement
- Full-text search by name, bio, specialties
- Price range filtering (minPrice, maxPrice in cents)
- Operating mode filter (FIXED/MOBILE/HYBRID)
- Sort by price_asc, price_desc, distance, newest, rating
- Availability date filter (checks weekly schedule + exceptions)
- Updated validation schema in `services/api/src/routes/stylists.ts`

#### ✅ F4.5: Image Upload (Cloudinary)
- Portfolio images with CDN delivery
- New endpoints:
  - `POST /api/upload/portfolio` - Upload portfolio image
  - `POST /api/upload/avatar` - Upload avatar
  - `DELETE /api/upload/portfolio/:publicId` - Delete image
  - `GET /api/upload/signature` - Get signed upload params
- Image transformations: 800x800 main, 200x200 thumbnail
- 5MB file size limit, auto-format (WebP), auto-quality
- **Files**: `services/api/src/lib/cloudinary/` (2 files), `services/api/src/routes/upload.ts`

#### ✅ F4.6: E2E Testing (Playwright)
- Test suites (4 files, ~50 test cases):
  - `auth.spec.ts` - 12 tests (signup, login, logout, invalid credentials)
  - `customer-booking.spec.ts` - 15 tests (discovery → booking → cancellation)
  - `stylist-dashboard.spec.ts` - 18 tests (services, availability, requests, earnings)
  - `wallet.spec.ts` - 8 tests (balance, faucet, rate limiting, transactions)
- Desktop (1280x720) + Mobile (iPhone 12) viewports
- Parallel execution with Playwright
- CI integration ready (GitHub Actions)
- **Files**: `apps/web/e2e/` (6 files), `playwright.config.ts`

#### ✅ F4.7: Security Hardening (OWASP Top 10)
- Rate limiting:
  - `POST /api/auth/login` → 5 requests / 15 min
  - `POST /api/auth/signup` → 3 requests / 1 hour
  - `POST /api/wallet/faucet` → 1 request / 24 hours
  - `POST /api/bookings` → 20 requests / 1 hour
  - Global fallback → 100 requests / 1 min
- Security headers via helmet.js:
  - Content-Security-Policy (CSP)
  - Strict-Transport-Security (HSTS) - 1 year
  - X-Frame-Options - DENY
  - X-Content-Type-Options - nosniff
  - Referrer-Policy - strict-origin-when-cross-origin
- Account lockout after 5 failed login attempts (30 min duration)
- Security event logging for suspicious activity
- **Files**: `services/api/src/middleware/rate-limiter.ts`, `security-headers.ts`

**New Backend Files (15 total)**:
- Scheduling: `scheduling-service.ts`, `travel-time-service.ts`, `index.ts`
- Notifications: `notification-service.ts`, `email-provider.ts`, `sms-provider.ts`, `templates.ts`, `types.ts`, `index.ts`
- Cloudinary: `cloudinary-service.ts`, `index.ts`
- Security: `rate-limiter.ts`, `security-headers.ts`
- Routes: `notifications.ts`, `upload.ts`

**New API Endpoints (11 total)**:
- Scheduling: `POST /api/bookings/check-availability`, `GET /api/bookings/available-slots`, `GET /api/bookings/travel-time`
- Notifications: `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`, `GET /api/notifications/unread-count`
- Upload: `POST /api/upload/portfolio`, `POST /api/upload/avatar`, `DELETE /api/upload/portfolio/:publicId`, `GET /api/upload/signature`

**Database Changes**:
- New model: `Notification` (id, userId, type, channel, status, title, message, data, readAt, sentAt, createdAt)
- New enums: `NotificationType`, `NotificationChannel`, `NotificationStatus`

**External Services Integrated**:
| Service | Purpose | Configuration |
|---------|---------|--------------|
| Google Distance Matrix API | Travel time calculation | `GOOGLE_MAPS_API_KEY` |
| SendGrid | Email notifications | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` |
| Clickatell | SMS notifications | `CLICKATELL_API_KEY` |
| Cloudinary | Image CDN | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

**E2E Testing Summary**:
- 4 test suites with ~50 test cases total
- Desktop + mobile viewports
- GitHub Actions CI integration
- Test coverage: All critical user journeys

---

## [1.2.0] - 2025-12-14

### Milestone 3: Stylist Can Service (Dec 14, 2025)

**Complete Stylist Dashboard Implementation** 🎉

#### ✅ Stylist Dashboard (F3.1)
- Dashboard overview page (`/stylist/dashboard`) with stats cards
- Pending requests count, upcoming bookings, earnings summary
- Dashboard layout with tabbed navigation (6 sections)
- Today's active bookings section with start/complete actions

#### ✅ Booking Requests Queue (F3.2)
- Full requests page (`/stylist/dashboard/requests`)
- Request cards with customer info, service, date, price
- View details dialog with payout breakdown
- Approve/decline mutations with decline reason selection
- Empty state for no pending requests

#### ✅ Services Management CRUD (F3.3)
- Services page (`/stylist/dashboard/services`) with grid layout
- Service form with validation (name, category, description, price, duration)
- Create, edit, toggle active/inactive, delete operations
- Categories: Hair, Nails, Makeup, Lashes, Facials
- Duration options from 15 min to 8 hours

#### ✅ Availability Calendar (F3.4)
- Availability page (`/stylist/dashboard/availability`)
- Weekly schedule grid (7 days) with time slot editor
- Multiple time slots per day (e.g., morning + afternoon)
- Exception manager for blocked dates (holidays, time off)
- Date picker for future date blocking

#### ✅ Profile Management (F3.5)
- Profile page (`/stylist/dashboard/profile`)
- Profile form: display name, bio (50-500 chars), operating mode
- Operating modes: FIXED, MOBILE, HYBRID with conditional fields
- Base location for Fixed/Hybrid, service radius for Mobile/Hybrid
- Specialties tag manager (up to 10)
- Portfolio image upload grid (up to 12 images)
- Profile preview dialog (customer view)
- Accepting bookings toggle

#### ✅ Earnings Dashboard (F3.6)
- Earnings page (`/stylist/dashboard/earnings`)
- Summary cards: Total earnings, This month, Pending
- Month-over-month change percentage
- Earnings trend chart with period toggle (week/month/year)
- CSS-based bar chart (Recharts-ready for production)
- Payout history list with pagination

#### ✅ Booking Completion Flow (F3.7)
- Active booking cards (CONFIRMED/IN_PROGRESS states)
- Start service dialog with confirmation
- Complete service dialog with payout breakdown
- Completion success modal with payout confirmation
- Elapsed time display during in-progress bookings
- Today's bookings component integrated into dashboard

**New Backend Endpoints (12 total):**
- `GET /api/stylists/dashboard` - Dashboard summary
- `GET/POST /api/stylists/services` - List/create services
- `PUT/DELETE /api/stylists/services/:id` - Update/delete service
- `GET/PUT /api/stylists/availability` - Get/update weekly schedule
- `POST/DELETE /api/stylists/availability/exceptions` - Manage blocked dates
- `GET/PUT /api/stylists/profile` - Get/update profile
- `GET /api/stylists/earnings` - Earnings summary
- `GET /api/stylists/earnings/trend` - Earnings trend data
- `GET /api/stylists/earnings/history` - Payout history

**New Components Created (21):**
- `components/dashboard/stats-cards.tsx` - Stats metric cards
- `components/dashboard/upcoming-bookings.tsx` - Upcoming bookings list
- `components/dashboard/pending-requests-preview.tsx` - Requests preview
- `components/dashboard/request-card.tsx` - Request card
- `components/dashboard/request-details-dialog.tsx` - Request details
- `components/dashboard/decline-dialog.tsx` - Decline with reason
- `components/dashboard/service-list.tsx` - Service grid
- `components/dashboard/service-form.tsx` - Service create/edit form
- `components/dashboard/service-dialog.tsx` - Service modal wrapper
- `components/dashboard/weekly-schedule.tsx` - Weekly availability grid
- `components/dashboard/time-block-editor.tsx` - Time slot editor
- `components/dashboard/exception-manager.tsx` - Blocked dates
- `components/dashboard/profile-form.tsx` - Profile editor
- `components/dashboard/portfolio-upload.tsx` - Image gallery
- `components/dashboard/profile-preview.tsx` - Customer view preview
- `components/dashboard/earnings-summary.tsx` - Earnings cards
- `components/dashboard/earnings-chart.tsx` - Trend chart
- `components/dashboard/payout-history.tsx` - Payout list
- `components/dashboard/active-booking-card.tsx` - Active booking
- `components/dashboard/start-service-dialog.tsx` - Start confirmation
- `components/dashboard/complete-service-dialog.tsx` - Complete confirmation
- `components/dashboard/completion-success.tsx` - Success modal
- `components/dashboard/todays-bookings.tsx` - Today's bookings section

**New Routes:**
- `/stylist/dashboard` - Dashboard overview
- `/stylist/dashboard/requests` - Booking requests
- `/stylist/dashboard/services` - Services management
- `/stylist/dashboard/availability` - Availability calendar
- `/stylist/dashboard/profile` - Profile management
- `/stylist/dashboard/earnings` - Earnings dashboard

**Database Changes:**
- Added `StylistAvailability` model to Prisma schema
- JSON fields: `schedule` (weekly hours), `exceptions` (blocked dates)
- Relation to `StylistProfile` model

**API Client & Hooks:**
- `lib/dashboard-client.ts` - Dashboard API with 15+ functions
- `hooks/use-dashboard.ts` - React Query hooks for all dashboard data

---

### Milestone 2: Customer Can Book (Dec 14, 2025)

**Complete Booking Flow Implementation** 🎉

#### ✅ Stylist Discovery (F2.1-F2.2)
- Stylist discovery page (`/stylists`) with grid layout and filtering
- Stylist profile page (`/stylists/[id]`) with services, availability, portfolio
- Category filter dropdown (Hair, Nails, Makeup, Lashes, Facials)
- Operating mode badges (Fixed, Mobile, Hybrid)
- Service cards with pricing and duration display

#### ✅ Booking Flow (F2.3-F2.7)
- Multi-step booking dialog with state machine (7 steps)
- Service selection with add-ons and dynamic pricing
- Calendar date picker with 30-day lookahead
- Time slot picker (8AM-6PM, 30-min increments)
- Location type selection (stylist location vs customer location)
- Price breakdown (service + travel fee + 10% platform fee)
- USDC payment via escrow with balance check
- Success confirmation with booking summary

#### ✅ Booking Management (F2.8-F2.9)
- My Bookings page (`/bookings`) with filter tabs (upcoming/completed/all)
- Booking detail page (`/bookings/[id]`) with full appointment info
- Status badges for all booking states
- Time-based cancellation policy with refund tiers:
  - >24 hours: 100% refund
  - 12-24 hours: 75% refund
  - 2-12 hours: 50% refund
  - <2 hours: 0% refund
- Cancel dialog with refund preview and policy explanation

**New Components Created:**
- `components/stylists/` - 6 components (stylist-card, stylist-grid, category-filter, service-card, availability-calendar, portfolio-gallery)
- `components/booking/` - 6 components (booking-dialog, service-step, datetime-picker, location-step, summary-step, payment-step)
- `components/bookings/` - 5 components (booking-list, booking-card, booking-details, status-badge, cancel-dialog)

**New API Clients & Hooks:**
- `lib/stylist-client.ts` - Stylist API with types and filters
- `lib/booking-client.ts` - Booking API with cancellation policy logic
- `hooks/use-stylists.ts` - React Query hooks for stylist data
- `hooks/use-bookings.ts` - React Query hooks with mutations

**New Routes:**
- `/stylists` - Stylist discovery page
- `/stylists/[id]` - Stylist profile page
- `/bookings` - My Bookings list
- `/bookings/[id]` - Booking details

**Utility Functions:**
- `formatPrice()` - ZAR currency formatting (R350.00)
- `formatDuration()` - Human-readable duration (1h 30min)
- `formatDate()` - Date formatting (Wed, 18 Dec 2024)
- `formatTimeFromDate()` - Time extraction (14:30)
- `generateTimeSlots()` - 30-min slot generator
- `calculatePriceBreakdown()` - Full price calculation
- `getCancellationPolicy()` - Time-based refund tiers
- `calculateRefund()` - Refund amount calculation

---

### Pre-Milestone 2: Design System Integration (Dec 14, 2025)

**Theme System Complete** 🎨

#### ✅ Design System Implementation
- ✅ `/design/tokens/vlossom-light.json` - Light mode tokens (colors, typography, spacing, shadows)
- ✅ `/design/tokens/vlossom-dark.json` - Dark mode tokens with inverted relationships
- ✅ `apps/web/lib/theme/` - Complete theme provider system
  - `tokens.ts` - Token loader with TypeScript types
  - `provider.tsx` - BrandThemeProvider with mode switching
  - `use-theme.ts` - Hooks: `useBrandTheme()`, `useTokens()`, `useColors()`
  - `index.ts` - Barrel export
- ✅ Updated `tailwind.config.js` with new brand colors + `darkMode: 'class'`
- ✅ Updated `globals.css` with CSS variables for light/dark modes
- ✅ Updated `providers.tsx` to wrap app with BrandThemeProvider
- ✅ Updated `layout.tsx` with Playfair Display font and theme support

#### New Brand Colors
| Token | Value | Purpose |
|-------|-------|---------|
| Primary | #311E6B | Deep purple - CTAs, headers |
| Accent | #FF510D | Orange - notifications, highlights |
| Secondary | #EFE3D0 | Cream - card backgrounds |
| Tertiary | #A9D326 | Green - success states |

#### Dark Mode Support
- System preference detection (`prefers-color-scheme`)
- Manual toggle with localStorage persistence
- CSS class-based switching
- Smooth 220ms color transitions

**Files Created/Modified:**
- `design/**` - New design assets folder
- `docs/vlossom/16-ui-components-and-design-system.md` - Updated
- `apps/web/lib/theme/**` - New theme system
- `apps/web/tailwind.config.js` - Brand colors
- `apps/web/app/globals.css` - CSS variables
- `apps/web/app/layout.tsx` - Theme setup
- `apps/web/components/providers.tsx` - Provider wrapper
- `apps/web/tsconfig.json` - Path aliases

---

### V1.0 - Complete (Week 1-2) ✅
**Target**: Launchable on Base Sepolia Testnet

#### ✅ Completed Features (Dec 14, 2025)

**F1.2: Authentication System** - COMPLETE 🎉
- ✅ Backend auth routes (`POST /api/auth/signup`, `/login`, `/logout`, `GET /api/auth/me`)
- ✅ Updated Prisma schema (added `passwordHash`, `phone` unique index)
- ✅ Installed bcrypt for secure password hashing (10 salt rounds)
- ✅ Auth client (`lib/auth-client.ts`) with localStorage token management
- ✅ `useAuth()` hook with React Query for auth state management
- ✅ UI components (Button, Input, Label) with brand-aligned styling
- ✅ Onboarding page (`/onboarding`) with email/password signup and role selection
- ✅ Login page (`/login`) with email/password authentication
- ✅ Protected routes middleware (Next.js middleware with role-based redirects)
- ✅ Placeholder wallet and stylist dashboard pages
- ✅ Homepage with "Get Started" and "Log In" CTAs

**Implementation Details:**
- JWT tokens stored in localStorage (30-day expiry)
- Automatic redirects based on role (customer → `/wallet`, stylist → `/stylist/dashboard`)
- Form validation with React Hook Form + Zod
- Brand voice compliant UX copy ("Get Started", "Welcome back")
- Error handling with user-friendly messages

**F1.3: AA Wallet Creation** - COMPLETE 🎉
- ✅ Integrated wallet creation into signup flow (`services/api/src/routes/auth.ts`)
- ✅ Deterministic CREATE2 address computation via VlossomAccountFactory
- ✅ Wallet service (`lib/wallet/wallet-service.ts`) with createWallet, getBalance, getTransactions
- ✅ Chain client (`lib/wallet/chain-client.ts`) with localhost support (Chain ID 31337)
- ✅ Database Wallet model with salt, address, chainId, isDeployed fields
- ✅ Counterfactual deployment (wallet address computed, not deployed until first UserOperation)
- ✅ Tested with successful signup creating wallet address: `0x3f1b4c6c07E9CcBe84cdd81E576A341A2af77Cf8`

**Implementation Details:**
- Each user gets a unique AA wallet on signup (stored in `wallets` table)
- Wallet address is deterministic based on user ID (keccak256 hash as salt)
- VlossomAccountFactory.getAddress() computes counterfactual address
- Wallet is not deployed on-chain until first transaction (gasless via Paymaster)
- Relayer account (Hardhat default #0) is owner for MVP (will be user's passkey/EOA in production)

**F1.4: Wallet Balance Display** - COMPLETE 🎉
- ✅ Wallet API client (`lib/wallet-client.ts`) with getWallet, getTransactions, formatCurrency
- ✅ useWallet React Query hook with auto-refetch every 10 seconds
- ✅ Balance Card component with fiat-first display (ZAR default)
- ✅ Currency toggle buttons (ZAR / USD / USDC)
- ✅ Backend API endpoint `GET /api/wallet` returning wallet + balance
- ✅ Updated wallet page to show balance card and deployment status
- ✅ Tested with API returning balance: 0 USDC (empty wallet as expected)

**Implementation Details:**
- Balance displays in fiat-first format: "R0.00" (ZAR default, ~18.5:1 USD exchange rate)
- Users can toggle between ZAR, USD, and USDC displays
- Balance auto-refreshes every 10 seconds via React Query
- Loading skeleton shown while fetching balance
- Deployment status indicator: "Not yet deployed (counterfactual)"

**F1.5: MockUSDC Faucet** - COMPLETE 🎉
- ✅ Faucet service (`lib/wallet/faucet-service.ts`) with rate limiting and testnet detection
- ✅ Rate limit checking based on last FAUCET_CLAIM transaction (24-hour cooldown)
- ✅ Backend API endpoint `POST /api/wallet/faucet` with authentication
- ✅ Frontend wallet client function `claimFaucet()` with error handling
- ✅ UI button in wallet page with success/error messaging
- ✅ Prisma schema updated with FAUCET_CLAIM transaction type
- ✅ Tested successfully: 1000 USDC minted, balance updated, rate limiting enforced

**Implementation Details:**
- Faucet only available on testnet (Chain ID 31337 localhost or 84532 Base Sepolia)
- Mints 1000 MockUSDC (6 decimals) using relayer wallet
- Rate limited to 1 claim per 24 hours per user (tracked in database)
- Transaction hash returned and recorded in wallet_transactions table
- Gasless transaction (Paymaster sponsors the mint)
- Success message: "Successfully claimed 1000 USDC from faucet"
- Rate limit error includes `nextClaimAt` timestamp for UI countdown
- Balance auto-refreshes after successful claim via React Query

#### 📝 Week 1 Remaining Features
- **F1.6: P2P Send** - Wallet to wallet USDC transfers
- **F1.7: P2P Receive** - QR code generation for receiving payments
- **F1.8: Transaction History** - Paginated list of all wallet transactions
- **F1.9: Wallet Fund (Onramp)** - MoonPay integration for fiat to USDC
- **F1.10: Wallet Withdraw (Offramp)** - MoonPay integration for USDC to fiat

#### 📚 Documentation Improvements (Dec 14, 2025)
- ✅ Created comprehensive documentation index (`docs/README.md`)
- ✅ Created spec status tracker (`docs/specs/STATUS.md`)
- ✅ Standardized spec file naming (wallet specs now follow template pattern)
- ✅ Added 12 feature spec files for Week 1 features (F1.2, F1.3, F1.4, F1.5)

---

## [0.2.0] - 2025-12-13

### Added - Base Sepolia Testnet Deployment
- **VlossomAccountFactory** deployed to Base Sepolia: `0x1118fA7895A0b9Ae2Ed51F1BC355CFd2c606882d`
- **VlossomPaymaster** deployed to Base Sepolia: `0x66Af4b4c3935C185F832cf2B38A88dABA22cCD8D`
- **Escrow** deployed to Base Sepolia: `0x925E12051A6badb09D5a8a67aF9dD40ec5725E04`
- All contracts verified on Basescan with full source code
- Automated deployment script with gas estimation (`deploy-base-sepolia.ts`)
- Paymaster funded with 0.3 ETH for gasless transactions

### Added - Database & Testing
- **PostgreSQL 14** setup complete with Prisma migrations
- **161 unit tests** with 100% business logic coverage
- Jest testing infrastructure for pricing, cancellation policy, and state machine
- Database schema with 8 tables (users, bookings, wallets, transactions, etc.)

### Added - Documentation
- Base Sepolia deployment guide (`BASE_SEPOLIA_DEPLOYMENT.md`)
- PostgreSQL setup guide (`docs/setup/POSTGRESQL_SETUP.md`)
- API environment config for testnet (`.env.base-sepolia`)
- Updated README with testnet deployment info

### Deployment Stats (Base Sepolia)
- Total Gas Used: 3,577,450
- Deployment Cost: 0.0000043 ETH
- Paymaster Funding: 0.3 ETH
- Total Cost: 0.30000429 ETH

### Changed
- All 11 booking endpoints now secured with JWT authentication
- Hardhat config updated to Etherscan API v2
- Contract deployment addresses saved to `deployments/base-sepolia.json`

---

## [0.1.0] - 2024-12-13

### Added - Smart Contracts
- **Escrow contract** - Multi-party settlement with security fixes
- **VlossomAccount** - ERC-4337 smart wallet with CREATE2
- **VlossomAccountFactory** - Deterministic wallet creation
- **VlossomPaymaster** - Gas sponsorship with rate limiting
- **Mock contracts** - MockUSDC, MockEntryPoint for local testing

### Added - Backend Integration
- **Escrow client** (`escrow-client.ts`) - Contract wrapper for lock/release/refund
- **Wallet-booking bridge** (`wallet-booking-bridge.ts`) - Payment flow integration
- **Authentication framework** - JWT + role-based authorization
- **Payment endpoints** - Instructions and confirmation flows

### Deployed - Localhost (chain ID 31337)
- Escrow: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`
- Factory: `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318`
- Paymaster: `0x610178dA211FEF7D417bC0e6FeD39F05609AD788`

### Changed
- Booking routes integrated with escrow on confirm/cancel
- Payment flow checks wallet balance and allowances
- State machine transitions trigger smart contract calls

---

## [0.0.1] - 2024-12-12

### Added
- Repository initialization
- Vlossom Product Codex (docs/vlossom/ 00-28)
- LEGO Agent OS integration
- Initial monorepo scaffolding (Turborepo + pnpm)
- Project meta-docs (mission, roadmap, tech-stack)
- CLAUDE.md context files
- Feature spec: booking-flow-v1

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.5.0 | 2025-12-15 | **V1.5 COMPLETE** - Property Owner + Reputation (17 features, 17 endpoints, 2 contracts) |
| 1.4.0 | 2025-12-14 | **V1.0 COMPLETE** - Milestone 5: Beta Launch (CI/CD, Monitoring, Onboarding, Launch Ops) |
| 1.3.0 | 2025-12-14 | Milestone 4 Complete - Production Ready (Scheduling, Notifications, E2E Testing, Security) |
| 1.2.0 | 2025-12-14 | Milestone 3 Complete - Stylist Can Service (Dashboard, Services, Availability, Earnings) |
| 1.1.0 | 2025-12-14 | Milestone 2 Complete - Customer Can Book (Discovery, Booking Flow, Cancellation) |
| 1.0.0 | 2025-12-14 | Milestone 1 Complete - Wallet Works (Auth, Wallet Creation, Balance, Faucet) |
| 0.2.0 | 2025-12-13 | Base Sepolia Deployment + Database + Testing (V0.5 100% Complete) |
| 0.1.0 | 2024-12-13 | V0.5 MVP 85% - Contracts + Escrow Integration |
| 0.0.1 | 2024-12-12 | Initial scaffolding |
