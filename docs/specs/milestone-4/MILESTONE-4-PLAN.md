# Milestone 4: Production Ready - Implementation Plan

**Target Duration**: Weeks 7-8 of V1.0
**Features**: F4.1 - F4.7 (7 features)
**Goal**: Prepare Vlossom Protocol for beta launch with scheduling, notifications, testing, and security hardening

---

## Executive Summary

Milestone 4 bridges the functional application (M1-M3) with production-grade reliability by implementing:
- **Scheduling infrastructure** (conflict detection + travel time)
- **Notification system** (email/SMS/in-app for booking lifecycle)
- **Comprehensive testing** (E2E with Playwright)
- **Security hardening** (OWASP Top 10, rate limiting)

**Current State**: M1-M3 complete (25 features), escrow deployed to Base Sepolia, 6 TODO comments for notifications in bookings.ts

---

## Feature Summary

| Feature | Name | Week | Priority |
|---------|------|------|----------|
| F4.1 | Scheduling Engine (Conflict Detection) | 7 | P0 |
| F4.2 | Travel Time Calculation (Google API) | 7 | P0 |
| F4.3 | Notification Service (Email/SMS/In-App) | 7 | P0 |
| F4.4 | Search & Filter API Enhancement | 7 | P1 |
| F4.5 | Image Upload (Cloudinary) | 7 | P1 |
| F4.6 | E2E Testing (Playwright) | 8 | P0 |
| F4.7 | Security Hardening | 8 | P0 |

---

## Week 7: Backend Infrastructure

### F4.1: Scheduling Engine with Conflict Detection

**Purpose**: Prevent double-booking and ensure adequate buffer time between appointments

**New Files**:
- `services/api/src/lib/scheduling/scheduling-service.ts`
- `services/api/src/lib/scheduling/availability-checker.ts`

**New Endpoint**:
```
POST /api/bookings/check-availability
Input: { stylistId, serviceId, startTime, locationType, locationCoords? }
Output: { available: boolean, conflicts: [], suggestedAlternatives: [] }
```

**Modify**: `POST /api/bookings` - Add conflict check before creation (return 409 on conflict)

**Algorithm**:
1. Check stylist weekly schedule (StylistAvailability.schedule)
2. Check blocked exceptions (StylistAvailability.exceptions)
3. Query existing bookings (CONFIRMED, IN_PROGRESS states)
4. Calculate travel buffer for mobile stylists (uses F4.2)
5. Return availability status + alternatives

**Frontend Updates**:
- `apps/web/components/booking/datetime-picker.tsx` - Real-time availability check
- `apps/web/hooks/use-availability.ts` - New React Query hook

**Acceptance Criteria**:
- [ ] Double-booking is impossible (409 Conflict error)
- [ ] Blocked dates show as unavailable
- [ ] 30-minute buffer between appointments for mobile stylists
- [ ] Available slots API returns accurate results

---

### F4.2: Travel Time Calculation

**Purpose**: Calculate realistic travel times for mobile stylists using Google Distance Matrix API

**New Files**:
- `services/api/src/lib/scheduling/travel-time-service.ts`

**New Endpoint**:
```
GET /api/travel-time
Input: { originLat, originLng, destLat, destLng }
Output: { travelTimeMinutes, distanceKm, cached }
```

**Configuration**:
```env
GOOGLE_MAPS_API_KEY=xxx
DEFAULT_TRAVEL_BUFFER_MIN=30
TRAVEL_CACHE_TTL_MIN=60
```

**Implementation**:
- Google Distance Matrix API integration
- In-memory caching for repeated routes
- Haversine formula fallback if API unavailable
- Traffic-aware routing for peak hours (optional)

**Acceptance Criteria**:
- [ ] Travel time calculated for mobile/hybrid stylists
- [ ] Caching prevents excessive API calls
- [ ] Graceful fallback when API unavailable
- [ ] API key secured via environment variable

---

### F4.3: Notification Service

**Purpose**: Multi-channel notifications for all booking lifecycle events

**New Files**:
```
services/api/src/lib/notifications/
├── notification-service.ts    # Core orchestration
├── email-provider.ts          # SendGrid integration
├── sms-provider.ts            # Twilio/Clickatell
├── templates.ts               # Message templates
└── types.ts                   # TypeScript interfaces
```

**New Database Model** (schema.prisma):
```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      NotificationType
  channel   NotificationChannel  // EMAIL, SMS, IN_APP
  status    NotificationStatus   // PENDING, SENT, FAILED
  title     String
  body      String
  metadata  Json?
  sentAt    DateTime?
  readAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
}

enum NotificationType {
  BOOKING_CREATED
  BOOKING_APPROVED
  BOOKING_DECLINED
  PAYMENT_CONFIRMED
  SERVICE_STARTED
  SERVICE_COMPLETED
  BOOKING_CANCELLED
}
```

