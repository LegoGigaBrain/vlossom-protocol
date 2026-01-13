# Changelog

All notable changes to Vlossom Protocol will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [8.0.0] - 2026-01-08

### V8.0.0: Security Audit Fixes - COMPLETE ✅

**Goal**: Resolve all 24 security findings from pre-production security audit across Critical, High, and Medium priorities.

---

#### ✅ CRITICAL Security Fixes (5 items)

**1. CSRF Protection**
- Applied csurf middleware to all state-changing API routes
- CSRF token required in X-CSRF-Token header for POST/PUT/DELETE
- Files: `services/api/src/middleware/csrf.ts`, all route files

**2. Cookie Name Mismatch**
- Fixed auth middleware to read from ACCESS_TOKEN cookie (was looking at wrong name)
- Files: `services/api/src/middleware/auth.ts`

**3. Cookie Auth Migration**
- Updated 13 web API clients to use `credentials: 'include'` for cookie auth
- Removed all localStorage token handling from web clients
- Files: `apps/web/lib/*-client.ts`

**4. Address Validation**
- Replaced insecure custom Keccak256 implementation with viem's isAddress
- Added EIP-55 checksum validation
- Files: `apps/mobile/src/utils/address-validation.ts`

**5. Content Security Policy**
- Added CSP headers via Next.js middleware
- Configured script-src, style-src, connect-src directives
- Files: `apps/web/middleware.ts`

---

#### ✅ HIGH Security Fixes (13 items)

**1. CORS X-CSRF-Token**
- Added X-CSRF-Token to exposedHeaders in CORS config
- Files: `services/api/src/middleware/cors.ts`

