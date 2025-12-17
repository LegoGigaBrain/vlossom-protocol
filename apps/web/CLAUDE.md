# Web App

> Purpose: Main customer-facing web application (PWA) for booking services, managing profiles, and wallet interactions.

## Current Implementation Status

**V6.3.0 Phase 2 UX & Infrastructure** (Dec 17, 2025)

Professional frontend tooling, theme system, desktop navigation, empty state presets, and enhanced booking error handling.

**V6.2.0 Security & Smart Contract Hardening** (Dec 17, 2025)

OpenAPI documentation, TypeScript type safety improvements, smart contract security fixes.

**V6.1.0 Orange Color Governance Enforcement** (Dec 17, 2025)

Sacred orange rule enforced across 12 files. Orange (#FF510D) now strictly reserved for growth & celebration only (<8% surface). Errors use red, warnings use amber.

**V6.0.0 Mobile App + Full Frontend Design Handover** (Dec 17, 2025)

Complete design system with botanical icons (28 SVGs), animation system (unfold/breathe/settle), and typography/color audits. All design documentation updated.

---

### V6.3.0 Changes

**Frontend Logger System**
- `lib/logger.ts` - Structured logging with log levels (error, warn, info, debug, trace)
- Log grouping support for complex operations
- Environment-aware (dev logs everything, production logs errors/warnings only)
- Replaces direct console.* calls across the app

**ESLint Configuration**
- `.eslintrc.json` - Added `no-console` rule (error level)
- Enforces use of logger instead of console.log/warn/error
- Improves code quality and production log management

**React Query Configuration**
- `lib/query-config.ts` - Centralized React Query defaults
- Optimized stale times: 5 minutes (default), 1 minute (user data), 10 minutes (static data)
- Refetch on window focus for user data only
- Retry policy: 1 retry with exponential backoff

**Theme System**
- `components/ui/theme-toggle.tsx` - Theme switcher component
- Supports system/light/dark modes
- Persists theme preference to localStorage
- Smooth transitions between themes

**Desktop Navigation**
- `components/layout/desktop-nav.tsx` - Responsive top navigation for desktop/tablet
- Replaces bottom nav on larger screens
- Consistent with mobile bottom nav design
- Role-aware navigation items

**Empty State Presets**
- `components/ui/empty-state.tsx` - 14 predefined empty state presets
- Presets: no-bookings, no-stylists, no-notifications, no-transactions, no-services, etc.
- Consistent iconography and messaging
- Call-to-action buttons for each state

**Booking Error Handling**
- `components/booking/booking-dialog.tsx` - Enhanced error messages
- User-friendly error translations for common booking failures
- Better guidance for payment, availability, and validation errors
- Graceful degradation for unexpected errors

### V6.2.0 Changes

**Type Safety Improvements**
- Eliminated TypeScript `any` types in API client files
- Improved type inference and compile-time safety
- Aligned with backend API type definitions

**Documentation**
- Updated component documentation to reference OpenAPI specs
- API client functions now link to Swagger docs at `/api/docs`

### V6.1.0 Changes

**Color Governance Enforcement (12 files modified)**
- Error states now use `status-error` (red #D0021B) instead of orange
  - error-boundary.tsx, error.tsx, bookings pages, stylist pages
  - booking-details.tsx, payment-step.tsx
- Warning states now use `status-warning` (amber #F59E0B) instead of orange
  - cancel-dialog.tsx, location-selector.tsx
- Updated tailwind.config.js
  - `status.warning` changed from orange to amber
  - Added code comments documenting sacred orange governance
- Orange (#FF510D) reserved exclusively for:
  - Growth milestones
  - Achievement celebrations
  - Ritual completions
  - VlossomIcon `accent` prop for growth moments

---

**V5.3.0 Mock Data Feature Flag System** (Dec 17, 2025)

Demo mode enabled with `NEXT_PUBLIC_USE_MOCK_DATA=true`. All profile stats now wired with automatic mock fallback.

### V6.0.0 Changes

**Botanical Icon Library**
- `components/ui/vlossom-icons.tsx` - 28 React icon components (600+ lines)
  - Navigation: VlossomHome, VlossomSearch, VlossomCalendar, VlossomWallet, VlossomProfile, VlossomNotifications
  - State: VlossomHealthy, VlossomGrowing, VlossomResting, VlossomNeedsCare, VlossomTransition
  - Care: VlossomRitual, VlossomWashDay, VlossomProtectiveStyle, VlossomTreatment
  - Growth: VlossomStage1-4, VlossomMeter
  - Community: VlossomCommunity, VlossomSupport, VlossomLearning, VlossomVerified, VlossomFavorite, VlossomSettings, VlossomAdd, VlossomClose
- All icons derived from Vlossom flower linework (1.5pt stroke, organic curves)
- Props: size, className, accent (for growth moments only)

**Animation System**
- `styles/animations.css` - CSS animation system (250+ lines)
  - Motion tokens: duration (instant→dramatic), easing curves (unfold/breathe/settle)
  - Keyframes: unfold, breathe, settle, fade-in, slide-up, etc.
  - Utility classes: animate-unfold, animate-breathe, animate-settle
- `lib/motion.ts` - TypeScript motion utilities (150+ lines)
  - MotionContext provider
  - usePrefersReducedMotion() hook
  - useUnfoldMotion(), useBreatheMotion(), useSettleMotion() hooks

**Design Audits**
- Typography audit completed (see `docs/audits/TYPOGRAPHY_AUDIT.md`)
  - Confirmed Playfair Display for headlines, Inter for UI
  - All main pages compliant
- Color token audit completed (see `docs/audits/COLOR_AUDIT.md`)
  - Confirmed brand-rose = Primary Purple (#311E6B)
  - Identified 9 files with accent orange misuse (needs V6.1 fix)

**Updated Components**
- `components/layout/bottom-nav.tsx` - Now uses botanical icons (VlossomHome, VlossomCalendar, VlossomWallet, VlossomProfile)

---

### V5.3.0 Changes

**Mock Data Infrastructure**
- `lib/mock-data.ts` - Central mock data constants and helpers
- `shouldUseMockData()` - Auto-detect empty API responses
- Mock constants: MOCK_STYLISTS, MOCK_SALONS, MOCK_PROFILE_STATS, MOCK_STYLIST_STATS, MOCK_PROPERTY_STATS, MOCK_SOCIAL_STATS

**Profile Stats Hooks**
- `hooks/use-profile-stats.ts` - All profile-related stats with mock fallback:
  - `useStylistDashboardStats()` - Stylist business metrics
  - `usePropertyDashboardStats()` - Property owner metrics
  - `useSocialStats(userId)` - Follower/following counts
  - `useRewardsStats()` - Gamification/XP stats
  - `formatCurrency(cents)` - ZAR currency formatting
  - `formatPercentage(value)` - Percentage formatting

**Components Updated**
- Home page uses centralized MOCK_SALONS
- ProfileHeader wired to useSocialStats()
- RewardsCard wired to useRewardsStats()
- StylistTab wired to useStylistDashboardStats()
- SalonTab wired to usePropertyDashboardStats()
- "Demo Data" badge appears in development when using mock data

**Updated Hooks**
- `hooks/use-stylist-markers.ts` - Returns `isUsingMockData` flag
- `hooks/use-nearby-stylists.ts` - Mock fallback for stylists/salons

---

### V5.2.0 Changes

**Favorites System**
- `components/stylists/favorite-button.tsx` - Heart button with animations (sm/md/lg sizes)
- `hooks/use-favorites.ts` - React Query hooks (useFavorites, useToggleFavorite, useFavoriteStatus)
- `lib/favorites-client.ts` - Typed API client for favorites CRUD
- Integrated in StylistCard and StylistProfile components
- FavoritesStylistsCard displays real favorites on profile

**Map Component V5.2**
- `components/map/stylist-map.tsx` - Enhanced with:
  - Grid-based clustering for large datasets
  - List view fallback for accessibility
  - `usePrefersReducedMotion()` hook for reduced motion support
  - `useIsLowEndDevice()` hook for performance detection
  - `useViewPreference()` hook for preference persistence
  - Keyboard navigation (arrows, +/-, Enter, Ctrl+L)
  - Full ARIA labels and screen reader support
  - `StylistListItem` and `SalonListItem` components for list view

**Session Tracker**
- `components/bookings/session-tracker.tsx` - Live session tracking with:
  - Simplified 3-state model: Started → In Progress → Complete
  - SSE (Server-Sent Events) for real-time progress
  - Polling fallback when SSE unavailable
  - Connection status indicators
  - ETA display with progress bar
  - Compact mode for inline display

**Booking Stats Integration**
- Profile page wired to `useBookingStats()` hook
- `BookingStatsCard` displays real booking history
- `FavoritesStylistsCard` uses `useFavorites()` hook

**New Hooks**
- `hooks/use-favorites.ts` - Favorites management
- `hooks/use-stylist-markers.ts` - Map marker data fetching

---

### V5.1.0 Changes

**Phase 1: API Client Layer**
- `lib/hair-health-client.ts` - Typed API client for hair health endpoints
- `lib/stylist-context-client.ts` - Consent-based profile sharing client
- `lib/calendar-client.ts` - Calendar-specific booking functions
- Profile CRUD, learning progress, stylist context operations

**Phase 2: React Query Hooks**
- `hooks/use-hair-health.ts` - Profile and learning hooks
  - `useHairProfile()`, `useHairProfileWithAnalysis()`
  - `useCreateHairProfile()`, `useUpdateHairProfile()`, `useDeleteHairProfile()`
  - `useLearningProgress()`, `useUnlockLearningNode()`
- `hooks/use-stylist-context.ts` - Sharing hooks
  - `useMyStylistShares()`, `useGrantStylistAccess()`, `useRevokeStylistAccess()`
  - `useMyCustomers()`, `useCustomerContext()`, `useUpdateCustomerNotes()`
- `hooks/use-calendar-bookings.ts` - Calendar view hooks
  - `useCalendarBookings()`, `useMonthBookings()`, `useWeekBookings()`, `useDayBookings()`
  - `useUpcomingBookings()`, `useCalendarEvents()`

**Phase 3: Hair Health Pages**
- `app/(main)/profile/hair-health/page.tsx` - Main dashboard with:
  - Health Score Card (A-F grade, archetype)
  - Hair Snapshot (texture, pattern, porosity, density)
  - Care Insights (recommendations)
  - Profile Analysis (strengths, concerns)
  - Learning Progress (unlock buttons)
- `app/(main)/profile/hair-health/onboarding/page.tsx` - 5-step wizard
- `app/(main)/profile/hair-health/edit/page.tsx` - Tabbed editor

**Phase 4: Schedule Integration** ✅
- Connected calendar views to real booking data from API
- GET /api/v1/bookings endpoint with filtering (role, status, date range)
- transformBookingsToCalendarEvents() for calendar compatibility
- Combined real bookings with mock rituals (ritual API pending)

**Phase 7: Navigation Refactor** ✅
- Created `(main)` route group with shared layout
- BottomNav consolidated into single `app/(main)/layout.tsx`
- Moved pages: home, schedule, profile, stylists, bookings
- Updated all imports to use `@/` path aliases
- Removed duplicate BottomNav from individual pages

---

### V5.0 Backend Changes

**Real-Time Hooks (Phase 4)**
- `hooks/use-location-tracking.ts` - Consent-based location tracking for stylists
- `hooks/use-live-updates.ts` - SSE connection for real-time booking updates

**Supported Features:**
- Geolocation with permission prompts
- Session-only location sharing (no persistence)
- Server-Sent Events for live booking status
- Auto-reconnect with exponential backoff

---

## Canonical References
- [Doc 15: Frontend UX Flows](../../docs/vlossom/15-frontend-ux-flows.md)
- [Doc 16: UI Components and Design System](../../docs/vlossom/16-ui-components-and-design-system.md)
- [Doc 17: Property Owner and Chair Rental Module](../../docs/vlossom/17-property-owner-and-chair-rental-module.md)
- [Doc 19: Travel and Cross-Border Bookings](../../docs/vlossom/19-travel-and-cross-border-bookings.md)
- [Doc 27: UX Flows and Wireframes](../../docs/vlossom/27-ux-flows-and-wireframes.md)

## Current Implementation Status

**V4.0.0 Complete - DeFi Integration** (Dec 16, 2025)

Full DeFi liquidity pool system activated in the wallet tab.

### V4.0.0 Changes

**DeFi Tab Activation (Wallet)**
- `/wallet/defi` — Fully functional DeFi page (replaced stub)
- Pool list with Genesis Pool and community pools
- Pool detail cards with APY, TVL, status
- Deposit dialog with amount input and pool selection
- Withdraw dialog with share calculation
- Yield summary with claimable amounts
- Tier progress indicator (referral percentile)
- Create pool dialog (tier-gated for top referrers)

**Admin DeFi Console**
- `/admin/defi` — DeFi admin dashboard
- APY parameter configuration (base rate, slopes, optimal utilization)
- Fee split management (Treasury/LP/Buffer percentages)
- Pool pause/unpause controls
- Emergency pause all pools
- Global DeFi statistics

**New Components**
- `components/defi/pool-card.tsx` — Pool display with APY badge
- `components/defi/pool-list.tsx` — Filterable pool grid
- `components/defi/deposit-dialog.tsx` — Deposit flow
- `components/defi/withdraw-dialog.tsx` — Withdraw flow
- `components/defi/yield-summary.tsx` — User's yield overview
- `components/defi/tier-badge.tsx` — Referral tier display
- `components/defi/create-pool-dialog.tsx` — Pool creation (tier-gated)

---

**V3.4.0 Complete - Pre-Styling Completion** (Dec 16, 2025)

All features completed before UI/UX styling phase. Full admin panel, wallet tabs, settings, and profile enhancements.

### V3.4.0 Changes (10 Sprints)

**Sprint 1: Wallet Tab Structure**
- 5-tab wallet layout (Overview, DeFi, Rewards, History, Advanced)
- `wallet-tabs.tsx` navigation component
- DeFi stub page with "Coming in V4.0" placeholders
- Rewards page with XP, badges, streaks, tier progression
- History page with full transaction filtering
- Advanced page with wallet address, QR code, network info

**Sprint 2: Kotani Pay Integration**
- On-ramp flow (ZAR → USDC) via Kotani sandbox
- Off-ramp flow (USDC → ZAR/Mobile Money)
- Updated add-money-dialog and withdraw-dialog
- New `/api/v1/fiat/*` routes for Kotani integration

**Sprint 3: Rewards & XP System**
- XP points tracking (customer, stylist, owner)
- Streak counter display
- Badge gallery with earned/available badges
- Tier progress (Bronze → Diamond) with benefits

**Sprint 4: Settings Page**
- 6 settings sections: Account, Display, Notifications, Privacy, Security, Advanced
- Currency selector (ZAR, USD, USDC, KES, NGN, GHS)
- Notification preferences by category
- Privacy visibility controls
- Web3 mode toggle (future)

**Sprint 5: Admin Dispute Resolution**
- Disputes list with filtering and search
- Dispute detail page with evidence viewer
- Resolution workflow (assign, review, resolve, escalate, close)
- Message thread for dispute communication

**Sprint 6: Admin Financial Dashboard**
- Finance dashboard with metrics (escrowed, payouts, revenue, refund rate)
- Pending settlements list
- Refund queue management
- Payout history table

**Sprint 7: Admin Property & User Management**
- User actions (freeze/unfreeze/warn)
- Property verification workflow (verify/reject)
- Enhanced user and property detail views

**Sprint 8: Admin System & Logs**
- Audit log viewer with filtering
- Action breakdown statistics
- Admin activity tracking

**Sprint 9: Customer Profile Enhancement**
- Booking statistics (total, this month, as customer/stylist)
- Rewards summary widget (XP, tier, streak, badges)
- Favorite stylists list
- Hair type preferences (optional)
- Social links (Instagram, TikTok)

**Sprint 10: Documentation & Testing**
- Updated CLAUDE.md files
- Changelog updates

---

**V3.3.0 Complete - Feature Completion (Pre-DeFi)** (Dec 16, 2025)

All user-facing flows and UX pathways are now complete.

### V3.3.0 Changes (8 Sprints)

**Sprint 1-2: UX Foundations & Auth**
- Toast notification system (Radix Toast)
- Form components (Select, Switch, Checkbox, Textarea)
- Skeleton/Empty/Error state components
- Password reset flow (forgot + reset pages)
- Customer profile page

**Sprint 3: Notifications UI**
- NotificationBell with badge
- NotificationDropdown
- Full notifications page
- Shared AppHeader and BottomNav layout components

**Sprint 4: Reviews & Ratings**
- StarRating component (interactive + display)
- ReputationBadge with levels
- ReviewCard, ReviewList with filtering
- ReviewDialog for post-booking reviews

**Sprint 5: Booking Completion Flow**
- ConfirmServiceDialog with tip option
- TipDialog for standalone tipping
- BookingReceipt (printable)
- BookingSuccess screen
- RescheduleDialog

**Sprint 6: Disputes & Issues**
- ReportIssueDialog (6 issue categories)
- DisputeDialog (2-step escalation)
- DisputeStatus timeline component

**Sprint 7: Utility Dialogs**
- ProfileEditDialog, DeleteAccountDialog
- LogoutConfirmDialog, ShareProfileDialog
- BookingQuickViewDialog, LocationPermissionDialog

**Sprint 8: Help Center & Polish**
- Help center main page with search
- 4 help category pages (bookings, wallet, stylists, security)
- Contact support form

---

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
| `/notifications` | Full notifications page | ✅ V3.3 |
| `/profile` | Customer profile view/edit | ✅ V3.3 |
| `/help` | Help center home | ✅ V3.3 |
| `/help/bookings` | Bookings FAQ | ✅ V3.3 |
| `/help/wallet` | Wallet & payments FAQ | ✅ V3.3 |
| `/help/stylists` | Finding stylists FAQ | ✅ V3.3 |
| `/help/security` | Account & security FAQ | ✅ V3.3 |
| `/contact` | Contact support form | ✅ V3.3 |
| `/wallet/defi` | DeFi liquidity pools | ✅ V4.0 |
| `/wallet/rewards` | Rewards, XP, badges | ✅ V3.4 |
| `/wallet/history` | Transaction history | ✅ V3.4 |
| `/wallet/advanced` | Wallet address, Web3 | ✅ V3.4 |
| `/settings` | Account settings | ✅ V3.4 |
| `/settings/display` | Display preferences | ✅ V3.4 |
| `/settings/notifications` | Notification preferences | ✅ V3.4 |
| `/settings/privacy` | Privacy settings | ✅ V3.4 |
| `/settings/security` | Security settings | ✅ V3.4 |
| `/settings/advanced` | Advanced settings | ✅ V3.4 |
| `/admin/disputes` | Dispute management | ✅ V3.4 |
| `/admin/disputes/[id]` | Dispute detail | ✅ V3.4 |
| `/admin/finance` | Financial dashboard | ✅ V3.4 |
| `/admin/properties` | Property management | ✅ V3.4 |
| `/admin/logs` | Audit logs | ✅ V3.4 |
| `/admin/defi` | DeFi admin console | ✅ V4.0 |

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

**`ui/`** — Base primitives (Button, Input, Label, Dialog, Skeleton, Toast)

**`layout/`** — Shared Layout Components (V3.3)
- `app-header.tsx` — Reusable header with NotificationBell, back button, profile link
- `bottom-nav.tsx` — Mobile bottom navigation (Discover, Bookings, Wallet, Profile)

**`notifications/`** — In-App Notifications (V3.3)
- `notification-bell.tsx` — Header bell icon with unread badge
- `notification-dropdown.tsx` — Notification dropdown list
- `notification-item.tsx` — Single notification display

**`reviews/`** — Reviews & Ratings (V3.3)
- `star-rating.tsx` — Interactive star rating input + RatingDisplay
- `reputation-badge.tsx` — Reputation level badge (new/rising/trusted/verified/elite)
- `review-card.tsx` — Single review display with helpful/report actions
- `review-list.tsx` — Review list with filtering and sorting
- `review-dialog.tsx` — Post-booking review submission dialog

**`dialogs/`** — Utility Dialogs (V3.3)
- `profile-edit-dialog.tsx` — Quick profile name/avatar edit
- `delete-account-dialog.tsx` — Account deletion confirmation ("Type DELETE")
- `logout-confirm-dialog.tsx` — Logout confirmation
- `share-profile-dialog.tsx` — Share stylist profile (copy link, social share)
- `booking-quick-view-dialog.tsx` — Compact booking details (from notifications)
- `location-permission-dialog.tsx` — Geolocation permission request

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

**`bookings/`** — Booking Management (M2 + V3.3)
- `booking-list.tsx` — List with empty states
- `booking-card.tsx` — Booking item card
- `booking-details.tsx` — Full booking info
- `status-badge.tsx` — Color-coded status
- `cancel-dialog.tsx` — Cancellation with refund preview
- `confirm-service-dialog.tsx` — Customer confirms completion + optional tip (V3.3)
- `tip-dialog.tsx` — Standalone tipping with preset amounts (V3.3)
- `reschedule-dialog.tsx` — Reschedule booking date/time (V3.3)
- `report-issue-dialog.tsx` — Report booking issues (V3.3)
- `dispute-dialog.tsx` — Escalate to platform mediation (V3.3)
- `dispute-status.tsx` — Dispute progress timeline (V3.3)

**`booking/`** — Booking Flow (M2 + V3.3)
- `booking-dialog.tsx` — Multi-step dialog (7 steps)
- `service-step.tsx` — Service selection
- `datetime-picker.tsx` — Calendar + time slots
- `location-step.tsx` — Location type toggle
- `summary-step.tsx` — Price breakdown
- `payment-step.tsx` — USDC payment flow
- `booking-receipt.tsx` — Printable booking receipt (V3.3)
- `booking-success.tsx` — Success screen with next steps (V3.3)

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
