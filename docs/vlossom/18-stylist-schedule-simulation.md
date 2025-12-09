# 18 — Stylist Schedule Simulation

Travel-Time Engine, Conflict Detection, Calendar Logic & Real-Time Availability

--- 

## 1. Purpose of This Document

This document formalizes how Vlossom:

    computes stylist availability

    blocks travel time

    prevents booking conflicts

    simulates multi-day schedules

    factors chair availability

    accounts for property rules

    produces accurate booking windows

    powers TPS (Time Performance Score)

    manages special events & cross-border bookings

It is the backend logic model that powers:

    Booking flow (Doc 07)

    Frontend calendar UI (Doc 15)

    Smart contract booking state (Doc 13)

    Reputation/TPS scoring (Doc 08)

    Travel & Cross-Border logic (Doc 19)

    Pricing Engine for soft ranges (Doc 20)

The stylist schedule engine is the glue between users, locations, chairs, time windows, tasks, and travel.

---

## 2. Philosophy of Schedule Simulation

Our goals:

### 2.1 Precision without complexity for users

Stylists shouldn’t manually calculate:

    travel time

    service durations

    required breaks

    chair availability

    buffer time

The system does it automatically.

### 2.2 Realistic availability, not optimistic

If travel is impossible → booking slot removed.
If stylist is tight on time → system warns them.

### 2.3 Mobility is first-class

Mobile stylists, hybrid stylists, and premium-event stylists all must be supported.

### 2.4 Multi-day events are supported from MVP

    Weddings
    Photoshoots
    Tours
    Corporate events
    Back-to-back bookings

### 2.5 Efficiency for stylists

The calendar must help stylists make more money, not restrict them.

---

## 3. Core Concepts

The schedule simulation engine organizes the stylist’s time using three key constructs:

### 3.1 Service Blocks

Every booking produces a service block:

    start time

    end time

    buffer

    service duration

    add-on duration

### 3.2 Travel Blocks

If the location for the next or previous booking is different:

    travel time is computed

    added as a block between service blocks

    cannot overlap with any service

Travel block inputs:

    map API

    stylist’s preferred travel modes

    distance

    peak traffic multiplier

    cross-city/cross-border travel mode (Doc 19)

### 3.3 Chair Blocks

If stylist uses a property:

    chair availability must match the time window

    chair amenity flags must match required service type

    property approval rules must be satisfied

---

## 4. Input Variables

The engine needs:

### 4.1 Stylist-side data

    base location (if fixed stylist)

    mobility preference (mobile/hybrid/fixed)

    travel radius

    max travel time

    unavailable blocks (manually set)

    weekly availability template

    exception dates

    service catalog (with durations/add-ons)

    stylist business hours

### 4.2 Booking-side data

    requested time

    location

    service duration

    add-ons

    travel distance

    chair requirements

    event type (normal / special / multi-day)

### 4.3 Property-side data

    chair availability

    amenity compatibility

    approval rules

    blocklist logic

---

## 5. The Five-Step Availability Computation Engine

When a customer opens a stylist profile or selects a date → the system runs a five-step algorithm:

### Step 1 — Generate Raw Slots (Based on Stylist Availability)

Take stylist’s availability calendar:

    Weekly recurring availability

    Overrides (blocked days, holidays, etc.)

    Manually blocked hours

    System-blocked hours (existing confirmed bookings)

Output: raw free windows (placeholder intervals stylist might work).

### Step 2 — Overlay Service Durations

Convert customer request into:

    base duration

    add-on duration

    prep time (if applicable)

    teardown time

Compute:
    required_service_time = base + addons + buffer

Eliminate raw windows smaller than required window.

### Step 3 — Insert Travel Blocks

For each potential slot:

Check:

    Previous booking

        If location differs, compute travel time.

        Insert travel block before service.

        Confirm it fits.

    Next booking

        Compute travel time needed after service.

        Ensure the stylist can reach next appointment.

Rules:

    If travel window overlaps → slot is removed.

    If travel > stylist max travel time → slot removed.

    If travel requires cross-city → slot removed unless stylist has cross-city enabled.

    If travel requires flight → handled by Doc 19 logic (auto-reject or flag special booking scenario).

Result: only feasible slots remain.

---

## Step 4 — Chair Availability Check

If customer selected a property:

    Fetch available chairs at that property.

    Match chairs based on:

        amenity compatibility

        rental mode (per booking vs fixed-term)

    Ensure no overlapping:

        ongoing rental

        existing stylist bookings

        maintenance blocks

If no chair matches → time slot removed.

---

## Step 5 — Property Approval Rules (If Conditional)

If property uses “Hybrid Approval” mode:

Check:

    stylist reputation

    TPS score

    banned services

    banned stylist

