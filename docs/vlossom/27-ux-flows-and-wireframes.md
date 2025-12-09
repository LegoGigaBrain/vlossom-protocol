# 27 — UX Flows & Wireframes

Screen-Level Blueprints for Vlossom’s End-to-End User Experience

---

## 1. Purpose of This Document

This document bridges:

    conceptual UX (Document 15)
    
    with

    visual UI implementation (Figma / Illustrator → React components).

It defines:

    screen layouts

    navigation structure

    screen-to-screen flow charts

    wireframe descriptions

    conditional states

    modal interactions

    reusable UI patterns

    role-based differences (Customer / Stylist / Owner / LP / Admin)

This is NOT the final UI design.
This is the canonical wireframe specification from which all final designs will be built.

Every component referenced here must map to Document 16 — UI Components & Design System.

---

## 2. Global Navigation & Layout

Bottom navigation (all users):

    Home

    Bookings

    Wallet

    Profile

    Notifications

Consistent UI anchors:

    top app bar (contextual title + back arrow)

    bottom nav (persistent)

    floating action buttons (FABs) where appropriate

    sheet modals for multi-step interactions

    slide-up drawers for financial flows

---

## 3. Screen Flow Maps

Below are the canonical flows, represented as step-based diagrams and corresponding wireframe descriptions.

---

## 4. HOME SCREEN FLOW (Customer)

### 4.1 Home (Customer) — Wireframe Description

Header:

    Location indicator

    Search bar

    Promo carousel (optional)

Sections:

    “Recommended Stylists” (horizontal cards)

    “Nearby Salons” (grid or horizontal)

    “Popular Categories” (icons)

    “Continue Your Booking” (if mid-flow)

    “Special Events” entry point

    “Trending Styles” (future social component)

Footer nav: persistent.

User Actions:

    tap stylist → stylist profile

    tap service → service category

    tap salon → salon profile

    tap category → list view

    tap search → full-screen search

---

## 5. SEARCH & DISCOVERY FLOW

### 5.1 Search Screen

Wireframe elements:

    search input (full-width)

    filter button

    categories (chips)

    dynamic results list

### 5.2 Filter Modal

Filters:

    price range (slider)

    rating (stars)

    availability date/time

    travel radius

    mobile / fixed / hybrid

    amenities (chair, salon)

    stylist accreditation (future)

All filters produce real-time updates.

---

## 6. STYLIST PROFILE FLOW

### 6.1 Stylist Profile (Customer View)

Layout:

    Header:

        stylist photo

        rating

        location

        “Follow” button

Sections:

    Portfolio gallery

    Service list (grouped by categories)

    About stylist

    Reviews

    Travel settings (range, city)

    Preferred salons (if any)

CTA: “Book Appointment”

Wireframe: clean, editorial, card-based sections. 

---

## 7. SERVICE SELECTION FLOW

### 7.1 Service Details Screen

Components:

    service name

    base price

    duration estimate

    soft price band indicator (below / avg / premium)

    add-ons list (each add-on = card with price + duration)

    disclaimers (e.g., “Hair not included”)

CTA:
“Continue (Calculate Quote)”

---

## 8. LOCATION & AVAILABILITY FLOW

### 8.1 Location Selection Screen

Options:

    “At my location”

    “At stylist’s salon”

    “Choose different salon”

If “choose salon” → salon selector screen:

    map view + list view

    chair availability indicator

    amenities vis

### 8.2 Date & Time Picker

Wireframe components:

    horizontal date scroll

    time slot grid

    unavailable slots faded

    travel time applied automatically

    chair availability overlaid if needed

---

## 9. BOOKING SUMMARY & PAYMENT FLOW

### 9.1 Booking Summary Screen

Shows:

    service + add-ons

    stylist

    location

    date/time

    total price (fiat primary, USDC secondary)

    wallet balance

    chair fee (if applicable)

    travel fee

    platform fee

Primary CTA: “Book Now”

If insufficient balance →
secondary CTA: “Add Money to Wallet”

### 9.2 Wallet Top-Up Sheet

wireframe:

    input amount

    onramp options

    estimated time

    confirmation button

---

## 10. BOOKING APPROVAL FLOW

### 10.1 Booking Pending Screen