**New Endpoints**:
- `GET /api/notifications` - List user notifications (paginated)
- `POST /api/notifications/:id/read` - Mark as read
- `GET /api/notifications/unread-count` - Badge count

**Replace TODOs in bookings.ts**:
| Line | Event | Notification |
|------|-------|--------------|
| 163 | Booking created | Notify stylist |
| 317 | Stylist approved | Notify customer |
| 421 | Stylist declined | Notify customer |
| 680 | Service started | Notify customer |
| 809 | Service completed | Notify customer |
| 1115 | Booking cancelled | Notify both |

**Frontend Updates**:
- `apps/web/components/notifications/notification-bell.tsx` - Bell icon with badge
- `apps/web/hooks/use-notifications.ts` - Notifications hook
- Update layout to include notification bell

**External Services**:
- **SendGrid** (Email): `@sendgrid/mail` - 100 free/day
- **Clickatell** (SMS): Recommended for SA market

**Acceptance Criteria**:
- [ ] Email sent for all booking state changes
- [ ] SMS sent for critical events (approval, start)
- [ ] In-app notifications visible in UI
- [ ] Unread badge count updates
- [ ] All 6 TODOs in bookings.ts replaced

---

### F4.4: Search & Filter API Enhancement

**Purpose**: Advanced stylist search with full-text, price range, and sorting

**Modify**: `GET /api/stylists` to accept new parameters:
```typescript
{
  // Existing
  lat?, lng?, radius?, serviceCategory?, page?, pageSize?

  // New
  query?: string           // Name/bio search
  minPrice?: number        // Min service price (cents)
  maxPrice?: number        // Max service price (cents)
  operatingMode?: 'FIXED' | 'MOBILE' | 'HYBRID'
  sortBy?: 'price_asc' | 'price_desc' | 'distance' | 'rating'
  availability?: string    // ISO date - available on date
}
```

**Database Changes**:
- Add GIN index on User.displayName for full-text search

**Frontend Updates**:
- `apps/web/components/stylists/search-filters.tsx` - New filter component
- Update `apps/web/app/stylists/page.tsx` with search UI

**Acceptance Criteria**:
- [ ] Search by name returns relevant results
- [ ] Price range filter works
- [ ] Sort by price/distance works
- [ ] Pagination works for large result sets

---

### F4.5: Image Upload (Cloudinary)

**Purpose**: Portfolio image upload with CDN delivery

**New Files**:
- `services/api/src/lib/cloudinary/cloudinary-service.ts`

**New Endpoints**:
- `POST /api/upload/portfolio` - Upload image (multipart/form-data)
- `DELETE /api/upload/:publicId` - Delete image

**Configuration**:
```env
CLOUDINARY_CLOUD_NAME=vlossom
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

**Image Transformations**:
- Main: 800x800 max, auto quality
- Thumbnail: 200x200 crop

**Update**: `apps/web/components/dashboard/portfolio-upload.tsx`
- Replace blob URLs with Cloudinary upload
- Add progress indicator
- Add delete functionality

**Acceptance Criteria**:
- [ ] Images upload to Cloudinary successfully
- [ ] Thumbnails generated automatically
- [ ] Images served via CDN
- [ ] Delete removes from Cloudinary
- [ ] 5MB file size limit enforced

---

## Week 8: Testing & Security

### F4.6: E2E Testing (Playwright)

**Purpose**: Comprehensive end-to-end testing of critical user flows

**Setup**:
```
apps/web/
├── playwright.config.ts
└── e2e/
    ├── customer-booking.spec.ts
    ├── stylist-approval.spec.ts
    ├── auth.spec.ts
    ├── wallet.spec.ts
    ├── fixtures/test-data.ts
    └── helpers/
        ├── auth.ts
        └── api.ts
