# Milestone 3: Stylist Can Service - Implementation Plan

**Target Duration**: Weeks 5-6 of V1.0
**Features**: F3.1 - F3.7 (7 features)
**Goal**: Enable stylists to manage their business, approve bookings, and complete services
**Status**: In Progress

---

## Overview

Milestone 3 focuses on the **stylist-side experience**. While M2 enabled customers to book, M3 enables stylists to:
- View and manage incoming booking requests
- Approve/decline bookings
- Manage their service catalog (CRUD)
- Set availability schedules
- Update their professional profile
- Track earnings
- Complete bookings and receive payment

---

## Week 5: Dashboard + Requests + Services (F3.1-F3.4)

### F3.1: Stylist Dashboard Overview
**Purpose**: Central hub showing business metrics at a glance

**Components**:
- `app/dashboard/page.tsx` — Main dashboard page
- `components/dashboard/stats-cards.tsx` — Earnings, pending requests, upcoming bookings
- `components/dashboard/upcoming-bookings.tsx` — Next 7 days preview
- `components/dashboard/pending-requests-preview.tsx` — Quick action queue

**Data Requirements**:
- Pending booking count
- Upcoming bookings (next 7 days)
- Total earnings (lifetime + this month)
- Completion rate percentage

### F3.2: Booking Requests Queue
**Purpose**: Review and approve/decline incoming booking requests

**Components**:
- `app/dashboard/requests/page.tsx` — Full requests queue
- `components/dashboard/request-card.tsx` — Request with customer info + actions
- `components/dashboard/request-details-dialog.tsx` — Full details view
- `components/dashboard/approve-dialog.tsx` — Confirm approval
- `components/dashboard/decline-dialog.tsx` — Decline with reason

**Backend**: Uses existing endpoints:
- `POST /api/bookings/:id/approve`
- `POST /api/bookings/:id/decline`

### F3.3: Services Management (CRUD)
**Purpose**: Manage service catalog with full CRUD operations

**Components**:
- `app/dashboard/services/page.tsx` — Services list page
- `components/dashboard/service-list.tsx` — List with actions
- `components/dashboard/service-form.tsx` — Create/edit form
- `components/dashboard/service-dialog.tsx` — Modal wrapper

**New Backend APIs**:
- `POST /api/stylists/services` — Create service
- `PUT /api/stylists/services/:id` — Update service
- `DELETE /api/stylists/services/:id` — Delete service

### F3.4: Availability Calendar
**Purpose**: Set recurring weekly schedule + block exceptions

**Components**:
- `app/dashboard/availability/page.tsx` — Calendar page
- `components/dashboard/weekly-schedule.tsx` — Recurring availability grid
- `components/dashboard/time-block-editor.tsx` — Set hours per day
- `components/dashboard/exception-manager.tsx` — Block specific dates

**New Backend APIs**:
- `GET /api/stylists/availability` — Get schedule
- `PUT /api/stylists/availability` — Update recurring schedule
- `POST /api/stylists/availability/exceptions` — Add date exception

---

## Week 6: Profile + Earnings + Completion (F3.5-F3.7)

### F3.5: Profile Management
**Purpose**: Professional profile for customer discovery

**Components**:
- `app/dashboard/profile/page.tsx` — Profile editor
- `components/dashboard/profile-form.tsx` — Bio, location, operating mode
- `components/dashboard/portfolio-upload.tsx` — Image gallery manager
- `components/dashboard/profile-preview.tsx` — Customer view preview

**New Backend APIs**:
- `GET /api/stylists/profile` — Get own profile
- `PUT /api/stylists/profile` — Update profile
- `POST /api/stylists/profile/portfolio` — Upload image

### F3.6: Earnings Dashboard
**Purpose**: Financial visibility and payout tracking

**Components**:
- `app/dashboard/earnings/page.tsx` — Earnings overview
- `components/dashboard/earnings-summary.tsx` — Total, this month, pending
- `components/dashboard/earnings-chart.tsx` — Weekly/monthly trend
- `components/dashboard/payout-history.tsx` — List of past payouts

**New Backend APIs**:
- `GET /api/stylists/earnings` — Aggregated earnings data
- `GET /api/stylists/earnings/history` — Payout history

### F3.7: Booking Completion Flow
**Purpose**: Mark bookings complete and trigger payment release

**Components**:
- `components/dashboard/active-booking-card.tsx` — In-progress booking with actions
- `components/dashboard/start-service-dialog.tsx` — Confirm start
- `components/dashboard/complete-service-dialog.tsx` — Confirm completion
- `components/dashboard/completion-success.tsx` — Payment released confirmation

**Backend**: Uses existing endpoints:
- `POST /api/bookings/:id/start`
- `POST /api/bookings/:id/complete`

---

## Success Criteria

### F3.1: Stylist Dashboard
- [ ] Dashboard shows pending request count
- [ ] Dashboard shows upcoming bookings (7 days)
- [ ] Dashboard shows earnings summary (total + this month)

### F3.2: Booking Requests
- [ ] Stylist can view pending booking requests
- [ ] Stylist can approve booking → moves to PENDING_PAYMENT
- [ ] Stylist can decline booking with reason → moves to DECLINED

### F3.3: Services Management
- [ ] Stylist can create new service
- [ ] Stylist can edit existing service
- [ ] Stylist can delete service
- [ ] Stylist can toggle service active/inactive

### F3.4: Availability Calendar
- [ ] Stylist can set weekly recurring hours
- [ ] Stylist can block specific dates
- [ ] Calendar shows visual schedule grid

### F3.5: Profile Management
- [ ] Stylist can update bio
- [ ] Stylist can set operating mode
- [ ] Stylist can upload portfolio images
- [ ] Stylist can preview customer view

### F3.6: Earnings Dashboard
- [ ] Shows total lifetime earnings
- [ ] Shows this month earnings
- [ ] Shows pending earnings (in escrow)
- [ ] Shows payout history

### F3.7: Booking Completion
- [ ] Stylist can mark booking as "Started"
- [ ] Stylist can mark booking as "Completed"
- [ ] Completion triggers escrow release
- [ ] Success confirmation shows payout amount

---

## Testing Checklist

- [ ] Build passes (`npm run build`)
- [ ] All pages render without errors
- [ ] API calls work with test data
- [ ] Role-based access enforced (stylist only)
- [ ] Forms validate correctly
- [ ] Responsive on mobile