time-of-day restrictions

If stylist fails a rule → slot removed.

Output: final canonical availability.

---

## 6. Conflict Detection System

Stylists must never be:

    double-booked

    over-travelled

    rushed

    placed in physically impossible itineraries

### 6.1 Conflict Types

Exact overlap

Partial overlap

Travel overlap

Chair conflict

Property rule violation

Insufficient buffer

Special event override

Late-night/curfew mismatch

### 6.2 Resolution Strategy

Conflict resolutions include:

    automatic removal of slot

    stylist alerted via dashboard

    “Suggest alternative time” system (future)

    event flagged for manual approval if borderline case

---

## 7. Time Performance Score (TPS) Integration

TPS is based on:

    arrival time accuracy

    service running beyond expected duration

    frequent rescheduling

    last-minute cancellations

The schedule simulation engine feeds TPS:

    when travel is consistently miscalculated

    when stylist compresses bookings too tightly

    when stylist blocks last-minute

TPS becomes part of:

    reputation system (Doc 08)

    property approval thresholds

    pricing/soft-range adjustments (Doc 20)

---

## 8. Special Multi-Day Event Simulation

For weddings/photoshoots/etc:

### 8.1 Special request is created

Includes:

    event start

    event end

    prep day requirements

    location(s)

### 8.2 System blocks entire required windows
### 8.3 Travel sequences pre-computed
### 8.4 Stylist asked to propose quote

(This integrates with Doc 07 logic.)

### 8.5 Once confirmed

The system blocks:

    prep blocks

    travel blocks

    event blocks

    buffer windows around the event

Stylists cannot double-book around a multi-day event unless physically feasible.

---

## 9. Cross-Border Travel Time Simulation (Hooks into Doc 19)

If stylist permits cross-border jobs:

System computes:

    airport travel time

    flight duration

    customs buffer

    hotel check-in buffer

    location-to-venue travel

In Doc 19 we define:

    flight-class preferences (economy/business)

    max travel hours/day

    stylist-set travel preference parameters

This module simply needs the computed travel blocks from Doc 19.

---

## 10. Pseudo-Algorithm for Availability Engine

function computeAvailability(stylist, request) {
  
  rawSlots = stylist.getAvailabilityWindows();

  viableSlots = [];

  for slot in rawSlots {

    serviceWindow = slot.fit(request.duration);

    if (!serviceWindow) continue;

    travelBefore = computeTravel(stylist.prevBooking, slot.start);
    travelAfter  = computeTravel(slot.end, stylist.nextBooking);

    if (!fits(travelBefore, slot) || !fits(travelAfter, rawSlots)) continue;

    if (request.usesProperty) {
      if (!propertyHasCompatibleChair(request.propertyId, serviceWindow)) continue;
      if (!propertyApprovalRulesPass(stylist, request)) continue;
    }

    viableSlots.push(serviceWindow);
  }

  return viableSlots;
}

---

## 11. UX Integration (Document 15 Link)

### In Stylist Calendar UI:

    travel blocks appear in grey

    service blocks in rose

    chair blocks in cream

    maintenance blocks in charcoal

    conflict blocks in red

### In Customer Booking UI:

only feasible slots shown

### In Property Owner UI:

    show stylist-compatibility grid

    warnings for amenity mismatches

    show chair availability conflict overlays

### In Notifications System:

    “New conflict detected: overlapping appointment”

    “Travel time exceeds threshold — remove slot?”

---

## 12. Edge Cases & Failure Modes

### 12.1 Travel block too long

Slot auto-removed.

### 12.2 Chair becomes unavailable after stylist accepted

Customer receives update → alternative options offered.

### 12.3 Cross-border flight missing duration

Fallback to stylist-defined “max travel day” estimate.

### 12.4 Multi-location events overlapping

Stylist receives manual validation request.

### 12.5 Stylist tries forced override

System alerts: “This time is physically impossible.”

---

## 13. Future Extensions

### 13.1 AI Travel Prediction

Predict traffic from historical patterns.

### 13.2 AI Suggest Schedule Optimization

Suggests:

    best time windows

    how to avoid long travel

    better chair choices

### 13.3 Shared Assistant Scheduling

If stylist uses assistants, system synchronizes their calendars.

### 13.4 Multi-Stylist Events

Team events (bridal party prep).

---

## 14. Summary

The Stylist Schedule Simulation module:

    ensures accurate, credible availability

    prevents unrealistic itineraries

    seamlessly integrates travel, chair, and approval logic

    reinforces trust and professionalism

    directly supports pricing, reputation, and booking flows

    prepares Vlossom for large-scale expansion, multi-day events, and cross-border experiences

This document completes the time & logistics foundation needed for Vlossom’s intelligent booking engine.































































