```

**Test Suites**:

| Suite | Steps | Priority |
|-------|-------|----------|
| Customer Booking | Signup → Browse → Book → Pay → Track → Cancel | P0 |
| Stylist Approval | Signup → Services → Availability → Approve → Complete | P0 |
| Authentication | Signup → Login → Logout → Invalid credentials | P0 |
| Wallet | Balance → Faucet → Transactions | P1 |

**Configuration** (playwright.config.ts):
```typescript
{
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: { command: 'pnpm dev' },
  projects: [
    { name: 'chromium' },
    { name: 'mobile', use: devices['iPhone 12'] }
  ]
}
```

**Acceptance Criteria**:
- [ ] All 4 test suites pass
- [ ] Tests run in CI (GitHub Actions)
- [ ] Mobile viewport tests pass
- [ ] Tests complete in < 5 minutes

---

### F4.7: Security Hardening

**Purpose**: OWASP Top 10 compliance and production security

**New Files**:
- `services/api/src/middleware/rate-limiter.ts`
- `services/api/src/middleware/security-headers.ts`

**Rate Limiting**:
| Endpoint | Window | Max |
|----------|--------|-----|
| POST /api/auth/login | 15 min | 5 |
| POST /api/auth/signup | 1 hour | 3 |
| POST /api/bookings | 1 hour | 20 |
| POST /api/wallet/faucet | 24 hours | 1 |
| Global default | 1 min | 100 |

**Security Headers** (helmet.js):
```typescript
{
  contentSecurityPolicy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  referrerPolicy: 'strict-origin-when-cross-origin'
}
```

**Auth Hardening**:
- Account lockout after 5 failed login attempts
- Security event logging (failed logins, role changes)
- Refresh token rotation (optional)

**Dependency Audit**:
- Run `pnpm audit --fix`
- No critical/high vulnerabilities allowed

**OWASP Checklist**:
- [x] A1: Injection - Prisma ORM (parameterized)
- [ ] A2: Broken Auth - Add lockout + rate limiting
- [ ] A3: Sensitive Data - Audit API responses
- [x] A4: XXE - Not applicable (JSON only)
- [ ] A5: Access Control - Audit authorization
- [ ] A6: Misconfiguration - Security headers
- [x] A7: XSS - React auto-escapes
- [x] A8: Deserialization - Zod validation
- [ ] A9: Vulnerable Components - npm audit
- [ ] A10: Logging - Add security events

**Acceptance Criteria**:
- [ ] Rate limiting on all sensitive endpoints
- [ ] Security headers configured
- [ ] No critical/high npm vulnerabilities
- [ ] Auth hardening implemented
- [ ] OWASP checklist complete

---

## Implementation Order

| Day | Task | Feature |
|-----|------|---------|
| 1 | Travel time service | F4.2 |
| 2 | Scheduling engine | F4.1 |
| 3-4 | Notification service + database | F4.3 |
| 5 | Search & filter API | F4.4 |
| 6 | Cloudinary image upload | F4.5 |
| 7-8 | E2E test suites | F4.6 |
| 9-10 | Security hardening | F4.7 |
| 11-12 | Integration testing + polish | All |
| 13-14 | Documentation updates | All |

**Parallel Tracks**:
- Track A (Days 1-4): F4.1, F4.2, F4.3 (core infrastructure)
- Track B (Days 5-6): F4.4, F4.5 (enhancements)
- Track C (Days 7-10): F4.6, F4.7 (quality)

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `services/api/src/routes/bookings.ts` | Replace 6 notification TODOs, add conflict check |
| `services/api/src/routes/stylists.ts` | Enhance search/filter API |
| `services/api/prisma/schema.prisma` | Add Notification model |
| `services/api/src/index.ts` | Add rate limiting, security headers |
| `apps/web/components/booking/datetime-picker.tsx` | Real-time availability |
| `apps/web/components/dashboard/portfolio-upload.tsx` | Cloudinary upload |
| `apps/web/app/layout.tsx` | Add notification bell |

---

## New Backend Endpoints Summary

| Method | Endpoint | Feature |
|--------|----------|---------|
| POST | `/api/bookings/check-availability` | F4.1 |
| GET | `/api/travel-time` | F4.2 |
| GET | `/api/notifications` | F4.3 |
| POST | `/api/notifications/:id/read` | F4.3 |
| GET | `/api/notifications/unread-count` | F4.3 |
| POST | `/api/upload/portfolio` | F4.5 |
| DELETE | `/api/upload/:publicId` | F4.5 |

---

## External Services Required

| Service | Purpose | Cost |
|---------|---------|------|
| Google Maps API | Distance Matrix | ~$5/1000 req |
| SendGrid | Email | Free 100/day |
| Cloudinary | Images | Free 25GB |
| Clickatell (optional) | SMS for SA | ~R0.50/SMS |

---

## Success Criteria

### Performance Targets
| Metric | Target |
|--------|--------|
| Page load (LCP) | < 3s |
| API response (p95) | < 500ms |
| Availability check | < 200ms |
| Image load (CDN) | < 1s |

### Test Coverage
| Area | Target |
|------|--------|
| Unit tests (API) | > 80% |
| E2E test suites | 4 passing |
| Security checklist | 100% |

### Milestone Completion
- [ ] All 7 features implemented
- [ ] E2E tests passing in CI
- [ ] Security audit complete (no critical findings)
- [ ] Performance targets met
- [ ] Documentation updated

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Google API quota limits | Implement caching + Haversine fallback |
| Email deliverability | Use SendGrid with verified domain |
| E2E test flakiness | Use stable selectors, add retries |
| Security false positives | Manual review of audit findings |
| Image upload size | Client-side validation + server limit |