Timeline UI:

    “Awaiting stylist approval”

    “Awaiting property owner approval” (if applicable)

Wireframe: vertical progress indicator.

### 10.2 Notifications

Both stylist + owner receive cards prompting approval.

---

## 11. ACTIVE BOOKING FLOW

### 11.1 Appointment Active Screen

For customer:

    stylist en route (if mobile)

    map tracking (optional MVP)

    appointment start time

    “Message stylist” (future)

For stylist:

    appointment countdown

    checklist

    “Mark as Started” → “Mark as Completed”

---

## 12. COMPLETION & REVIEW FLOW

### 12.1 Completion Screen

Customer sees:

    “Did your appointment go well?”

    rate stylist

    rate salon

    optional tip (P2P)

    leave review

Wireframe: rating stars + text input.

---

## 13. WALLET FLOWS

### 13.1 Wallet Overview Wireframe

Top:

    balance (fiat primary, token secondary)

    currency selector

Actions:

    Add Money (Fund)

    Send

    Receive

    Withdraw

    DeFi (LP mode)

Tabs:

    Overview

    DeFi

    Rewards

    History

    Advanced

Each with corresponding wireframes from Document 15.

---

## 14. DEFI & LP FLOWS

### 14.1 Pools List Screen

Elements:

    VLP card

    community pool cards (locked/unlocked)

    yield

    tier requirements

14.2 Pool Detail Screen

Wireframe:

    pool APY

    staked balance

    earned yield

    stake/unstake buttons

    breakdown of pool sources

---

## 15. PROFILE FLOWS

### 15.1 Profile Home (Unified)

Elements:

    avatar

    name

    role badges (Customer / Stylist / Owner / LP)

    followers / following

    reviews

    social links

    settings
        
### 15.2 Role Dashboards

Customer Dashboard Wireframe:

    Everything in base elemtents +

        Up and coming appoints
        
        Hair routine schedule managemnet

        Hair budget

        Subscription (future)

        etc.

Stylist Dashboard Wireframe:

    Approvals

    Today’s schedule

    Earnings

    Travel settings

    Chair rentals

    Portfolio

    Services management

Property Owner Dashboard Wireframe:

    chair calendar

    rental income

    stylist approvals

    amenities

    rules

---

## 16. NOTIFICATIONS FEED FLOW

### 16.1 Notifications Tab Wireframe

List of cards:

    booking request

    approvals

    reminders

    reviews

    LP yield updates

    referral milestones

Each card has:

    avatar

    title

    body

    timestamp

    CTA

---

## 17. ADMIN PANEL WIREFRAMES (Internal)

### 17.1 Admin Dashboard

Sections:

    total bookings

    active stylists

    property registrations

    dispute queue

    financials

    Paymaster gas levels

17.2 Dispute Resolution UI

    booking metadata

    messages (future)

    proposed settlement distribution

    “Approve resolution”

---

## 18. REUSABLE WIREFRAME COMPONENTS

### 18.1 Cards

    stylist card

    salon card

    booking card

    category card

    pool card

    notification card

### 18.2 Modals

    bottom sheet modal

    confirmation modal

    error modal

    success toast

### 18.3 Lists & Grids

    horizontal scroll

    grid 2-column

    vertical list with dividers

### 18.4 Form Inputs

    dropdown

    chips

    sliders

    date picker

    time selector

Each corresponds to UI tokens in Document 16.

---

## 19. Design Fidelity Levels

Vlossom UI is built in 3 fidelity layers:

### Level 1 — Wireframes (this document)

Grey boxes, structure, spacing, flow logic.

### Level 2 — Mid-Fidelity (Document 16 + early brand tokens)

Adding typography, spacing scale, layout patterns.

### Level 3 — High-Fidelity Brand Design (when brand identity is ready)

Color palette, illustrations, iconography, Vlossom aura, gradients, photography.

This allows brand identity to evolve without blocking UX architecture.

---

## 20. Summary

Document 27 provides:

    canonical UX flow definitions

    visual wireframes for every major screen

    patterns for modals, cards, drawers, forms

    a unified UX layout language

    role-specific dashboards

    wallet & DeFi wireframes

    booking, payments, approvals & social flows

This document is the blueprint for UI/UX designers and Claude-Code frontend generation.









































































