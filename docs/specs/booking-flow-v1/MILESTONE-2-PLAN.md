# Milestone 2: Customer Can Book - Implementation Plan

## Overview

**Goal:** Enable customers to discover stylists, view profiles, select services, book appointments, pay via escrow, and track/cancel bookings.

**Duration:** Week 3-4
**Features:** F2.1 - F2.9
**Status:** ✅ COMPLETE (December 14, 2025)

---

## Implementation Summary

All 9 features (F2.1-F2.9) have been fully implemented:

- **17 new React components** across 3 directories
- **4 new pages** (stylists, stylist profile, bookings, booking details)
- **2 API clients** with full TypeScript types
- **4 React Query hooks** with mutations
- **Multi-step booking dialog** with 7-step state machine
- **Time-based cancellation policy** with refund tiers

---

## Week 3: Stylist Discovery + Service Selection (F2.1-F2.5)

### Backend Status: 100% Complete
All APIs exist from V0.5:
- `GET /api/stylists` - Search with filters (location, category, radius)
- `GET /api/stylists/:id` - Profile with services
- `POST /api/bookings` - Create booking request

### Focus: Frontend Implementation

---

## Feature Summary

| Feature | Name | Priority | Complexity | Dependencies |
|---------|------|----------|------------|--------------|
| F2.1 | Stylist Browse/Discovery | High | Medium | Theme system |
| F2.2 | Stylist Profile View | High | Medium | F2.1 |
| F2.3 | Service Selection | High | Low | F2.2 |
| F2.4 | Date & Time Picker | High | Medium | F2.3 |
| F2.5 | Location Selection | Medium | Medium | F2.4 |
| F2.6 | Booking Summary | High | Low | F2.5 |
| F2.7 | Escrow Payment | High | High | F2.6, Wallet |
| F2.8 | Status Tracking | High | Medium | F2.7 |
| F2.9 | Cancellation & Refund | Medium | Medium | F2.8 |

---

## File Structure

```
apps/web/
├── app/
│   ├── stylists/
│   │   ├── page.tsx              # F2.1: Stylist listing page
│   │   └── [id]/
│   │       └── page.tsx          # F2.2: Stylist profile page
│   └── book/
│       └── [stylistId]/
│           └── page.tsx          # F2.3-F2.6: Multi-step booking flow
├── components/
│   ├── stylists/
│   │   ├── stylist-card.tsx      # F2.1: List item card
│   │   ├── stylist-grid.tsx      # F2.1: Grid layout
│   │   ├── stylist-filters.tsx   # F2.1: Search/filter UI
│   │   ├── stylist-profile.tsx   # F2.2: Profile display
│   │   └── service-list.tsx      # F2.2: Services list
│   └── booking/
│       ├── booking-dialog.tsx    # F2.3-F2.7: Multi-step dialog
│       ├── service-selector.tsx  # F2.3: Service selection step
│       ├── datetime-picker.tsx   # F2.4: Date/time picker step
│       ├── location-selector.tsx # F2.5: Location selection step
│       ├── booking-summary.tsx   # F2.6: Summary + price breakdown
│       ├── payment-step.tsx      # F2.7: Escrow payment step
│       ├── booking-card.tsx      # F2.8: Booking status card
│       └── cancel-dialog.tsx     # F2.9: Cancellation dialog
├── hooks/
│   ├── use-stylists.ts           # React Query: stylist listing
│   ├── use-stylist.ts            # React Query: single stylist
│   └── use-bookings.ts           # React Query: bookings CRUD
└── lib/
    ├── stylist-client.ts         # API client for stylists
    ├── booking-client.ts         # API client for bookings
    └── escrow-client.ts          # Escrow contract interactions
```

---

## Implementation Order

### Phase 1: Data Layer (Day 1)
1. `lib/stylist-client.ts` - API client
2. `lib/booking-client.ts` - API client
3. `hooks/use-stylists.ts` - React Query hooks
4. `hooks/use-stylist.ts` - Single stylist hook
5. `hooks/use-bookings.ts` - Booking mutations

### Phase 2: Stylist Discovery (Day 1-2)
1. `components/stylists/stylist-card.tsx`
2. `components/stylists/stylist-grid.tsx`
3. `components/stylists/stylist-filters.tsx`
4. `app/stylists/page.tsx`

### Phase 3: Stylist Profile (Day 2)
1. `components/stylists/service-list.tsx`
2. `components/stylists/stylist-profile.tsx`
3. `app/stylists/[id]/page.tsx`

### Phase 4: Booking Flow (Day 2-3)
1. `components/booking/service-selector.tsx`
2. `components/booking/datetime-picker.tsx`
3. `components/booking/location-selector.tsx`
4. `components/booking/booking-summary.tsx`
5. `components/booking/booking-dialog.tsx`

### Phase 5: Payment & Tracking (Day 3-4)
1. `lib/escrow-client.ts`
2. `components/booking/payment-step.tsx`
3. `components/booking/booking-card.tsx`
4. `app/bookings/page.tsx`