**2. CORS Origin Validation**
- Fixed allowedOrigins to include protocol prefixes (http://, https://)
- Files: `services/api/src/middleware/cors.ts`

**3. Internal Auth Enforcement**
- Throws error if INTERNAL_AUTH_SECRET is missing in production
- Files: `services/api/src/routes/internal.ts`

**4. Password Reset Logging**
- Removed reset token from log output to prevent token exposure
- Files: `services/api/src/routes/auth.ts`

**5. Account Lockout Redis**
- Migrated from in-memory Map to Redis for distributed lockout tracking
- Works correctly across multiple API instances
- Files: `services/api/src/middleware/rate-limiter.ts`

**6. HTTPS Enforcement**
- Added middleware to redirect HTTP to HTTPS in production
- Files: `services/api/src/middleware/https.ts`

**7. Error Details Removal**
- Stripped stack traces and detailed error messages in production
- Files: `services/api/src/middleware/error-handler.ts`

**8. Mobile Token Refresh**
- Implemented automatic 401 handling with token refresh
- Files: `apps/mobile/src/api/client.ts`

**9. Web EIP-55 Validation**
- Added checksum address validation to web wallet forms
- Files: `apps/web/lib/validation.ts`

**10. Input Length Limits**
- Added maxLength constraints to all form inputs
- Files: `apps/web/components/ui/input.tsx`

**11. Mobile Error Boundaries**
- Added error boundaries at route and component levels
- Prevents crashes from propagating
- Files: `apps/mobile/src/components/ErrorBoundary.tsx`

**12. localStorage Removal**
- Removed localStorage token fallback, cookies only for web auth
- Files: `apps/web/lib/auth-client.ts`

**13. Animation Memory Leaks**
- Fixed useRef cleanup in motion components
- Files: `apps/web/lib/motion.ts`

---

#### ✅ MEDIUM Security Fixes (6 items)

**1. Password Complexity Requirements**
- Added validation: 8+ chars, uppercase, lowercase, number
- Applied to signup, reset-password, change-password endpoints
- Updated mobile signup with validatePassword function
- Files: `services/api/src/routes/auth.ts`, `apps/mobile/src/utils/input-validation.ts`

**2. Email Enumeration Timing Attack**
- Added constant-time responses using dummy bcrypt hash
- Always performs hash comparison even for non-existent users
- Artificial delay (100-250ms) for forgot-password on non-existent emails
- Files: `services/api/src/routes/auth.ts`

**3. SIWE Nonce Cleanup**
- Added scheduler job to clean up expired SIWE nonces
- Deletes expired nonces and used nonces older than 1 hour
- Files: `services/scheduler/src/index.ts`

**4. Request Timeouts**
- Added 30s timeout to mobile API client
- Prevents indefinite request hangs
- Files: `apps/mobile/src/api/client.ts`

**5. Unused Dependencies**
- Removed lucide-react from web package.json
- All icons now use Phosphor via Icon bridge
- Files: `apps/web/package.json`

**6. Refresh Token Database Storage**
- Created RefreshToken model in Prisma schema
- Implemented token-service.ts with:
  - SHA-256 hashing (never store plaintext)
  - Token rotation with family tracking
  - Reuse detection (revokes entire family if rotated token reused)
  - Cleanup job in scheduler
- Updated auth routes: login creates DB token, logout revokes, refresh rotates
- Files: `services/api/src/lib/token-service.ts`, `services/api/prisma/schema.prisma`, migration

---

#### Database Migration

**New Table: refresh_tokens**
```sql
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
```

**Indexes:**
- `refresh_tokens_tokenHash_key` (unique)
- `refresh_tokens_replacedById_key` (unique)
- `refresh_tokens_userId_idx`
- `refresh_tokens_tokenHash_idx`
- `refresh_tokens_familyId_idx`
- `refresh_tokens_expiresAt_idx`

---

#### Security Architecture Summary

**Token Management:**
- Access tokens: 15-minute expiry, httpOnly cookies
- Refresh tokens: 7-day expiry, SHA-256 hashed in database
- Token rotation: New token on each refresh, old marked as replaced
- Reuse detection: If rotated token is reused, entire family revoked

**Authentication Flow:**
1. Login → Create DB-backed refresh token + access token cookie
2. API calls → Validate access token from cookie
3. Token expired → Client calls /api/v1/auth/refresh
4. Refresh → Validate DB token, rotate, issue new access token
5. Logout → Revoke refresh token in database

---

## [7.5.1] - 2025-12-28

### V7.5.1: Branding Consistency - COMPLETE ✅

**Goal**: Ensure consistent brand presentation across web and mobile with proper favicon and SVG wordmarks.

---

#### ✅ Web Favicon Configuration

**Files Created:**
- `apps/web/public/favicon.svg` - Copied from design/brand/logos/Favicon-purple.svg

**Files Modified:**
- `apps/web/app/layout.tsx` - Added icons metadata for favicon configuration

---

#### ✅ Landing Page Wordmarks

**Files Modified:**
- `apps/web/components/landing/LandingNavbar.tsx` - VlossomWordmark with variant="auto"
- `apps/web/components/landing/LandingFooter.tsx` - VlossomWordmark with variant="cream"

**Implementation:**
- Navbar uses `variant="auto"` for theme-aware switching (purple on light, cream on dark)
- Footer uses `variant="cream"` for visibility on purple background

---

#### ✅ Mobile Wordmark Components

**Files Created:**
- `apps/mobile/src/components/branding/VlossomWordmark.tsx` - SVG wordmark with theme support
- `apps/mobile/src/components/branding/VlossomIcon.tsx` - SVG icon for consistency
- `apps/mobile/src/components/branding/index.ts` - Barrel export

**VlossomWordmark Props:**
```typescript
interface VlossomWordmarkProps {
  height?: number;        // Default: 24
  variant?: 'purple' | 'cream' | 'auto';
  style?: ViewStyle;
}
```

**Features:**
- Uses `react-native-svg` for SVG rendering
- Aspect ratio 8:1 (width calculated from height)
- Auto variant uses `useColorScheme()` for theme detection
- Purple (#311E6B) for light mode, Cream (#EFE3D0) for dark mode

---

#### ✅ Mobile Auth Screen Updates

**Files Modified:**
- `apps/mobile/app/(auth)/login.tsx` - VlossomWordmark replaces text logo
- `apps/mobile/app/(auth)/signup.tsx` - VlossomWordmark replaces text logo
- `apps/mobile/app/(auth)/forgot-password.tsx` - VlossomWordmark replaces text logo

**Changes:**
- Import VlossomWordmark from branding components
- Replace `<Text style={styles.logo}>Vlossom</Text>` with `<VlossomWordmark height={32} variant="purple" />`
- Simplified logo style to only margin (removed font properties)

---

#### ✅ Mobile Settings Header

**Files Modified:**
- `apps/mobile/app/settings/index.tsx` - VlossomWordmark in header

**Implementation:**
- Replaced "Settings" text with `<VlossomWordmark height={24} variant="auto" />`
- Uses auto variant for theme-aware switching

---

#### Files Summary (V7.5.1)

| Category | Files | Description |
|----------|-------|-------------|
| Web Assets | 1 | favicon.svg |
| Web Config | 1 | layout.tsx metadata |
| Web Components | 2 | LandingNavbar, LandingFooter |
| Mobile Components | 3 | VlossomWordmark, VlossomIcon, index |
| Mobile Auth | 3 | login, signup, forgot-password |
| Mobile Settings | 1 | settings/index |

**Total:** 11 files created/modified

---

## [7.5.0] - 2025-12-28

### V7.5.0: Splash Screen & Landing Page - COMPLETE ✅

**Goal**: Add animated mobile splash screen and full marketing landing page to complete MVP user experience.

---

#### ✅ Mobile Animated Splash Screen

**Files Created:**
- `apps/mobile/src/components/splash/AnimatedSplash.tsx` - Full-screen animated splash component
- `apps/mobile/src/components/splash/VlossomSplashIcon.tsx` - Cream icon on purple background
- `apps/mobile/src/components/splash/index.ts` - Barrel export
- `apps/mobile/src/hooks/useAnimatedSplash.ts` - Animation orchestration hook
- `apps/mobile/src/hooks/useReducedMotion.ts` - Accessibility check for reduced motion

**Files Modified:**
- `apps/mobile/app/_layout.tsx` - Integrated AnimatedSplash after native splash hides
- `apps/mobile/src/hooks/index.ts` - Export new hooks

**Animation Sequence (1s total):**
- 0-300ms: Fade in + scale (0.8 → 1.0) with unfold easing
- 300-600ms: Subtle breathe pulse (1.0 → 1.02 → 1.0)
- 600-1000ms: Hold, then fade out to app

**Features:**
- Uses `react-native-reanimated` for performant animations
- Respects `prefers-reduced-motion` (skip scale, use fade only)
- Background: `#311E6B` (brand purple)
- Icon: Vlossom cream icon SVG

---

#### ✅ Web Marketing Landing Page

**Files Created:**
- `apps/web/components/landing/index.ts` - Barrel export
- `apps/web/components/landing/LandingNavbar.tsx` - Fixed nav with glass effect on scroll
- `apps/web/components/landing/HeroSection.tsx` - Full-height hero with CTAs
- `apps/web/components/landing/HowItWorksSection.tsx` - 3-step process (Discover → Book → Blossom)
- `apps/web/components/landing/ForCustomersSection.tsx` - Customer value props
- `apps/web/components/landing/ForStylistsSection.tsx` - Stylist value props
- `apps/web/components/landing/ForOwnersSection.tsx` - Property owner value props
- `apps/web/components/landing/CTASection.tsx` - Final conversion banner
- `apps/web/components/landing/LandingFooter.tsx` - Multi-column footer with links
- `apps/web/components/landing/FeatureCard.tsx` - Reusable feature card component
- `apps/web/components/landing/AnimatedSection.tsx` - Scroll-triggered animations

**Files Modified:**
- `apps/web/app/page.tsx` - Replaced with composed landing page
- `apps/web/package.json` - Added `react-intersection-observer`

**Page Structure:**
```
┌─────────────────────────────────────────┐
│ NAVBAR: Logo | Links | Login            │
├─────────────────────────────────────────┤
│ HERO: "Where You Blossom"               │
│ [Launch App] [Book] [Offer Services]    │
├─────────────────────────────────────────┤
│ HOW IT WORKS: Discover → Book → Blossom │
├─────────────────────────────────────────┤
│ FOR CUSTOMERS: Value props              │
├─────────────────────────────────────────┤
│ FOR STYLISTS: Value props               │
├─────────────────────────────────────────┤
│ FOR SALON OWNERS: Value props           │
├─────────────────────────────────────────┤
│ CTA: "Ready to blossom?" [Launch App]   │
├─────────────────────────────────────────┤
│ FOOTER: Links | Social | Legal          │
└─────────────────────────────────────────┘
```

**CTA Routing:**
| Button | Destination |
|--------|-------------|
| "Launch App" (primary) | `/onboarding` |
| "Book Appointment" | `/search` |
| "Offer Services" | `/onboarding?role=stylist` |

**Design:**
- Orange "Launch App" CTA using sacred orange (#FF510D) for growth/celebration
- Scroll animations: `unfold` for hero, `settle` for scroll reveals
- Typography: Playfair Display headlines, Inter body

---

#### Files Summary (V7.5.0)

| Category | Files | Description |
|----------|-------|-------------|
| Mobile Splash | 3 | AnimatedSplash, VlossomSplashIcon, index |
| Mobile Hooks | 2 | useAnimatedSplash, useReducedMotion |
| Mobile Layout | 1 | _layout.tsx integration |
| Web Landing | 11 | All landing page components |
| Web Config | 1 | package.json (intersection-observer) |

**Total:** 18+ files created/modified

---

## [7.4.0] - 2025-12-27

### V7.4.0: Motion System Implementation - COMPLETE ✅

**Goal**: Activate the Vlossom motion system (unfold/breathe/settle) across core UI components.

---

#### ✅ Web Tailwind Motion Keyframes

**Files Modified:**
- `apps/web/tailwind.config.js` - Added motion keyframes

**Keyframes Added:**
- `unfold` - Organic reveal like petal opening (scale 0.95→1, opacity 0→1)
- `settle` - Gentle ease into place (translateY 8px→0, opacity 0→1)
- `breathe` - Subtle scale pulse (1→1.02→1)
- `petalOpen` - Complex petal unfurling animation

**Animation Classes:**
- `animate-unfold` - 300ms unfold easing
- `animate-settle` - 200ms settle easing
- `animate-breathe` - 2s infinite breathing

---

#### ✅ Component Motion Integration

**Dialog (apps/web/components/ui/dialog.tsx):**
- Uses `animate-unfold` for organic petal-opening reveal
- Applied to DialogContent component

**Card (apps/web/components/ui/card.tsx):**
- Supports optional `animate` prop for settle animation
- `animate={true}` adds `animate-settle` class

**EmptyState (apps/web/components/ui/empty-state.tsx):**
- Uses `animate-settle` on mount
- Provides gentle entry for empty state illustrations

**BookingSuccess (apps/web/components/booking/booking-success.tsx):**
- Uses `animate-unfold` for main success content
- Staggered `animate-settle` for detail items
- Creates celebration flow for booking confirmation

---

#### ✅ Mobile Motion Integration

**Card (apps/mobile/src/components/ui/Card.tsx):**
- Integrates `useSettleMotion` hook
- Animated.View with settle transform

**EmptyState (apps/mobile/src/components/ui/EmptyState.tsx):**
- Uses settle animation via Animated.View
- Matches web empty state motion

---

#### ✅ Reduced Motion Support

All animations respect `prefers-reduced-motion`:
- Web: CSS `@media (prefers-reduced-motion: reduce)` disables animations
- Mobile: `useReducedMotion` hook checks accessibility settings
- Graceful degradation to instant transitions

---

#### Files Summary (V7.4.0)

| Category | Files | Description |
|----------|-------|-------------|
| Web Config | 1 | tailwind.config.js keyframes |
| Web Components | 4 | dialog, card, empty-state, booking-success |
| Mobile Components | 2 | Card, EmptyState |

**Total:** 7 files modified

---

## [7.3.0] - 2025-12-27

### V7.3.0: Production Readiness - COMPLETE ✅

**Goal**: Prepare Vlossom Protocol for App Store submission and production deployment with push notifications, full build configuration, security audit preparation, and production environment setup.

---

#### ✅ Sprint 1: Stylist Mobile Experience

**1.1 Stylist Availability Management**
- `apps/mobile/app/stylist/availability.tsx` - Weekly schedule editor
- Set operating hours per day (Mon-Sun)
- Exception dates for holidays/time off
- Sync with API: `PUT /api/v1/stylists/me/availability`

**1.2 Stylist Booking Requests Queue**
- `apps/mobile/app/stylist/requests.tsx` - Pending booking management
- Pull-to-refresh for new requests
- Approve/Decline with confirmation
- Empty state for no pending requests

**1.3 Stylist Profile Editor**
- `apps/mobile/app/stylist/profile.tsx` - Full profile management
- Avatar and portfolio uploads (Cloudinary)
- Bio and display name editing
- Operating mode toggle (MOBILE/FIXED/MULTI_LOCATION)

---

#### ✅ Sprint 2: Full Real-Time Session Tracker

**2.1 Mobile Session Tracker Component**
- `apps/mobile/src/components/booking/SessionTracker.tsx`
- Progress bar (0-100%) with color coding
- Stylist ETA in minutes
- Connection status indicator
- Polling-based updates with fallback

**2.2 Active Session Screen (Customer View)**
- `apps/mobile/app/booking/active/[id].tsx`
- Full progress visualization
- Estimated time remaining
- Contact stylist button
- Session complete notifications

**2.3 Stylist Session Control Panel**
- `apps/mobile/app/stylist/session/[id].tsx`
- "I've Arrived" check-in button
- Progress slider (25%, 50%, 75%, 100%)
- Session notes
- "Complete Session" button

**2.4 Zustand Store for Sessions**
- `apps/mobile/src/stores/session.ts`
- Active session state management
- Polling with fallback
- Optimistic updates

---

#### ✅ Sprint 3.1: Push Notifications Setup

**Database Schema**
- Added `PUSH` to `NotificationChannel` enum
- Added `PushPlatform` enum (IOS, ANDROID, WEB)
- Added `PushToken` model with userId, token, platform, deviceId

**API Push Provider**
- `services/api/src/lib/notifications/push-provider.ts` (~280 lines)
- Expo Push Notifications integration
- Batch sending with chunking (100 per batch)
- Token validation with Expo format
- Receipt handling for error tracking
- Token cleanup on invalid responses

**API Endpoints**
- `POST /api/v1/notifications/push-token` - Register device token
- `DELETE /api/v1/notifications/push-token` - Unregister token
- `GET /api/v1/notifications/push-token/count` - Active token count

**Mobile Push Service**
- `apps/mobile/src/services/push-notifications.ts` (~350 lines)
- Permission request with graceful fallback
- Expo push token retrieval
- Token registration with API
- Notification response handling
- Badge management
- Android channel setup (bookings, messages, reminders)

**Notification Integration**
- Updated `notification-service.ts` to include PUSH channel
- Booking notifications now send push
- Special event notifications now send push

---

#### ✅ Sprint 3.2: App Store Requirements

**Updated `apps/mobile/app.json` to v7.3.0:**
- iOS: buildNumber, privacy manifests, associated domains
- Android: versionCode, intent filters for deep links
- Push notification sounds configuration
- Locale support (en, zu, af)
- EAS project ID configuration

**Updated `apps/mobile/eas.json`:**
- Development profile with simulator support
- Preview profile with internal distribution
- Production profile for store submission
- iOS App Store Connect configuration
- Android Play Console configuration (internal track)

**Updated `apps/mobile/package.json` to v7.3.0:**
- All EAS build scripts (dev, preview, production)
- Platform-specific build scripts
- Store submission scripts

---

#### ✅ Sprint 3.3: Security Audit Preparation

**New File:** `docs/security/SECURITY_AUDIT_CHECKLIST.md` (266 lines)

12-section comprehensive security audit checklist:
1. Authentication & Authorization (JWT, SIWE, Password Security, Mobile Security)
2. API Security (Rate Limiting, Input Validation, CSRF, Error Handling)
3. Smart Contract Security (VlossomAccount, VlossomPaymaster, YieldEngine, Escrow)
4. Data Security (Sensitive Data, Database, API Response Filtering)
5. Infrastructure Security (Environment Config, Dependencies, Logging)
6. Mobile App Security (Data Storage, Network Security, Deep Links)
7. Third-Party Integrations (Expo Push, Clickatell, SendGrid, Cloudinary)
8. Compliance Checklist (POPIA, App Store Requirements)
9. Pre-Audit Tasks (Code Preparation, Documentation, Credentials)
10. API Endpoints Summary with rate limits
11. Critical Files for Audit (Authentication, Authorization, Financial, Data Access)
12. Known Issues & Mitigations

---

#### ✅ Sprint 3.4: Production Environment Setup

**New File:** `services/api/.env.production.example`

Complete production environment template:
- Database configuration (PostgreSQL connection string)
- Redis configuration (Redis Cloud)
- JWT secrets (access + refresh)
- SIWE configuration
- Push notification settings (Expo)
- Email configuration (SendGrid)
- SMS configuration (Clickatell)
- File upload configuration (Cloudinary)
- Blockchain configuration (Base mainnet RPC)
- External services (Kotani Pay)
- Monitoring configuration (Sentry)

---

#### Files Summary (V7.3.0)

| Category | Files | Description |
|----------|-------|-------------|
| Prisma Schema | 1 | PUSH channel, PushToken model |
| API Push Provider | 1 | Expo push integration |
| API Routes | 1 | Push token endpoints |
| Notification Service | 3 | Push channel support |
| Mobile Push Service | 2 | Push notifications + index |
| Mobile API Client | 1 | getApiUrl() helper |
| Mobile Layout | 1 | Push initialization |
| App Configuration | 3 | app.json, eas.json, package.json |
| Security Docs | 1 | Audit checklist |
| Environment | 1 | Production template |
| Mobile Screens | 6 | Stylist availability, requests, profile, sessions |
| Session Components | 2 | SessionTracker, session store |

**Total:** ~1,500+ lines of new code

---

## [7.0.0] - 2025-12-20

### V7.0.0: Security, Admin Panel & UX Hardening

**Goal**: Address all security findings from V6.10.0 comprehensive review, complete admin panel, and improve UX.

---

#### ✅ Phase 1: Critical Auth Security (P0)

**H-1: JWT httpOnly Cookie Migration**
- Migrated JWT tokens from localStorage to httpOnly cookies (XSS protection)
- Added `cookie-config.ts` with secure cookie options
- Added CSRF middleware with double-submit token pattern
- Updated auth middleware to read from cookies with Bearer header fallback
- Web auth-client now uses `credentials: 'include'`

**H-2: Refresh Token Rotation**
- Added `/auth/refresh` endpoint with token rotation
- Reduced access token expiry to 15 minutes
- Refresh tokens valid for 7 days
- Auto-refresh on 401 TOKEN_EXPIRED responses

**H-3: SIWE Nonce Race Condition Fix**
- Fixed `/auth/link-wallet` to use atomic Prisma transaction
- Prevents nonce reuse attacks with concurrent requests

**H-4: Rate Limit Fail-Closed**
- Added `REQUIRE_REDIS` environment variable
- Returns 503 Service Unavailable when Redis required but not available
- Prevents rate limit bypass in production

---

#### ✅ Phase 2: Input Validation & Mobile Security (P1)

**H-5: QR Address Validation with EIP-55**
- Created `address-validation.ts` utility for mobile
- Validates Ethereum addresses with EIP-55 checksum
- Handles EIP-681 payment URIs
- Updated QRScanner to use proper validation

**H-6: Reset Token Format Validation**
- Added `/auth/reset-password/validate` endpoint
- Client-side validation: 64 hex characters
- Server-side validation before showing form
- Shows loading → valid/invalid/expired states

**M-2: Password Reset Rate Limiting**
- Updated forgot-password route to use `passwordReset` rate limiter
- 3 requests/hour with 60-minute block after limit

**M-4: Input Length Limits (Mobile)**
- Created `input-validation.ts` utility with limits
- Email: 254 chars, Password: 128 chars, Display Name: 100 chars
- Applied to login, signup, forgot-password, reset-password screens

**M-11: Deep Link Scheme Validation**
- Created `deep-link-validator.ts` utility
- Whitelist approach for allowed paths
- Parameter sanitization
- Integrated in root layout

---

#### ✅ Phase 3: UX Improvements (P2)

**UX-1: Balance Check at Step 1**
- Added `BalanceWarningBanner` component to booking flow
- Shows warning at service selection if balance is low
- Direct "Fund Wallet" action button

**UX-2: Mobile Empty State Component**
- Created `EmptyState` component with 14 presets
- Created 9 SVG illustrations (calendar, search, wallet, scissors, inbox, reviews, message, property, completed)
- Matches web empty state patterns for consistency

**UX-3: Add Property Route**
- Created `/property-owner/add-property` page
- Multi-step form: Details → Location → Settings
- Category selection, approval mode, coordinate entry

**UX-4: Mobile Skeleton Components**
- Created `Skeleton` base component with shimmer animation
- Created specialized skeletons: SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonListItem, SkeletonButton
- Created presets: StylistCardSkeleton, BookingCardSkeleton, TransactionSkeleton

---

#### ✅ Phase 4: Security & E2E Tests

**API Security Tests (Unit/Integration)**
- `services/api/src/middleware/__tests__/auth.test.ts` - Cookie auth, Bearer fallback, token expiry
- `services/api/src/middleware/__tests__/csrf.test.ts` - Token generation, validation, cross-origin blocking
- `services/api/src/middleware/__tests__/rate-limiter.test.ts` - Fail-closed mode, REQUIRE_REDIS
- `services/api/src/routes/__tests__/auth.integration.test.ts` - Login/refresh/logout cycle

**E2E Tests (Playwright)**
- `apps/web/e2e/auth-v7.spec.ts` - Cookie auth flow, auto-refresh, CSRF validation
- `apps/web/e2e/property-creation.spec.ts` - Multi-step property creation

---

#### ✅ Phase 6: Complete Admin Panel

**Core Infrastructure**
- `apps/admin/src/lib/admin-client.ts` - Base API client with httpOnly cookie auth + CSRF
- `apps/admin/src/hooks/use-admin-auth.ts` - Admin auth hook with role verification
- `apps/admin/src/providers/query-provider.tsx` - React Query setup
- `apps/admin/src/providers/auth-provider.tsx` - Admin auth context
- `apps/admin/src/app/login/page.tsx` - Admin login page
- `apps/admin/src/components/layout/admin-layout.tsx` - Main layout with sidebar
- `apps/admin/src/components/layout/admin-sidebar.tsx` - Navigation (8 items)
- `apps/admin/src/components/layout/admin-header.tsx` - Top header with user menu

**Reusable UI Components**
- `apps/admin/src/components/ui/data-table.tsx` - Generic sortable table
- `apps/admin/src/components/ui/pagination.tsx` - Pagination controls
- `apps/admin/src/components/ui/filter-bar.tsx` - Search + dropdown filters
- `apps/admin/src/components/ui/stat-card.tsx` - Metric cards with icons
- `apps/admin/src/components/ui/status-badge.tsx` - Status indicators
- `apps/admin/src/components/ui/confirm-dialog.tsx` - Confirmation modal

**Admin Pages (8 total)**
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

**API Client Files**
- `apps/admin/src/lib/users-client.ts` - Users CRUD operations
- `apps/admin/src/lib/bookings-client.ts` - Bookings management
- `apps/admin/src/lib/disputes-client.ts` - Dispute workflow (8 resolution types)
- `apps/admin/src/lib/sessions-client.ts` - Active session monitoring
- `apps/admin/src/lib/logs-client.ts` - Audit log queries
- `apps/admin/src/lib/defi-client.ts` - DeFi configuration
- `apps/admin/src/lib/paymaster-client.ts` - Paymaster monitoring

**React Query Hooks**
- `apps/admin/src/hooks/use-users.ts` - User management hooks
- `apps/admin/src/hooks/use-bookings.ts` - Booking management hooks
- `apps/admin/src/hooks/use-disputes.ts` - Dispute workflow hooks
- `apps/admin/src/hooks/use-active-sessions.ts` - Real-time session hooks (30s polling)
- `apps/admin/src/hooks/use-logs.ts` - Audit log hooks
- `apps/admin/src/hooks/use-defi.ts` - DeFi config hooks
- `apps/admin/src/hooks/use-paymaster.ts` - Paymaster monitoring hooks

---

#### Files Created (Phase 1-3)

- `services/api/src/lib/cookie-config.ts`
- `services/api/src/middleware/csrf.ts`
- `apps/mobile/src/utils/address-validation.ts`
- `apps/mobile/src/utils/input-validation.ts`
- `apps/mobile/src/utils/deep-link-validator.ts`
- `apps/mobile/src/components/ui/EmptyState.tsx`
- `apps/mobile/src/components/ui/Skeleton.tsx`
- `apps/mobile/src/components/ui/illustrations.tsx`
- `apps/mobile/src/components/ui/index.ts`
- `apps/web/app/property-owner/add-property/page.tsx`

#### Files Modified (Phase 1-3)

- `services/api/src/middleware/auth.ts` - Cookie reading, token pair generation
- `services/api/src/middleware/rate-limiter.ts` - Fail-closed mode
- `services/api/src/routes/auth.ts` - Cookie auth, refresh, SIWE fix, validation
- `services/api/src/index.ts` - Cookie-parser middleware
- `apps/web/lib/auth-client.ts` - CSRF, credentials, no localStorage
- `apps/mobile/app/(auth)/login.tsx` - Input limits
- `apps/mobile/app/(auth)/signup.tsx` - Input limits
- `apps/mobile/app/(auth)/forgot-password.tsx` - Input limits
- `apps/mobile/app/(auth)/reset-password.tsx` - Token validation, input limits
- `apps/mobile/app/_layout.tsx` - Deep link validation
- `apps/mobile/src/components/wallet/QRScanner.tsx` - Address validation
- `apps/mobile/app/stylists/[id]/book.tsx` - Balance warning banner

---

## [6.9.0] - 2025-12-20

### V6.9.0: Calendar Intelligence & Hair Discovery - COMPLETE ✅

**Goal**: Implement personalized ritual plans based on hair profiles with smart calendar scheduling and load balancing.

---

#### ✅ Backend: Ritual Generator & Calendar Scheduler

**New File:** `services/api/src/lib/hair-health/ritual-generator.ts` (~450 lines)

Ritual plan generation with archetype matching:
- `generateRitualPlan()` - Creates personalized ritual recommendations
- 8 hair archetypes with tailored ritual templates
- Weekly schedule builder with load balancing
- Frequency calculations based on profile attributes
- Priority system: ESSENTIAL, RECOMMENDED, OPTIONAL

**New File:** `services/api/src/lib/hair-health/calendar-scheduler.ts` (~350 lines)

Calendar event scheduling:
- `generateCalendarEvents()` - Creates HairCalendarEvent records
- Load factor scoring (LIGHT=15, STANDARD=35, HEAVY=60)
- Weekly load capacity calculations
- Conflict detection and resolution
- Event lifecycle: PLANNED → COMPLETED/SKIPPED/RESCHEDULED

**Ritual Templates:**
- DEEP_CONDITION - Weekly deep conditioning treatment
- WASH_DAY - Complete wash day ritual
- PROTECTIVE_STYLE_INSTALL - Protective styling setup
- SCALP_TREATMENT - Scalp care routine
- PROTEIN_TREATMENT - Protein-moisture balance
- CLARIFYING_WASH - Product buildup removal
- TRIM_MAINTENANCE - Regular trim schedule
- DETANGLE_SESSION - Gentle detangling routine

---

#### ✅ Web Frontend: Calendar Widget

**New File:** `apps/web/components/hair-health/calendar-widget.tsx` (~400 lines)

Smart calendar widget with:
- Calendar summary (next ritual, streak, overdue count)
- Weekly load progress bar with capacity
- Upcoming rituals list (next 14 days)
- GenerateCalendarDialog for event creation
- CompleteRitualDialog with quality ratings
- Skip functionality with optional reason
- Empty state for new users

**New File:** `apps/web/components/hair-health/index.ts`

Barrel export for hair health components.

**Modified File:** `apps/web/app/(main)/profile/hair-health/page.tsx`

- Integrated CalendarWidget after Hair Snapshot section
- Updated version comment to V6.9

---

#### ✅ React Query Hooks (Web)

**Modified File:** `apps/web/hooks/use-hair-health.ts` (~200 lines added)

New V6.9 Calendar Intelligence hooks:
- `useRitualPlan()` - Fetch personalized ritual plan
- `useUpcomingRituals(days)` - Get upcoming rituals
- `useCalendarSummary()` - Widget summary data
- `useGenerateCalendar()` - Generate events mutation
- `useCompleteCalendarEvent()` - Mark event completed
- `useSkipCalendarEvent()` - Skip event mutation
- `useRescheduleCalendarEvent()` - Reschedule mutation
- `useHasCalendarEvents()` - Check if events exist
- `useNextWashDay()` - Get next wash day date
- `useWeeklyLoadStatus()` - Weekly load percentage

Query key additions:
- `ritualPlan`, `ritualTemplates`, `upcomingRituals`, `calendarSummary`

---

#### ✅ Mobile API Integration

**Modified File:** `apps/mobile/src/api/hair-health.ts` (~200 lines added)

V6.9 Calendar Intelligence types:
- `RitualStep`, `RitualRecommendation`, `WeeklyRitualSlot`
- `UpcomingRitual`, `CalendarSummaryResponse`, `CalendarGenerateResult`

V6.9 API functions:
- `getRitualPlan()` - Fetch personalized ritual plan
- `getRitualTemplates()` - Get all available templates
- `generateCalendar(options)` - Generate calendar events
- `getUpcomingRituals(days)` - Get upcoming rituals
- `getCalendarSummary()` - Widget summary data
- `completeCalendarEvent(eventId, quality)` - Mark completed
- `skipCalendarEvent(eventId, reason)` - Skip with reason
- `rescheduleCalendarEvent(eventId, newDate)` - Reschedule

Utility function:
- `formatRitualDate()` - Format dates for display (Today, Tomorrow, weekday)

---

#### ✅ Mobile Zustand Store

**Modified File:** `apps/mobile/src/stores/hair-health.ts` (~150 lines added)

V6.9 Calendar state:
- `calendarSummary` - Widget summary state
- `upcomingRituals` - Upcoming rituals array
- `calendarLoading` - Loading state
- `calendarError` - Error state
- `hasCalendarEvents` - Boolean for empty state

V6.9 Calendar actions:
- `fetchCalendarSummary()` - Fetch summary
- `fetchUpcomingRituals(days)` - Fetch rituals
- `generateCalendarEvents(weeks)` - Generate events
- `completeRitual(eventId, quality)` - Complete event
- `skipRitual(eventId, reason)` - Skip event

V6.9 Calendar selectors:
- `selectCalendarSummary`, `selectUpcomingRituals`
- `selectCalendarLoading`, `selectHasCalendarEvents`
- `selectNextRitual`, `selectOverdueCount`, `selectStreakDays`

---

#### Files Summary (V6.9.0)

| Category | Files | Description |
|----------|-------|-------------|
| Backend | 2 | Ritual generator, calendar scheduler |
| Web Components | 2 | Calendar widget, index barrel |
| Web Hooks | 1 | V6.9 calendar hooks |
| Web Pages | 1 | Hair health page integration |
| Mobile API | 1 | Calendar API functions |
| Mobile Store | 1 | Calendar state management |

**Total:** ~1,200 lines of new code

---

## [6.8.0] - 2025-12-20

### V6.8.0: Mobile Foundation & Full Parity - COMPLETE ✅

**Goal**: Complete mobile app functionality with real API integration across all 5 tabs, achieving feature parity with web.

---

#### ✅ Sprint 1: Auth & Profile Foundation

**New Files:**
- `apps/mobile/src/api/auth.ts` - Auth API client (login, signup, logout, refresh)
- `apps/mobile/src/stores/auth.ts` - Zustand auth store with SecureStore
- `apps/mobile/app/(auth)/_layout.tsx` - Auth stack navigator
- `apps/mobile/app/(auth)/login.tsx` - Login screen with validation
- `apps/mobile/app/(auth)/signup.tsx` - Signup screen with terms

---

#### ✅ Sprint 2: Wallet Integration

**New Files:**
- `apps/mobile/src/api/wallet.ts` - Wallet API client
- `apps/mobile/src/stores/wallet.ts` - Zustand wallet store
- `apps/mobile/app/wallet/_layout.tsx` - Wallet stack navigator
- `apps/mobile/app/wallet/fund.tsx` - Fund via Kotani Pay onramp
- `apps/mobile/app/wallet/withdraw.tsx` - Withdraw via Kotani Pay offramp
- `apps/mobile/app/wallet/send.tsx` - P2P send with address lookup
- `apps/mobile/app/wallet/receive.tsx` - QR code display

**Features:**
- Real balance display (fiat-first ZAR)
- Transaction history with pull-to-refresh
- Biometric auth for transactions

---

#### ✅ Sprint 3: Uber-like Home Tab

**New Files:**
- `apps/mobile/src/api/stylists.ts` - Stylists API client
- `apps/mobile/src/stores/stylists.ts` - Zustand stylists store

**Modified:**
- `apps/mobile/app/(tabs)/index.tsx` - Full rewrite with map + booking sheet

**Features:**
- Full-screen map with react-native-maps
- Color-coded stylist pins (green=fixed, amber=mobile, red=home-call)
- Bottom sheet booking overlay (Uber-style, never leaves map)
- Quick filters (Today, This week, Budget, Wash included)

---

#### ✅ Sprint 4: Stylist Discovery & Search

**New Files:**
- `apps/mobile/app/stylists/_layout.tsx` - Stylists stack navigator
- `apps/mobile/app/stylists/[id]/index.tsx` - Stylist detail screen
- `apps/mobile/app/stylists/[id]/book.tsx` - 4-step booking flow

**Modified:**
- `apps/mobile/app/(tabs)/search.tsx` - Complete rewrite with real API

**Features:**
- Debounced search with real API
- Category filters (Hair Care, Styling, Coloring, etc.)
- Sort options (distance, rating, price)
- Infinite scroll pagination
- Stylist detail with services and portfolio tabs
- 4-step booking: Service → DateTime → Location → Confirm

---

#### ✅ Sprint 5: Notifications + Hair Health

**New Files:**
- `apps/mobile/src/api/notifications.ts` - Notifications API client
- `apps/mobile/src/stores/notifications.ts` - Zustand notifications store
- `apps/mobile/src/api/hair-health.ts` - Hair health API client
- `apps/mobile/src/stores/hair-health.ts` - Zustand hair health store
- `apps/mobile/app/hair-health/_layout.tsx` - Hair health stack navigator
- `apps/mobile/app/hair-health/index.tsx` - Hair health dashboard
- `apps/mobile/app/hair-health/onboarding.tsx` - 6-step onboarding wizard
- `apps/mobile/app/hair-health/edit.tsx` - Profile editor

**Modified:**
- `apps/mobile/app/(tabs)/notifications.tsx` - Complete rewrite with real API

**Features:**
- Notifications with category filtering (All, Bookings, Payments, Messages)
- Mark as read (single and all) with optimistic updates
- Unread badge display
- Hair health dashboard with profile summary card
- Learning journey progress (6 modules)
- 6-step onboarding: Pattern, Porosity, Density, Thickness, Shrinkage, Confirmation
- Profile edit with all attributes

---

#### Mobile Parity Summary

| Tab | Before V6.8 | After V6.8 |
|-----|-------------|------------|
| Home | Map placeholder | ✅ Full-screen map with booking sheet |
| Search | Static chips | ✅ Real API, filters, infinite scroll |
| Wallet | $0.00 hardcoded | ✅ Real balance, Fund/Withdraw, P2P |
| Notifications | Empty state | ✅ Real notifications, filtering |
| Profile | Mock data | ✅ Real user, Hair Health card |
| Messages | ✅ V6.7.1 | ✅ Complete (from V6.7.1) |

---

## [6.7.1] - 2025-12-20

### V6.7.1: Mobile Messaging API Integration - COMPLETE ✅

**Goal**: Connect mobile messaging screens to backend API with proper state management.

---

#### ✅ Mobile API Infrastructure

**New File:** `apps/mobile/src/api/client.ts` (~130 lines)

Base API client with SecureStore token management:
- `getAuthToken()` / `setAuthToken()` - Token persistence
- `getRefreshToken()` / `setRefreshToken()` - Refresh token storage
- `clearTokens()` - Logout cleanup
- `apiRequest<T>()` - Generic request helper with auth
- `APIError` class for structured error handling

**New File:** `apps/mobile/src/api/messages.ts` (~170 lines)

Messages API client matching web implementation:
- `getConversations()` - List user's conversations
- `startConversation()` - Start/get conversation
- `getConversation()` - Get with messages
- `sendMessage()` - Send message
- `markConversationRead()` - Mark as read
- `archiveConversation()` / `unarchiveConversation()`
- `getUnreadCount()` - Total unread

#### ✅ Zustand State Management

**New File:** `apps/mobile/src/stores/messages.ts` (~220 lines)

Messages store with:
- Conversation list state with pagination
- Active conversation and messages
- Optimistic updates for sending
- Mark as read on conversation open
- Unread count tracking
- Error handling per operation

#### ✅ Updated Mobile Screens

**Modified File:** `apps/mobile/app/messages/index.tsx`

Conversations list connected to Zustand:
- `useFocusEffect` for refresh on screen focus
- Pull-to-refresh with store action
- Loading/error/empty states
- Real unread badge counts

**Modified File:** `apps/mobile/app/messages/[id].tsx`

Conversation thread connected to Zustand:
- Fetch conversation on mount
- Auto mark as read
- Send with optimistic update
- Loading spinner during send
- Error display for failed sends

---

## [6.7.0] - 2025-12-20

### V6.7.0: Direct Messaging Feature - COMPLETE ✅

**Goal**: Enable in-app communication between customers and stylists without sharing personal contact information.

**Design Decision**: Messaging is a supporting feature, not a primary navigation element. Users access it through contextual entry points (stylist profiles, booking pages).

---

#### ✅ Database Models

**Modified File:** `services/api/prisma/schema.prisma`

New models:
- `Conversation` - Per-participant unread counts, archive timestamps, booking link
- `Message` - Content, senderId, readAt, soft delete support
- `MESSAGE_RECEIVED` added to NotificationType enum

Indexes:
- `(participant1Id, lastMessageAt)` for list queries
- `(conversationId, createdAt)` for message pagination

#### ✅ Conversations API

**New File:** `services/api/src/routes/conversations.ts` (~550 lines)

Full REST API with Zod validation:
- `GET /conversations` - List with pagination, archive filter
- `POST /conversations` - Start or get existing conversation
- `GET /conversations/:id` - Get with messages (paginated)
- `POST /conversations/:id/messages` - Send message
- `POST /conversations/:id/read` - Mark all as read
- `POST /conversations/:id/archive` - Archive
- `DELETE /conversations/:id/archive` - Unarchive
- `GET /conversations/unread-count` - Total unread

Helper functions:
- `getOrCreateConversation()` - Handles participant ordering
- `getParticipantPosition()` - Returns 1 or 2 for current user
- `getOtherParticipantId()` - Gets conversation partner

#### ✅ Notification Integration

**Modified Files:**
- `services/api/src/lib/notifications/types.ts` - Added MESSAGE_RECEIVED type
- `services/api/src/lib/notifications/templates.ts` - In-app and SMS templates

Notification metadata:
- `conversationId` - Links to conversation
- `senderName` - For notification text
- `messagePreview` - First 50 chars

#### ✅ Web Frontend

**New File:** `apps/web/lib/messages-client.ts` (~340 lines)

Typed API client with all conversation operations.

**New File:** `apps/web/hooks/use-messages.ts` (~200 lines)

React Query hooks:
- `useConversations()` - List with caching
- `useConversation(id)` - Single conversation
- `useSendMessage(conversationId)` - With optimistic update
- `useMarkAsRead(conversationId)` - Mark read
- `useStartConversation()` - Create/get conversation
- `useUnreadCount()` - Badge count

**New File:** `apps/web/app/(main)/messages/page.tsx`

Messages list with All/Unread tabs:
- Conversation cards with avatar, preview, time
- Booking badge for linked conversations
- Unread indicator styling
- Empty states per tab

**New File:** `apps/web/app/(main)/messages/[id]/page.tsx`

Conversation thread:
- Date separators (Today, Yesterday, full date)
- Message bubbles (own = rose, other = gray)
- Read receipts
- Text input with send button
- Auto-scroll on new messages

#### ✅ Entry Points

**Modified File:** `apps/web/components/stylists/stylist-profile.tsx`

- "Message" button next to Favorite (desktop)
- Message icon button in mobile sticky footer
- Uses `useStartConversation()` hook

**Modified File:** `apps/web/components/bookings/booking-details.tsx`

- "Message Stylist" button in stylist section
- Links conversation to booking via `bookingId`

#### ✅ Mobile Screens (Mock Data)

**New Files:**
- `apps/mobile/app/messages/_layout.tsx` - Stack navigator
- `apps/mobile/app/messages/index.tsx` - Conversations list
- `apps/mobile/app/messages/[id].tsx` - Conversation thread

Initial implementation with mock data, API integration in V6.7.1.

---

## [6.6.0] - 2025-12-19

### V6.6.0: Special Events Booking - COMPLETE ✅

**Goal**: Enable customers to request stylists for weddings, photoshoots, and group events.

---

#### ✅ Mobile Special Events

**New File:** `apps/mobile/app/special-events/index.tsx`

Landing page with:
- Event categories (Wedding, Photoshoot, Corporate, Group, Festival)
- Featured stylists for events
- How It Works section

**New File:** `apps/mobile/app/special-events/request.tsx`

Multi-step request form:
- Step 1: Event details (type, date, guests)
- Step 2: Location selection
- Step 3: Services needed
- Step 4: Review and submit

**Modified:** Home Quick Actions with Special Events entry

#### ✅ Web Special Events

**New File:** `apps/web/app/(main)/special-events/page.tsx`

Landing page matching mobile design.

**New File:** `apps/web/app/(main)/special-events/request/page.tsx`

Multi-step form with same flow as mobile.

**Modified:** Home greeting card with Quick Actions

#### ✅ Reusable Components

- `LocationSelector` - Location type picker (home, salon, venue)
- `ChairSelector` - Chair count selector for group events

#### ✅ E2E Tests

**New File:** `apps/web/e2e/special-events.spec.ts`

Playwright tests for Special Events flow.

---

## [6.5.1] - 2025-12-19

### V6.5.1: Property Owner UI Components - COMPLETE ✅

**Goal**: Create missing property owner UI components for salon/property image uploads, amenity management, and chair configuration.

---

#### ✅ Property Image Management System

**New API Endpoints (Backend):**
- `POST /api/upload/property/:propertyId` - Upload property images (max 10)
- `DELETE /api/upload/property/:propertyId/:publicId` - Delete property image
- `POST /api/upload/property/:propertyId/cover` - Set cover image

**New File:** `services/api/src/routes/upload.ts` (3 new endpoints)

#### ✅ Property API Client

**New File:** `apps/web/lib/property-client.ts` (~350 lines)

Complete typed API client for properties and chairs:
- Types: PropertyCategory, ChairType, ChairStatus, RentalMode, ApprovalMode
- Property CRUD: getMyProperties, getProperty, createProperty, updateProperty, deleteProperty
- Chair CRUD: createChair, updateChair, deleteChair
- Image operations: uploadPropertyImage, deletePropertyImage, setPropertyCoverImage
- Utility functions: getCategoryDisplayName, getChairTypeDisplayName, getApprovalModeDescription

#### ✅ React Query Hooks

**New File:** `apps/web/hooks/use-properties.ts` (~400 lines)

React Query hooks for property management:
- Query hooks: useMyProperties(), useProperty(propertyId)
- Property mutations: useCreateProperty, useUpdateProperty, useDeleteProperty
- Chair mutations: useCreateChair, useUpdateChair, useDeleteChair
- Image mutations: useUploadPropertyImage, useDeletePropertyImage, useSetPropertyCoverImage

#### ✅ Property Owner Components

**New File:** `apps/web/components/property-owner/property-image-upload.tsx` (~350 lines)

Drag-and-drop image upload component with:
- File validation (type & size, max 10MB)
- Cover image selection with star badge
- Image grid with hover actions
- Delete confirmation
- Upload progress indicators
- Helper tips for best practices

**New File:** `apps/web/components/property-owner/amenity-picker.tsx` (~150 lines)

Multi-select amenity grid with 10 predefined chair amenities:
- wash_basin, adjustable_seat, mirror, lighting, plug_points
- premium_tools, air_circulation, privacy_divider, storage, wifi

**New File:** `apps/web/components/property-owner/chair-form-dialog.tsx` (~250 lines)

3-step wizard dialog for creating/editing chairs:
- Step 1: Basic Details (name, type, description)
- Step 2: Amenities (integrated AmenityPicker)
- Step 3: Pricing (hourly rate, daily rate, rental mode)

**New File:** `apps/web/components/property-owner/index.ts`

Component exports for property owner module.

#### ✅ Property Detail Page

**New File:** `apps/web/src/app/property-owner/properties/[id]/page.tsx` (~350 lines)

Full property detail page with:
- Cover image display with gradient overlay
- Property details card with edit mode
- Booking settings (approval mode, min rating)
- Quick stats (chairs, pending rentals)
- Quick actions (manage chairs, view requests)
- PropertyImageUpload integration
- Delete confirmation modal

#### ✅ Admin Properties Page Enhancement

**Updated File:** `apps/web/app/admin/properties/page.tsx`

- Added image preview in property table (shows cover image thumbnail)
- Added photo count indicator
- Mock data updated with sample images
- Uses Next.js Image component for optimization

---

#### Files Summary (V6.5.1)

| Category | Files | Description |
|----------|-------|-------------|
| Backend API | 2 | Upload routes, error handler |
| API Client | 1 | property-client.ts |
| React Query | 1 | use-properties.ts hooks |
| Components | 4 | Image upload, amenity picker, chair form, index |
| Pages | 1 | Property detail page |
| Admin | 1 | Properties page with images |

**Total:** ~1,500 lines of new code

---

## [6.5.0] - 2025-12-18

### V6.5.0: Phosphor Icon Migration - COMPLETE ✅

**Goal**: Migrate all frontend components from Lucide icons to Phosphor icons using the centralized Icon bridge system for consistent botanical iconography.

---

#### ✅ Complete Lucide to Phosphor Migration (50+ Files)

**Icon Bridge System:** `apps/web/components/icons/index.tsx`

All frontend components now use the centralized `Icon` component with semantic icon names instead of importing Lucide icons directly.

**Components Migrated:**
- Notification components (bell, dropdown, item)
- Booking components (receipt, success, dialogs, session tracker)
- Wallet components (tabs, advanced, history, rewards, defi)
- Profile components (avatar-upload, profile-header, role-tabs)
- Dialog components (booking-quick-view, delete-account, location-permission, logout-confirm, profile-edit, share-profile)
- Review components (reputation-badge, review-card, review-dialog, review-list, star-rating)
- Calendar components (day-flow, event-chip, month-garden, rhythm-strip, ritual-sheet)
- Map components (booking-sheet, stylist-map, stylist-pin)
- Admin/paymaster components (alerts-panel, stats-cards, transactions-table)
- Toast and toaster components

**Pages Migrated:**
- Settings pages (5 files): security, layout, page.tsx, advanced, display, privacy
- Help/support pages (8 files): all help center pages including getting-started, faq, wallet
- Auth pages (2 files): login and register flows
- Main app pages (7 files): hair-health, profile, schedule, edit, onboarding, home, bookings
- Admin pages (3 files): finance, defi, bookings management

**Icon Mapping Applied:**

| Lucide Icon | Phosphor Icon | Usage |
|-------------|---------------|-------|
| `Sparkles` | `sparkle` | Features, highlights |
| `Calendar` | `calendar` | Dates, scheduling |
| `Heart` | `favorite` | Favorites, likes |
| `Star` | `star` | Ratings, rewards |
| `Clock` | `clock` | Time, pending |
| `MapPin` | `location` | Location markers |
| `Search` | `search` | Search actions |
| `Plus` | `add` | Add actions |
| `X` | `close` | Close/dismiss |
| `Check` | `check` | Success, confirmation |
| `AlertCircle` | `calmError` | Errors, warnings |
| `ChevronRight/Left` | `chevronRight/Left` | Navigation |
| `Loader2` | `timer` | Loading spinners |
| `Eye` | `visible` | Visibility |
| `Lock` | `locked` | Security, privacy |
| `Trash2` | `delete` | Delete actions |
| `Settings` | `settings` | Configuration |
| `RefreshCw` | `unfold` | Refresh actions |
| `TrendingUp` | `growing` | Growth, increase |
| `DollarSign` | `currency` | Money, payments |

**Size Mapping:**
- `w-3 h-3` / `w-4 h-4` → `size="sm"`
- `w-5 h-5` / `w-6 h-6` → `size="md"`
- `w-8 h-8` → `size="lg"`
- `w-10 h-10` → `size="xl"`
- `w-12 h-12` → `size="2xl"`

**Component Pattern Updates:**
- Helper components accepting icon props updated from `icon: React.ComponentType` to `icon: IconName`
- Render logic changed from `<LucideIcon className="..." />` to `<Icon name={iconName} size="..." />`

**Verification:**
- Zero Lucide imports remain in `apps/web` directory
- Both double-quoted and single-quoted import patterns checked
- All icons now use centralized Icon component

---

## [6.4.0] - 2025-12-18

### V6.4.0: Local Development, Brand & Map UX

**Goal**: Fix local development issues, enable Redis rate limiting, create admin panel scaffold, implement custom map styling, and integrate brand logos.

---

#### ✅ Google Maps Integration (NEW)

**Updated File:** `apps/web/components/map/stylist-map.tsx`

Complete rewrite with real Google Maps:
- Custom Vlossom dark/light map themes inspired by Uber
- Theme toggle (sun/moon icons) with localStorage persistence
- `@react-google-maps/api` integration with MarkerF, InfoWindowF
- Brand purple (#311E6B) integrated into map styling
- Layer toggle for stylists/salons visibility

#### ✅ Brand Logo Components (NEW)

**New File:** `apps/web/components/ui/vlossom-logo.tsx`

Brand logo component library:
- `VlossomIcon` - Flower symbol SVG
- `VlossomWordmark` - Text logo SVG with height-based sizing
- `VlossomLogo` - Combined icon + wordmark
- Variants: purple, cream, auto (auto adapts to light/dark mode)

**Updated Files:**
- `apps/web/components/layout/desktop-nav.tsx` - Brand logo in header
- `apps/web/app/(auth)/login/page.tsx` - Logo on login page
- `apps/web/app/(auth)/onboarding/page.tsx` - Logo on signup page

#### ✅ Production Deployment (NEW)

- Deployed to Vercel: https://vlossom-protocol.vercel.app
- Build configuration verified and working
- Environment variables configured

#### ✅ Context Sync (NEW)

Updated version headers in folder-level CLAUDE.md files:
- `services/indexer/CLAUDE.md` → V6.4.0
- `packages/sdk/CLAUDE.md` → V6.4.0
- `packages/types/CLAUDE.md` → V6.4.0
- `packages/ui/CLAUDE.md` → V6.4.0
- `packages/config/CLAUDE.md` → V6.4.0
- `infra/CLAUDE.md` → V6.4.0
- `design/CLAUDE.md` → V6.4.0

#### ✅ Redis Cloud Integration

**Updated File:** `services/api/.env`

- Connected to Redis Cloud (free tier) for distributed rate limiting
- Added `ioredis` dependency to `services/api`
- Rate limiter now uses Redis storage instead of in-memory Map
- Enables horizontal scaling of API instances

#### ✅ Scheduler Endpoint Routing Fix

**Updated File:** `services/scheduler/src/index.ts`

Fixed internal API endpoint routing:
- Changed `/api/internal/reputation/recalculate` → `/api/v1/internal/reputation/recalculate`
- Changed `/api/internal/bookings/:id/release-escrow` → `/api/v1/internal/bookings/:id/release-escrow`
- Scheduler now successfully calls API internal endpoints

**New File:** `services/scheduler/.env`
- Created environment configuration for local development

#### ✅ Admin Panel Scaffold

**New Files:**
- `apps/admin/src/app/layout.tsx` - Root layout with metadata
- `apps/admin/src/app/page.tsx` - Dashboard placeholder with navigation cards
- `apps/admin/src/app/globals.css` - Base styles

Features:
- Next.js 14 app router structure
- Placeholder dashboard with Users, Bookings, Disputes, DeFi Config cards
- Admin panel now starts without errors at http://localhost:3001

**Removed:** `apps/admin/src/.gitkeep` (no longer needed)

---

## [6.3.0] - 2025-12-17

### V6.3.0: Phase 2 UX & Infrastructure - COMPLETE ✅

**Goal**: Complete Phase 2 code quality and UX improvements. Add production infrastructure for logging, rate limiting, and secrets management.

---

#### ✅ Frontend Logger (MAJOR-1)

**New File:** `apps/web/lib/logger.ts`

Structured logging utility that:
- Strips debug/info logs in production builds
- Sends errors and warnings to Sentry
- Includes correlation context (user, session)
- Type-safe log levels (debug, info, warn, error)

#### ✅ ESLint no-console Rule

**New File:** `apps/web/.eslintrc.json`

- Added `"no-console": ["error", { "allow": ["warn", "error"] }]`
- Logger file exempted via override
- Prevents accidental console statements in production

#### ✅ React Query Configs (MAJOR-4)

**New File:** `apps/web/lib/query-config.ts`

Standardized query configurations:
- Smart retry logic (don't retry 401s, retry network errors more)
- Auth-aware error handling
- Stale time presets (static, standard, dynamic, realtime)
- Pre-configured options for common patterns (wallet, critical, etc.)

#### ✅ Theme System (Design P0)

**New Files:**
- `apps/web/components/ui/theme-toggle.tsx` - Toggle and selector components
- Uses existing `apps/web/lib/theme/` infrastructure

Features:
- Light/dark mode toggle with animated icons
- System preference detection
- Preference persistence to localStorage
- ThemeSelector dropdown with Light/Dark/System options

#### ✅ Desktop Navigation (Design P0)

**New File:** `apps/web/components/layout/desktop-nav.tsx`

Features:
- Horizontal header navigation for md+ screens
- Integrated with VlossomIcon botanical icons
- Role-based navigation items
- Theme selector integration
- Spacer component for fixed header offset

#### ✅ Empty State Presets (UX P0)

**Updated File:** `apps/web/components/ui/empty-state.tsx`

Added 14 preset empty states:
- noStylists, noServices, noAvailability
- noBookings, noHistory, noTransactions
- noNotifications, noReviews, noMessages
- noSearchResults, noFavorites, networkError

Each preset includes illustration, title, and description.

#### ✅ Booking Error Handling (UX P0)

**Updated File:** `apps/web/components/booking/booking-dialog.tsx`

Features:
- `getBookingErrorMessage()` parser for specific error types
- Network errors: "Check your internet connection"
- Auth errors: "Please sign in again"
- Slot unavailable: "This time was just booked"
- Insufficient balance: "Add funds to your wallet"
- Inline error state with retry support
- Automatic redirect to datetime step on slot conflicts

#### ✅ Redis Rate Limiting (C-2)

**New File:** `services/api/src/lib/redis-client.ts`

Production-ready rate limiting infrastructure:
- Automatic connection with retry logic
- Graceful fallback to in-memory for development
- Helper functions: `rateLimitIncrement`, `rateLimitIsBlocked`, `rateLimitBlock`
- Connection pooling and exponential backoff
- Dynamic import (works without ioredis installed)

#### ✅ Secrets Manager (C-3)

**New File:** `services/api/src/lib/secrets-manager.ts`

Secure credential storage:
- AWS Secrets Manager integration for production
- Environment variable fallback for development
- Secret caching with 5-minute TTL
- `getRelayerPrivateKey()` for critical key retrieval
- JSON parsing support for complex secrets

---

#### Files Changed Summary

| Category | Files | Description |
|----------|-------|-------------|
| Frontend Logger | 2 | Logger utility + ESLint config |
| React Query | 1 | Standardized query configurations |
| Theme System | 1 | Theme toggle component |
| Navigation | 1 | Desktop header navigation |
| Empty States | 1 | 14 preset empty state patterns |
| Booking | 1 | Error handling improvements |
| Infrastructure | 2 | Redis client + Secrets manager |
| Documentation | 2 | README + changelog updates |
| Config | 2 | .env.example files |

---

## [6.2.0] - 2025-12-17

### V6.2.0: Security, Quality & Smart Contract Hardening - COMPLETE ✅

**Goal**: Address high-priority findings from comprehensive 7-review audit. Fix TypeScript type safety issues, add API documentation, and resolve critical smart contract vulnerabilities.

---

#### ✅ TypeScript Any Elimination (MAJOR-2)

Eliminated all production `any` types for type safety:

**Files Modified:**
- `services/api/src/lib/notifications/notification-service.ts`
  - Added `Prisma.InputJsonValue` for metadata typing
  - Created `NotificationItem` interface
  - Typed `where` clause with `Prisma.NotificationWhereInput`
- `services/api/src/middleware/rate-limiter.ts`
  - Created `RequestWithAuth` interface for authenticated requests
- `services/api/src/middleware/error-handler.ts`
  - Created `RequestWithTracking` interface for request correlation
  - Updated `createError` to accept `Record<string, unknown> | string`
- `services/api/src/routes/stylists.ts`
  - Created `WeeklySchedule` interface for availability typing
- `services/api/src/routes/bookings.ts`
  - Fixed `BookingStatus[]` type casting

---

#### ✅ OpenAPI/Swagger Documentation (API Docs)

Full API documentation now available at `/api/docs`:

**New Files:**
- `services/api/src/lib/swagger.ts` - Complete OpenAPI 3.0.3 configuration

**Features:**
- Interactive Swagger UI at `/api/docs`
- OpenAPI JSON spec at `/api/docs/openapi.json`
- Schemas for: User, Booking, Stylist, Service, Wallet, Review, Notification, Property
- Security scheme: JWT Bearer authentication
- Rate limiting documentation
- Standard error response format

**Dependencies Added:**
- `swagger-jsdoc@^6.2.8`
- `swagger-ui-express@^5.0.1`

---

#### ✅ Smart Contract Security Fixes

##### H-2: Guardian Recovery State Fix (VlossomAccount.sol)

**Problem**: Stale approval mappings persisted after recovery cancellation, allowing old approvals to carry over to new recovery attempts.

**Solution**: Implemented nonce-based recovery approval system.

**Changes:**
```solidity
// Added nonce to RecoveryRequest struct
struct RecoveryRequest {
    address newOwner;
    uint256 initiatedAt;
    uint256 approvalCount;
    bool isActive;
    uint256 nonce;  // H-2 fix
}

// Changed approval mapping to include nonce
mapping(address => mapping(uint256 => bool)) private _recoveryApprovals;

// New getter for recovery nonce
function getRecoveryNonce() external view returns (uint256);
```

##### H-1: Paymaster Selector Validation (VlossomPaymaster.sol)

**Problem**: Assembly extraction of inner selector lacked bounds checking, potentially reading garbage data.

**Solution**: Added comprehensive bounds validation before extracting selector.

**Changes:**
```solidity
assembly {
    // Validate funcOffset + 32 doesn't exceed calldata length
    if lt(add(funcLengthPosition, 32), add(callDataLen, 1)) {
        // Validate funcLength >= 4 bytes for selector
        if iszero(lt(funcLength, 4)) {
            // Validate selectorPosition + 4 doesn't exceed calldata
            if lt(add(selectorPosition, 4), add(callDataLen, 1)) {
                // Safe to extract
                validExtraction := 1
            }
        }
    }
}
```

##### M-4: YieldEngine Utilization Fix (VlossomYieldEngine.sol)

**Problem**: Hardcoded 50% utilization placeholder instead of querying actual pool utilization.

**Solution**: Added oracle-based utilization tracking.

**Changes:**
```solidity
// New storage
mapping(address => uint256) public poolUtilization;
uint256 public defaultUtilization;

// New functions
function updatePoolUtilization(address pool, uint256 utilization) external;
function setDefaultUtilization(uint256 utilization) external;
function getPoolUtilization(address pool) public view returns (uint256);

// Event added to interface
event PoolUtilizationUpdated(address indexed pool, uint256 utilization);
```

---

#### ✅ Smart Contract Test Coverage

**New Test File:** `contracts/test/VlossomAccount.test.ts`

**17 Tests Added:**
- Guardian Management (3 tests)
  - Adding guardians
  - Max guardian limit enforcement
  - Removing guardians
- Recovery Initiation (4 tests)
  - Guardian initiates recovery
  - Non-guardian rejection
  - Zero address rejection
  - Current owner rejection
- Recovery Approval (2 tests)
  - Guardian approval tracking
  - Double approval prevention
- Recovery Execution (3 tests)
  - Post-delay execution
  - Pre-delay rejection
  - Insufficient approvals rejection
- Recovery Cancellation (2 tests)
  - Owner cancellation
  - Non-owner rejection
- H-2 Nonce Tests (3 tests)
  - Old approvals invalidated after cancellation
  - New nonce per recovery attempt
  - Correct per-nonce tracking

**Test Stats:** All 123 contract tests passing

---

#### Files Changed Summary

| Category | Files | Description |
|----------|-------|-------------|
| TypeScript Types | 5 | `any` elimination in API |
| API Documentation | 2 | Swagger setup + index.ts |
| Smart Contracts | 3 | VlossomAccount, VlossomPaymaster, VlossomYieldEngine |
| Contract Interfaces | 1 | IYieldEngine event |
| Contract Tests | 1 | VlossomAccount.test.ts |
| Documentation | 3 | README, docs/README, changelog |

---

## [6.1.0] - 2025-12-17

### V6.1.0: Orange Color Governance Enforcement - COMPLETE ✅

**Goal**: Enforce the sacred orange governance rule across the entire frontend codebase. Orange (#FF510D) is reserved exclusively for growth and celebration moments (<8% surface area), never for errors, warnings, or alerts.

**Commit**: d283261

**Major Achievement**: Complete adherence to Doc 16 color governance rules by systematically replacing accent-orange with status-error in error contexts and status-warning for validation/caution states.

---

#### ✅ Color Governance Implementation

##### Changed Files (12 total)

**Error State Corrections (9 files)**
- `apps/web/components/error-boundary.tsx` - Error boundary uses `status-error` (red), not orange
- `apps/web/app/error.tsx` - Global error page uses `status-error` (red), not orange
- `apps/web/app/(main)/bookings/page.tsx` - Empty state error messaging uses `status-error`
- `apps/web/app/(main)/bookings/[id]/page.tsx` - Booking error states use `status-error`
- `apps/web/app/(main)/stylists/page.tsx` - Stylist discovery errors use `status-error`
- `apps/web/app/(main)/stylists/[id]/page.tsx` - Profile error states use `status-error`
- `apps/web/components/bookings/booking-details.tsx` - Cancellation warnings use `status-error`
- `apps/web/components/booking/payment-step.tsx` - Payment validation errors use `status-error`

**Warning State Corrections (3 files)**
- `apps/web/components/bookings/cancel-dialog.tsx` - Refund policy warnings use `status-warning` (amber)
- `apps/web/components/booking/location-selector.tsx` - Availability warnings use `status-warning` (amber)
- `apps/web/components/stylists/stylist-filters.tsx` - "Clear filters" action reverted to `brand-rose` link color

**Design Token Updates (1 file)**
- `apps/web/tailwind.config.js` - Updated `status.warning` from orange (#FF510D) to amber (#F59E0B)
  - Added sacred orange governance comments to prevent future misuse
  - Documented that orange is for growth/celebration only (<8% surface)

##### Code Comment Documentation

Added sacred orange governance rules as code comments in `tailwind.config.js`:

```javascript
// Accent: Orange - SACRED, reserved for growth & celebration ONLY
// DO NOT use for errors, warnings, or alerts. Use status-error/status-warning instead.
// Surface area < 8%. Examples: growth milestones, achievements, positive celebrations

// Status colors
// IMPORTANT: Orange (#FF510D) is SACRED - reserved for growth/celebration only
// Use amber for warnings, muted red for errors
```

##### Color Token Changes

| Token | Before | After | Rationale |
|-------|--------|-------|-----------|
| `status.warning` | `#FF510D` (orange) | `#F59E0B` (amber) | Orange is sacred for celebration, amber is appropriate for warnings |
| `accent` usage | Error/warning contexts | Growth/celebration only | Strict enforcement of Doc 16 governance |

##### Correct Orange Usage Examples

Orange (#FF510D) remains correctly used in:
- `VlossomIcon` components with `accent` prop for growth moments
- Achievement celebrations
- Milestone completions
- Ritual completion confirmations
- The flower's center in active states

#### Design System Compliance

**Before V6.1.0:**
- 9 files incorrectly used orange for errors
- 3 files used orange for warnings
- `status.warning` token mapped to orange
- Color governance rules not enforced in code

**After V6.1.0:**
- 100% compliance with sacred orange rule
- Clear separation: Red for errors, Amber for warnings, Orange for celebration
- Code comments prevent future violations
- Design system integrity restored

---

## [6.0.0] - 2025-12-17

### V6.0.0: Mobile App + Full Frontend Design Handover - COMPLETE ✅

**Goal**: Complete the design system handover with botanical iconography, animation system, typography/color audits, and establish React Native mobile app foundation.

**Major Milestone**: This is the most significant design milestone to date, marking the full transition from generic icon libraries to a custom botanical design system.

---

#### ✅ Phase A: Design System Completion

##### A.1: Botanical Icon Library (28 SVGs)

Custom iconography system derived from Vlossom flower linework. All icons use Primary Purple (#311E6B) and organic botanical forms.

**Icon Categories Created**
- `design/brand/icons/nav/` - 6 navigation icons
  - `home.svg` - Centered flower core (belonging)
  - `search.svg` - Radiating petals with stem (discovery)
  - `calendar.svg` - Cyclical petal ring (time/rhythm)
  - `wallet.svg` - Closed bud (value containment)
  - `profile.svg` - Single flower with stem (identity)
  - `notifications.svg` - Budding flower (awareness)

- `design/brand/icons/state/` - 5 state icons
  - `healthy.svg` - Full open bloom (balanced)
  - `growing.svg` - Partially opening petals (improvement)
  - `resting.svg` - Closed/folded petals (recovery)
  - `needs-care.svg` - Asymmetric petals (attention needed)
  - `transition.svg` - Mid-unfold motion (phase change)

- `design/brand/icons/care/` - 4 care action icons
  - `ritual.svg` - Intentional care symbol
  - `wash-day.svg` - Cleansing routine symbol
  - `protective-style.svg` - Protective care symbol
  - `treatment.svg` - Focused treatment symbol

- `design/brand/icons/growth/` - 5 growth stage icons
  - `stage-1.svg` - Single petal emerging
  - `stage-2.svg` - Two opposite petals
  - `stage-3.svg` - Four petals (cardinal directions)
  - `stage-4.svg` - Full five-petal bloom
  - `meter.svg` - Radial petal segments (progress)

- `design/brand/icons/community/` - 8 community icons
  - `community.svg` - Community presence
  - `support.svg` - Platform support
  - `learning.svg` - Knowledge/education
  - `verified.svg` - Trust/authenticity
  - `favorite.svg` - Affection/love
  - `settings.svg` - Configuration
  - `add.svg` - Create/new
  - `close.svg` - Dismiss/close

**React Implementation**
- `apps/web/components/ui/vlossom-icons.tsx` - 600+ lines of React icon components
  - All 28 icons as React components
  - TypeScript props with size, className, accent options
  - Consistent 1.5pt stroke weight
  - Organic curves throughout
  - Documentation comments for each icon

**React Native Implementation**
- `apps/mobile/src/components/icons/VlossomIcons.tsx` - React Native SVG icons
  - All 28 icons adapted for React Native
  - Uses `react-native-svg` library
  - Matching design tokens

**Documentation**
- `design/brand/icons/ICONOGRAPHY_REPORT.md` - Complete icon library documentation
  - Design principles and rules
  - Usage guidelines (DO/DON'T)
  - Animation specifications
  - Icon consistency checklist

##### A.2: Animation System Implementation

Motion philosophy: "Earned, not constant" - animations only on meaningful state changes.

**CSS Animation System**
- `apps/web/styles/animations.css` - 250+ lines of animation definitions
  - Motion tokens (duration, easing curves)
  - Keyframe definitions for all motion verbs
  - Utility classes for common animations
  - Reduced motion support

**Motion Verbs Defined**
- `unfold` - Organic reveal like petal opening (300-500ms, growth/expansion)
- `breathe` - Subtle scale pulse (120-150ms, active/alive states)
- `settle` - Gentle ease into place (180-220ms, completion/arrival)

**Duration Tokens**
- `--motion-duration-instant`: 100ms
- `--motion-duration-micro`: 150ms
- `--motion-duration-nav`: 200ms
- `--motion-duration-standard`: 300ms
- `--motion-duration-growth`: 400ms
- `--motion-duration-dramatic`: 500ms

**Easing Tokens**
- `--motion-ease-unfold`: cubic-bezier(0.34, 1.56, 0.64, 1) - Overshoot for opening
- `--motion-ease-breathe`: cubic-bezier(0.4, 0, 0.6, 1) - Symmetric pulse
- `--motion-ease-settle`: cubic-bezier(0.25, 0.1, 0.25, 1) - Gentle deceleration

**TypeScript Motion Utilities**
- `apps/web/lib/motion.ts` - 150+ lines of motion utilities
  - `MotionContext` provider
  - `usePrefersReducedMotion()` hook
  - `useUnfoldMotion()` hook
  - `useBreatheMotion()` hook
  - `useSettleMotion()` hook
  - Motion helper functions

##### A.3: Typography Audit

Complete audit of typography usage across all user-facing components and pages.

**Files Created**
- `docs/audits/TYPOGRAPHY_AUDIT.md` - Complete typography audit report

**Audit Results**
- ✅ All main user-facing pages correctly use `font-display` for headlines
- ✅ Profile headers, booking dialogs, stylist profiles compliant
- ✅ Navigation, forms, data tables correctly use Inter (default)
- 📝 Help/support pages identified for future update (low priority)

**Typography Rules Confirmed**
- **Playfair Display** (`font-display`) - Headlines (h1, h2), profile names, celebration moments
- **Inter** (`font-sans`) - UI text, navigation, labels, data, inputs, buttons

##### A.4: Color Token Audit

Comprehensive audit of color token usage and brand color governance.

**Files Created**
- `docs/audits/COLOR_AUDIT.md` - Color token audit with findings and recommendations

**Key Findings**
- ✅ `brand-rose` correctly aliased to Primary Purple (#311E6B)
- ⚠️ Accent orange (#FF510D) misused in error contexts (9 files identified)
- 📝 Recommended creating `status-warning-soft` color token
- 📝 Action items documented for V6.1 color fixes

**Color Governance Confirmed**
- Primary Purple (#311E6B) - Main brand color, CTAs, headers
- Accent Orange (#FF510D) - SACRED for growth/celebration only, <8% surface area
- Tertiary Green (#A9D326) - Success states
- Status Error (#D0021B) - Errors, destructive actions

---

#### ✅ Phase B: Documentation Sync

**Files Updated**
- `docs/STYLE_BLUEPRINT.md` - Added V6.0 icon library section, animation system
- `docs/HANDOFF_FOR_GEMINI.md` - Updated with botanical icons, animation references
- `docs/vlossom/16-ui-components-and-design-system.md` - Documented implemented icon library

**Files Created**
- `design/brand/icons/ICONOGRAPHY_REPORT.md` - Master icon documentation (200+ lines)
- `docs/audits/TYPOGRAPHY_AUDIT.md` - Typography audit report (130+ lines)
- `docs/audits/COLOR_AUDIT.md` - Color audit report (150+ lines)
- `CLAUDE.md` (root) - Project-level context file (400+ lines)

---

#### ✅ Phase C: V6.0 Mobile App Setup

React Native + Expo foundation for iOS and Android mobile applications.

**App Structure Created**
- Framework: React Native 0.74.5, Expo SDK 51
- Navigation: Expo Router with file-based routing
- State Management: Zustand
- Package Version: `6.0.0`

**Files Created**
- `apps/mobile/package.json` - Dependencies and scripts
- `apps/mobile/app.json` - Expo configuration
- `apps/mobile/tsconfig.json` - TypeScript configuration
- `apps/mobile/src/styles/tokens.ts` - Design tokens matching web
- `apps/mobile/src/styles/theme.tsx` - Theme provider
- `apps/mobile/app/_layout.tsx` - Root layout
- `apps/mobile/app/(tabs)/_layout.tsx` - Tab navigation layout (5 tabs)
- `apps/mobile/app/(tabs)/index.tsx` - Home screen
- `apps/mobile/app/(tabs)/search.tsx` - Search screen
- `apps/mobile/app/(tabs)/wallet.tsx` - Wallet screen
- `apps/mobile/app/(tabs)/notifications.tsx` - Notifications screen
- `apps/mobile/app/(tabs)/profile.tsx` - Profile screen
- `apps/mobile/src/components/icons/VlossomIcons.tsx` - React Native botanical icons
- `apps/mobile/src/components/icons/index.ts` - Icon exports
- `apps/mobile/src/hooks/useBiometricAuth.ts` - Biometric authentication hook
- `apps/mobile/src/hooks/index.ts` - Hook exports
- `apps/mobile/src/styles/index.ts` - Style exports

**Key Features**
- 5-tab navigation: Home, Search, Wallet, Notifications, Profile
- Botanical icons using React Native SVG
- Biometric authentication ready (Face ID, Touch ID, Fingerprint)
- Design tokens matching web app exactly
- Theme provider for consistent styling

**Dependencies Added**
- `expo-router` ~3.5.23 - File-based navigation
- `expo-local-authentication` ~14.0.1 - Biometric auth
- `expo-location` ~17.0.1 - Geolocation
- `expo-notifications` ~0.28.16 - Push notifications
- `react-native-svg` 15.2.0 - SVG rendering
- `react-native-maps` 1.14.0 - Map views
- `zustand` ^4.5.2 - State management

---

#### Files Summary

**Design Assets**
- 28 SVG icon files in `design/brand/icons/` (organized by category)
- 1 iconography report (200+ lines)

**Web App**
- 1 React icon component file (600+ lines)
- 1 CSS animation file (250+ lines)
- 1 TypeScript motion utilities file (150+ lines)
- 1 updated bottom-nav component (using botanical icons)

**Mobile App**
- 14 new files (package.json, config, screens, hooks, components)
- 1 complete React Native app structure
- 1 React Native icon library

**Documentation**
- 3 audit reports (typography, color, iconography)
- 3 updated core design docs
- 1 root CLAUDE.md context file (400+ lines)

**Total Impact**
- ~30 new files across design, web, mobile, and documentation
- ~1,500+ lines of code (icons, animations, mobile app)
- ~4,000+ lines of documentation (audits, reports, context)

---

#### Usage

**Web App - Using Botanical Icons**
```tsx
import { VlossomHome, VlossomSearch, VlossomWallet } from '@/components/ui/vlossom-icons'

<VlossomHome size={24} className="text-primary" />
<VlossomSearch size={20} accent /> {/* Use accent for growth moments only */}
```

**Web App - Using Animations**
```tsx
// CSS classes
<div className="animate-unfold">...</div>
<div className="animate-settle">...</div>

// TypeScript hooks
const unfoldProps = useUnfoldMotion()
<div {...unfoldProps}>...</div>
```

**Mobile App - Running Dev Server**
```bash
cd apps/mobile
npm run dev
```

---

#### Next Steps (V6.1)

**Design System Polish**
- Fix accent orange usage in error contexts (9 files)
- Add `status-warning-soft` color token
- Document orange governance in STYLE_BLUEPRINT.md
- Add Tailwind lint rule for accent misuse

**Mobile App Development**
- Connect mobile app to API client
- Implement wallet unlock with biometric auth
- Add stylist discovery with map view
- Build booking flow (mobile-optimized)

---

## [5.3.0] - 2025-12-17

### V5.3.0: Mock Data Feature Flag System - COMPLETE ✅

**Goal**: Enable toggle between real API data and mock data for demos and UI testing.

**Feature Flag**: `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local`

#### ✅ Mock Data Infrastructure

**Central Mock Data File**
- `apps/web/lib/mock-data.ts` - All mock constants and helpers
- `MOCK_STYLISTS` - 5 stylists with full marker data
- `MOCK_SALONS` - 2 salons with amenities
- `MOCK_PROFILE_STATS` - Customer profile statistics
- `MOCK_STYLIST_STATS` - Stylist dashboard metrics
- `MOCK_PROPERTY_STATS` - Property owner metrics
- `MOCK_SOCIAL_STATS` - Follower/following counts
- `shouldUseMockData()` - Helper to determine data source
- `withMockFallback()` - Generic fallback wrapper

#### ✅ Profile Stats Hooks

**New Hook File**
- `apps/web/hooks/use-profile-stats.ts` - All profile-related stats hooks

**Hooks Created**
- `useStylistDashboardStats()` - Business metrics for stylists
- `usePropertyDashboardStats()` - Property owner metrics
- `useSocialStats(userId)` - Follower/following counts
- `useRewardsStats()` - Gamification/XP stats
- `formatCurrency(cents)` - ZAR currency formatting
- `formatPercentage(value)` - Percentage formatting

#### ✅ Updated Components

**Home Page**
- Uses `MOCK_SALONS` from centralized mock-data
- Shows "Demo Data" badge in development when using mock data
- `useStylistMarkers` hook returns `isUsingMockData` flag

**Profile Page**
- `ProfileHeader` wired to `useSocialStats()` for followers/following
- `RewardsCard` wired to `useRewardsStats()` with loading/error states
- Social stats replace hardcoded zeros

**Role Tabs**
- `StylistTab` wired to `useStylistDashboardStats()`
- `SalonTab` wired to `usePropertyDashboardStats()`
- Both show loading skeletons and error states
- "Demo Data" badge in development mode

#### ✅ Updated Hooks

**use-stylist-markers.ts**
- Added `shouldUseMockData()` fallback logic
- Returns `isUsingMockData` boolean
- Falls back to `MOCK_STYLISTS` when API empty

**use-nearby-stylists.ts**
- Added mock data fallback for `useNearbyStylists`
- Added mock data fallback for `useNearbySalons`
- `useMapData` combines both with mock fallback

#### Files Created

- `apps/web/hooks/use-profile-stats.ts` - Profile stats hooks (200 lines)

#### Files Modified

- `apps/web/lib/mock-data.ts` - Added helper functions
- `apps/web/hooks/use-stylist-markers.ts` - Mock fallback
- `apps/web/hooks/use-nearby-stylists.ts` - Mock fallback
- `apps/web/app/(main)/home/page.tsx` - Use centralized mocks
- `apps/web/app/(main)/profile/page.tsx` - Wire stats hooks
- `apps/web/components/profile/role-tabs.tsx` - Wire dashboard hooks

#### Usage

**Enable Demo Mode:**
```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_DATA=true
```

**Automatic Fallback:**
- When API returns empty data, mock data displays automatically
- When API succeeds, real data replaces mock data
- "Demo Data" badge appears in development when using mock data

---

## [5.2.0] - 2025-12-17

### V5.2.0: UX Excellence & Favorites Integration - COMPLETE ✅

**Goal**: Achieve 10/10 UX score, add favorites system, complete full frontend integration.

**42 Files Changed | +8,725 / -1,324 Lines | UX Score 10/10**

#### ✅ Favorites System (New)

**Database & API**
- `FavoriteStylist` Prisma model with user-stylist relationship
- Indexes for efficient queries
- Full CRUD API: `POST/GET/DELETE /api/v1/favorites/*`

**Frontend Integration**
- `apps/web/components/stylists/favorite-button.tsx` - Heart button with animations
- `apps/web/hooks/use-favorites.ts` - React Query hooks for favorites
- `apps/web/lib/favorites-client.ts` - Typed API client
- Integrated in StylistCard and StylistProfile components
- FavoritesStylistsCard displays real favorites on profile

#### ✅ Map Component V5.2

**Performance Optimizations**
- Grid-based clustering for large datasets
- List view fallback for accessibility
- Low-end device detection (deviceMemory, connection.effectiveType)
- Reduced motion support (prefers-reduced-motion)
- User preference persistence (localStorage)

**Accessibility**
- Full keyboard navigation (arrow keys, +/-, Enter, Ctrl+L)
- ARIA labels throughout
- Screen reader support

**New Hooks**
- `usePrefersReducedMotion()` - Detect reduced motion preference
- `useIsLowEndDevice()` - Detect memory/connection constraints
- `useViewPreference()` - Persist map/list view choice

#### ✅ Session Tracker (New)

**Simplified 3-State Model**
- `apps/web/components/bookings/session-tracker.tsx`
- States: Started → In Progress → Complete
- Replaces complex multi-step tracking

**Live Updates**
- SSE (Server-Sent Events) for real-time progress
- Polling fallback when SSE unavailable
- Connection status indicators
- ETA display with progress bar

**Display Modes**
- Full card with progress steps
- Compact inline mode

#### ✅ Rituals API (New)

**Backend Routes**
- `services/api/src/routes/rituals.ts` - Full CRUD API
- 8 endpoints for rituals and steps
- Clone from templates functionality

**Endpoints**
```
GET    /api/v1/rituals/templates     - List ritual templates
GET    /api/v1/rituals               - List user's rituals
GET    /api/v1/rituals/:id           - Get ritual details
POST   /api/v1/rituals               - Create custom ritual
POST   /api/v1/rituals/:templateId/clone - Clone from template
PATCH  /api/v1/rituals/:id           - Update ritual
DELETE /api/v1/rituals/:id           - Delete ritual
POST   /api/v1/rituals/:id/steps     - Add step to ritual
DELETE /api/v1/rituals/:id/steps/:stepId - Remove step
```

#### ✅ Route Group Refactor

**Shared Layout**
- Created `apps/web/app/(main)/layout.tsx` with BottomNav
- Moved pages: home, profile, schedule, bookings, stylists
- Removed duplicate BottomNav imports from individual pages
- Updated all imports to use `@/` path aliases

**Pages Moved to (main)**
```
app/(main)/
├── layout.tsx              ← Shared BottomNav
├── home/page.tsx
├── profile/
│   ├── page.tsx
│   └── hair-health/
│       ├── page.tsx
│       ├── onboarding/page.tsx
│       └── edit/page.tsx
├── schedule/page.tsx
├── bookings/
│   ├── page.tsx
│   └── [id]/page.tsx
└── stylists/
    ├── page.tsx
    └── [id]/page.tsx
```

#### ✅ Booking Stats Integration

**Profile Page Updates**
- `BookingStatsCard` wired to `useBookingStats()` hook
- Displays real booking history from API
- `FavoritesStylistsCard` wired to `useFavorites()` hook

#### Files Created/Modified

**New Backend Files**
- `services/api/src/routes/favorites.ts` - Favorites API (326 lines)
- `services/api/src/routes/rituals.ts` - Rituals API (643 lines)
- `services/api/prisma/migrations/20251217021018_add_favorite_stylists/` - Migration

**New Frontend Files**
- `apps/web/components/stylists/favorite-button.tsx` - Heart button (78 lines)
- `apps/web/components/bookings/session-tracker.tsx` - Session tracking (389 lines)
- `apps/web/hooks/use-favorites.ts` - Favorites hooks (140 lines)
- `apps/web/hooks/use-stylist-markers.ts` - Map marker hooks (130 lines)
- `apps/web/lib/favorites-client.ts` - API client (201 lines)
- `apps/web/app/(main)/layout.tsx` - Shared layout (23 lines)

**Modified Files**
- `apps/web/components/map/stylist-map.tsx` - V5.2 enhancements (+500 lines)
- `apps/web/components/stylists/stylist-card.tsx` - Added FavoriteButton
- `apps/web/components/stylists/stylist-profile.tsx` - Added FavoriteButton
- `apps/web/app/(main)/profile/page.tsx` - Real booking stats
- `services/api/src/index.ts` - Registered favorites + rituals routers

#### Documentation

**New Docs**
- `docs/STYLE_BLUEPRINT.md` - Complete design system guide (803 lines)

**Updated Docs**
- `docs/HANDOFF_FOR_GEMINI.md` - V5.2 state
- `docs/project/changelog.md` - This entry

---

## [5.1.0] - 2025-12-17

### V5.1.0: Hair Health Frontend Integration (Phase 1-3) - COMPLETE ✅

**Goal**: Wire V5.0 backend APIs to frontend components for Hair Health feature.

**3 Phases | 8 New Files | Full Hair Health UI**

#### ✅ Phase 1: API Client Layer

**Hair Health API Client**
- `apps/web/lib/hair-health-client.ts` - Typed API client for all hair health endpoints
- Profile CRUD (get, create, update, delete)
- Learning progress (get progress, unlock nodes)
- Full TypeScript types for all responses

**Stylist Context API Client**
- `apps/web/lib/stylist-context-client.ts` - Consent-based profile sharing client
- Customer endpoints (grant, revoke, list shares)
- Stylist endpoints (list customers, view context, update notes)
- Consent scope helpers and labels

#### ✅ Phase 2: React Query Hooks

**Hair Health Hooks**
- `apps/web/hooks/use-hair-health.ts` - React Query hooks for profile management
- `useHairProfile()` - Fetch current user's profile
- `useHairProfileWithAnalysis()` - Profile with health score and recommendations
- `useCreateHairProfile()` - Create new profile mutation
- `useUpdateHairProfile()` - Update profile mutation
- `useDeleteHairProfile()` - Delete profile mutation
- `useLearningProgress()` - Fetch learning nodes
- `useUnlockLearningNode()` - Unlock node mutation
- Cache invalidation on mutations

**Stylist Context Hooks**
- `apps/web/hooks/use-stylist-context.ts` - React Query hooks for sharing
- `useMyStylistShares()` - List stylists customer shared with
- `useGrantStylistAccess()` - Grant access mutation
- `useRevokeStylistAccess()` - Revoke access mutation
- `useMyCustomers()` - Stylist view of shared customers
- `useCustomerContext()` - Detailed customer context
- Consent scope labels and descriptions

#### ✅ Phase 3: Hair Health Integration

**Hair Health Page (Wired to API)**
- `apps/web/app/profile/hair-health/page.tsx` - Full rewrite with real data
- Health Score Card with A-F grade and archetype
- Hair Snapshot (texture, pattern, porosity, density)
- Care Insights with recommendations
- Profile Analysis (strengths, concerns)
- Learning Progress with unlock buttons
- Loading skeletons and error states

**Onboarding Wizard (5-Step)**
- `apps/web/app/profile/hair-health/onboarding/page.tsx` - Multi-step profile creation
- Step 1: Texture & Pattern (type, pattern family, strand thickness)
- Step 2: Porosity & Density (porosity level, density, shrinkage)
- Step 3: Sensitivity (detangle, tension, scalp sensitivity)
- Step 4: Routine (type, wash day intensity, duration)
- Step 5: Review & Submit
- Progress bar, back/next navigation, validation

**Profile Editor (Tabbed)**
- `apps/web/app/profile/hair-health/edit/page.tsx` - Edit existing profile
- 4 tabs: Texture, Porosity, Sensitivity, Routine
- Save changes with mutation
- Delete profile with confirmation dialog
- Clear field options for optional attributes

#### Files Created

```
apps/web/
├── lib/
│   ├── hair-health-client.ts      ← API client (205 lines)
│   └── stylist-context-client.ts  ← API client (160 lines)
├── hooks/
│   ├── use-hair-health.ts         ← React Query hooks (201 lines)
│   └── use-stylist-context.ts     ← React Query hooks (170 lines)
└── app/profile/hair-health/
    ├── page.tsx                   ← Main page (601 lines)
    ├── onboarding/page.tsx        ← Wizard (420 lines)
    └── edit/page.tsx              ← Editor (350 lines)
```

#### What's Next (V5.1 Phase 4-7)

Remaining integration work:
- Phase 4: Schedule Integration (calendar events)
- Phase 5: Home Page Integration (stylists API)
- Phase 6: Profile Integration (user profile tabs)
- Phase 7: Navigation Refactor (optional)

---

## [5.0.0] - 2025-12-17

### V5.0.0: Hair Health Intelligence (Backend) - COMPLETE ✅

**Goal**: Build intelligent hair care system with profile analysis, recommendations, calendar integration, and stylist context sharing.

**5 Backend Phases | ~15 New Files | Intelligence Layer Foundation**

#### ✅ Phase 1: Core Architecture

**Hair Health Profile System**
- `services/api/src/lib/hair-health/types.ts` - TypeScript interfaces (50+ types)
- `services/api/src/lib/hair-health/profile-service.ts` - CRUD operations
- `services/api/src/routes/hair-health.ts` - 6 API endpoints

**Profile Attributes:**
- Texture (2A-4C, mixed, unknown)
- Pattern Family (straight, wavy, curly, coily, kinky)
- Strand Thickness (fine, medium, coarse)
- Porosity Level (low, medium, high)
- Sensitivity Metrics (scalp, tension, manipulation, detangle)
- Routine Type (growth, repair, maintenance, kids)

#### ✅ Phase 2: Calendar Intelligence

**Database Schema Updates**
- `HairHealthProfile` model with 20+ fields
- `HairCalendarEvent` model for ritual tracking
- `StylistClientContext` model for consent-based sharing
- Load level enums (LIGHT, MEDIUM, HEAVY)

#### ✅ Phase 3: Map-First Home (Schema)

**Location Support**
- Added location fields to profile schema
- Geospatial query support preparation

#### ✅ Phase 4: Real-Time Features

**Booking Live Updates**
- `services/api/src/routes/bookings-realtime.ts` - 7 new endpoints
- Server-Sent Events (SSE) for live status streaming
- Session progress tracking (ETA, location, completion %)

**Frontend Hooks**
- `apps/web/hooks/use-location-tracking.ts` - Consent-based geolocation
- `apps/web/hooks/use-live-updates.ts` - SSE connection management

**New Endpoints:**
- `GET /api/v1/bookings/:id/live` - SSE stream
- `POST /api/v1/bookings/:id/session/progress` - Update progress
- `GET /api/v1/bookings/:id/session/progress` - Get progress
- `POST /api/v1/bookings/:id/session/arrived` - Stylist arrival
- `POST /api/v1/bookings/:id/session/customer-arrived` - Customer arrival
- `POST /api/v1/bookings/:id/session/end` - End session
- `GET /api/v1/bookings/active-sessions` - List active sessions

**Notification Types Added:**
- `SESSION_PROGRESS` - Service progress updates
- `STYLIST_ARRIVED` - Stylist arrival notification
- `CUSTOMER_ARRIVED` - Customer arrival notification

#### ✅ Phase 5: Intelligence Layer

**Intelligence Engine**
- `services/api/src/lib/hair-health/intelligence-engine.ts` - Core analysis
- Health scoring (0-100 scale, A-F grades)
- 8 hair archetypes (Resilient Coily, Delicate Fine, etc.)
- Risk assessment with severity levels and mitigation
- Weekly load capacity calculation

**Hair Archetypes:**
1. Resilient Coily - High-shrinkage, low-porosity, protective-ready
2. Delicate Fine - Low density, high porosity, gentle care needed
3. Balanced Wavy - Medium everything, versatile routine
4. High-Maintenance Curly - High porosity, moisture-dependent
5. Low-Porosity Guardian - Product buildup prone, heat-activated
6. Sensitive Scalp - Scalp-first approach required
7. Growth Focused - Length retention priority
8. Unknown Explorer - Needs profiling guidance

**Recommendations Engine**
- `services/api/src/lib/hair-health/recommendations.ts` - Care suggestions
- Weekly focus generation
- Quick wins for immediate improvement
- Category-based recommendations (moisture, protein, scalp, etc.)

**Rest Buffer Calculator**
- `services/api/src/lib/hair-health/rest-buffer-calculator.ts` - Recovery logic
- Event load scoring (0-100)
- Profile-adjusted rest requirements
- Weekly load status tracking
- Optimal scheduling suggestions

**Stylist Context API**
- `services/api/src/routes/stylist-context.ts` - Consent-based sharing
- 7 endpoints for customer-stylist profile sharing

**Customer Endpoints:**
- `GET /api/v1/stylist-context/:stylistId` - View shared context
- `POST /api/v1/stylist-context/grant` - Grant stylist access
- `DELETE /api/v1/stylist-context/:stylistId` - Revoke access
- `GET /api/v1/stylist-context/my-shares` - List all shares

**Stylist Endpoints:**
- `GET /api/v1/stylist-context/customers` - List shared customers
- `GET /api/v1/stylist-context/customer/:id` - View customer context
- `PATCH /api/v1/stylist-context/customer/:id` - Update notes

**Consent Scopes:**
- `TEXTURE` - Basic texture data
- `POROSITY` - Porosity and retention risk
- `SENSITIVITY` - All sensitivity metrics
- `ROUTINE` - Wash day and routine info
- `FULL` - Complete profile access

#### What's Next (V5.0 Frontend)

Frontend components pending:
- Hair Health Profile UI (onboarding + display)
- Calendar Views (Rhythm Strip, Month Garden, Day Flow)
- Map-First Home with stylist pins
- 5-Tab Navigation
- Profile Role Tabs

---


---

## Archived Versions

For changelog entries from V1.2.0 through V4.0.1, see:
- [changelog-archive-v1-v4.md](./changelog-archive-v1-v4.md) - V1.2.0 to V4.0.1
- [changelog-archive-v0.md](./changelog-archive-v0.md) - Pre-release versions