### Phase 6: Cancellation (Day 4)
1. `components/booking/cancel-dialog.tsx`
2. Integration with booking-card

---

## API Endpoints Used

### Stylists
| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/stylists` | GET | F2.1 Listing |
| `/api/stylists/:id` | GET | F2.2 Profile |

### Bookings
| Endpoint | Method | Used By |
|----------|--------|---------|
| `POST /api/bookings` | POST | F2.6 Create |
| `GET /api/bookings/:id` | GET | F2.8 Status |
| `GET /api/bookings/:id/payment-instructions` | GET | F2.7 Payment |
| `POST /api/bookings/:id/confirm-payment` | POST | F2.7 Confirm |
| `POST /api/bookings/:id/cancel` | POST | F2.9 Cancel |

---

## Component Patterns

### Multi-Step Dialog Pattern
Reuse pattern from wallet dialogs:
```tsx
type BookingStep =
  | "service"      // F2.3
  | "datetime"     // F2.4
  | "location"     // F2.5
  | "summary"      // F2.6
  | "payment"      // F2.7
  | "processing"
  | "success";

const [step, setStep] = useState<BookingStep>("service");
```

### State Management
```tsx
interface BookingState {
  stylistId: string;
  serviceId: string | null;
  scheduledTime: Date | null;
  locationType: "STYLIST_BASE" | "CUSTOMER_HOME";
  locationAddress: string;
  notes: string;
}
```

---

## Brand Colors (From Theme System)

Use new Tailwind classes:
- Primary buttons: `bg-primary text-text-inverse`
- Cards: `bg-surface shadow-card rounded-card`
- Accents: `text-accent` for highlights
- Success: `text-tertiary` for confirmations

---

## Mock Data Strategy

For Week 3 development:
1. Use real API endpoints (already exist)
2. Seed database with test stylists
3. All slots show as available (mock availability)
4. Payment uses existing wallet balance

---

## Success Criteria

### F2.1: Stylist Discovery ✅
- [x] Grid/list view of stylists
- [x] Search by service category
- [x] Location-based filtering
- [x] Pagination

### F2.2: Stylist Profile ✅
- [x] Avatar, name, bio display
- [x] Services list with prices
- [x] "Book Now" CTA

### F2.3: Service Selection ✅
- [x] Service cards with price/duration
- [x] Single selection
- [x] Dynamic total calculation

### F2.4: Date & Time Picker ✅
- [x] Calendar date selection
- [x] Time slot selection
- [x] Mock availability (all future slots)

### F2.5: Location Selection ✅
- [x] Stylist base vs customer home toggle
- [x] Address input for customer home
- [x] Travel fee preview

### F2.6: Booking Summary ✅
- [x] Full price breakdown
- [x] Edit buttons for each section
- [x] Wallet balance check

### F2.7: Escrow Payment ✅
- [x] USDC approval step
- [x] Lock funds in escrow
- [x] Transaction confirmation

### F2.8: Status Tracking ✅
- [x] My Bookings list
- [x] Status badges
- [x] Booking details view

### F2.9: Cancellation ✅
- [x] Cancel button (when applicable)
- [x] Refund preview
- [x] Confirmation dialog

---

## Testing Checklist

- [x] Build passes (`npm run build`)
- [x] All pages render without errors
- [x] API calls work with test data
- [x] Multi-step flow completes
- [x] Payment mock works
- [x] Responsive on mobile

---

## Files Implemented

### Components Created

**`apps/web/components/stylists/`**
- `stylist-card.tsx` - Grid card with avatar, rating, services preview
- `stylist-grid.tsx` - Responsive grid with loading skeletons
- `category-filter.tsx` - Service category dropdown
- `service-card.tsx` - Service with price and duration
- `availability-calendar.tsx` - Weekly availability display
- `portfolio-gallery.tsx` - Image gallery with lightbox

**`apps/web/components/booking/`**
- `booking-dialog.tsx` - Multi-step dialog (7 steps)
- `service-step.tsx` - Service selection with add-ons
- `datetime-picker.tsx` - Calendar + time slots
- `location-step.tsx` - Location type toggle
- `summary-step.tsx` - Price breakdown
- `payment-step.tsx` - USDC payment flow

**`apps/web/components/bookings/`**
- `booking-list.tsx` - List with empty states
- `booking-card.tsx` - Booking item card
- `booking-details.tsx` - Full booking info
- `status-badge.tsx` - Color-coded status
- `cancel-dialog.tsx` - Cancellation with refund preview

### Pages Created

- `apps/web/app/stylists/page.tsx` - Stylist discovery
- `apps/web/app/stylists/[id]/page.tsx` - Stylist profile
- `apps/web/app/bookings/page.tsx` - My Bookings
- `apps/web/app/bookings/[id]/page.tsx` - Booking details

### API Layer

- `apps/web/lib/stylist-client.ts` - Stylist API client
- `apps/web/lib/booking-client.ts` - Booking API client
- `apps/web/hooks/use-stylists.ts` - React Query hooks
- `apps/web/hooks/use-bookings.ts` - React Query hooks + mutations
