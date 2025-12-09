# 04 — Services & Categories Specification

A complete, structured, and extensible service taxonomy for the Vlossom booking, scheduling, matching, and pricing engines.

---

## 🌺 1. Purpose of This Document

This document defines the official service taxonomy for Vlossom:

    service categories

    service subcategories

    add-ons

    base durations

    stylist-defined durations

    pricing logic

    salon amenity compatibility

    travel & special event layers

    future expansion categories

This file is referenced by:

    the booking flow

    stylist setup flow

    system scheduling logic

    service duration validator

    chair + property matching engine

    pricing soft ranges engine

    UX service catalog

    search filters

    backend schemas

    future smart contract hooks

This is a living but foundational system-wide document.

---

## 🌸 2. Service Categorization Philosophy

We adopt a modular service architecture:

    Categories = broad service families (Braids, Locs, Natural Hair Treatments, etc.)

    Subcategories = specific services within each category

    Add-ons = modular optional extras

    Stylist Durations = the stylist’s self-defined time for performing a specific service

    System Minimum/Maximum Duration Bounds = global limits for each service

    Amenity Requirements = salon infrastructure required to perform each service

    Mobile Eligibility = whether the service can be done at home or needs a salon

    Cross-Border / Travel Eligibility (future)

This modular structure ensures:

    scalability

    operational reliability

    scheduling accuracy

    fair pricing

    professional standards

    consistent user experience

---

## 🌍 3. Core Natural Hair Service Categories

This is the primary Vlossom catalog, focusing on natural hair care.

Each category contains:

    essential subtypes

    canonical add-ons

    stylist specialization parameters

    base duration ranges

    salon amenity requirements

---

## 🌼 3.1 Braids (Protective Styles)

Subcategories

    Knotless braids

    Box braids

    Tribal braids

    Goddess braids

    Cornrows (straight back)

    Feed-in braids

    Stitch braids

    Fulani braids

    Braids with beads

    Braids with accessories

    Micro braids

Add-ons

    Hair extensions (X-Pression, Darling, etc.)

    Length upgrade

    Thickness upgrade

    Beads / accessories

    Wash + Detangle

    Blow-out

    Hair trimming

    Color extensions

Amenity Requirements

    Chair

    Shampoo basin (if wash add-on selected)

    Good lighting

    Power socket (for blow-out)

Mobile Eligibility

Most braids are mobile-eligible except those requiring wash basins unless the stylist substitutes with portable equipment.

---

## 🌼 3.2 Locs (Starter + Maintenance)

Subcategories

    Starter locs (coils)

    Starter locs (twists)

    Comb coil retwist

    Palm roll retwist

    Interlocking maintenance

    Instant locs

    Loc repair

    Loc grooming

    Loc styling (updos, twists, etc.)

Add-ons

    Deep wash

    Deep conditioning

    Hot oil treatment

    Loc detox

    Scalp treatment

    Crocheting for locs (added as per your note)

    Loc extensions

    Styling add-ons

    Drying (hood dryer)

Amenity Requirements

    Shampoo basin

    Dryer

    Chair

    Towels

    For crocheting: comfortable seating + LED desk light recommended

Mobile Eligibility

Some services like detox, deep wash, loc extensions generally require salon amenities.

---

## 🌼 3.3 Natural Hair Treatments & Styling

Subcategories

    Wash + Blow-out

    Silk press

    Curl definition

    Twist-out

    Bantu knots

    Natural updo

    Protective styling (non-braids)

    Hot oil treatment

    Deep conditioning

    Protein treatment

Add-ons

    Heat protectant

    Hair trimming

    Extra detangling

    Nourishing mask

    Scalp massage

Amenity Requirements

    Basin

    Hair dryer

    Straightener/blow-dryer

Mobile Eligibility

Limited — depends heavily on stylist’s equipment.

---

## 🌼 3.4 Children’s Natural Hair Care

Subcategories

    Kids braids

    Kids cornrows

    Kids twists

    Kids natural treatment

    Kids loc maintenance

Add-ons

    Beads

    Gentle detangling

    Hydration treatment

    Styling gel upgrades

Amenity Requirements

    Child-friendly space

    Chair booster (if available)

Mobile Eligibility

High — mostly mobile-friendly.

---

## 🌼 3.5 Wig Services

Subcategories

    Wig installation

    Wig customization

    Wig revamp + wash

    Bleaching knots

    Tweezing

    Styling (curls, straightening)

Add-ons

    Lace tinting

    Baby hairs

    Elastic band install

    Wash add-on

    Hot comb finish

Amenity Requirements

    Power socket

    Good lighting

    Flat iron / hot comb

Mobile Eligibility

High.

---

## 🌼 3.6 Male Grooming (Full Modular Breakdown)

Subcategories

    Head wash

    Haircut

    Beard trim

    Beard shaping

    Beard treatment

    Haircut + Beard trim

    Haircut + Beard treatment

    Wash + Haircut + Beard

    Beard treatment + beard trim

    Male loc maintenance

Add-ons

    Hot towel

    Line-up precision

    Color touch-up

    Scalp treatment

Amenity Requirements

    Clipper equipment

    Barber chair recommended

    Basin (if wash selected)

Mobile Eligibility

Very high.

---

## 🌼 3.7 Special Events (High-Priority Category)

(Important category from recent discussion)

Subcategories

    Bridal styling

    Bridal party styling

    Photoshoots

    Corporate events

    TV/Media productions

    Personal glam squads

    Travel events

    Multi-day event packages

Add-ons

    Extended hours

    Early morning call-outs

    Full-day rates

    Travel fees

    Assistant stylist fees

Special Handling

    Always requires stylist approval

    Triggers custom pricing mode

    Supports multi-day schedule blocks

---

## 🌺 4. Service Add-Ons (Global Add-On Library)

This is the formalized service_addons table you noticed missing earlier.
Here it is in full.

Add-on Types

    Wash

    Deep conditioning

    Hair extensions

    Beads

    Accessories

    Blow-out

    Detangling

    Heat styling

    Treatments (protein, oil, scalp)

    Wig prep

    Loc crocheting

    Loc detox

    Early morning fee

    Late-night fee

    Travel fee

    Child surcharge

    Premium salon upgrade

    Assistant fee

    Extra length/volume

This library is modular and loaded via database + admin console.

---

## 🌺 5. Duration Specification Logic

Every service has:

## ✔ System Minimum Duration

    (e.g., loc retwist cannot be below 45 min)

## ✔ System Maximum Duration

    (e.g., medium knotless braids cannot exceed 8 hours)

## ✔ Stylist-Defined Duration

    The stylist sets how long they personally take.

## ✔ Duration Locked During Active Service

They cannot change duration if it would violate:

    upcoming bookings

    customer expectations

    salon chair reservations

## ✔ Time Performance Score (TPS)

Duration feeds directly into:

    punctuality

    professional score

    ranking

    future incentives

---

## 🌸 6. Salon Amenity Compatibility Matrix

Every service includes compatibility attributes, such as:

requires_basin: true/false  
requires_dryer: true/false  
requires_power: true/false  
requires_child_space: true/false  
requires_lighting: true/false  
requires_private_room: true/false  

This enables:

    chair matching

    salon selection

    travel eligibility

    mobile restrictions

    property owner filtering

    “Not suitable for this location” logic

This is a cornerstone of Vlossom’s scheduling engine.

---

## 🌼 7. Mobile vs Fixed vs Travel Eligibility

Mobile-Friendly Services

    braids

    wigs

    kids services

    basic male grooming

Requires Salon Amenities

    silk press

    loc detox

    wig revamp (wash)

    some treatments

    starter locs (varies)

Travel-Eligible Services (Phase 3)

    bridal

    photoshoots

    multi-day events

These rules inform:

    travel mode logic

    pricing

    scheduling

    special event handling

---

## 🌺 8. Pricing Logic & Soft Ranges

Vlossom provides:

    soft guidance

    dynamic industry averages

    baseline ranges

    premium multipliers

    budget tags

Stylists can:

    set custom pricing

    exceed standard ranges

    go premium

    price below-market
    (systems label it: “Budget,” “Standard,” “Premium,” “Luxury.”)

Property owners

    set base chair fees

    add surge pricing

    add premium multipliers

This creates a transparent, market-driven, but flexible pricing ecosystem.

---

## 🌸 9. Future Expansion Categories

We reserve category IDs for future verticals:

    Bridal (international tier)

    Photoshoot / Film Crew

    Travel Packages

    Group Bookings

    Corporate bookings

    Glam Squad Teams

    MUA (makeup), Beauty

    Nails

    Barber extension

    Wellness add-ons

    Hair education classes

    Masterclasses

These are not active in MVP but architecturally accounted for.

---

## 🌿 10. Complete Category & Add-On Data Model Summary

Entities

    services_categories

    services_subcategories

    service_addons

    service_duration_ranges

    stylist_service_settings

    amenity_requirements

    mobile_eligibility_rules

    travel_eligibility_rules

    special_event_rules

This becomes the foundation for:

    Database Schema (Document 06)

    Booking Engine (Document 07)

    Scheduling Engine (Document 11)

    Chair Marketplace (Document 12)

    Pricing Engine (Document 15)

---

## 🌺 11. Final Summary

This Services & Categories Specification defines:

    all service types

    all modular subtypes

    all add-ons

    all equipment requirements

    all travel rules

    all duration rules

    all pricing rules

    all future expansion placeholders

It ensures:

    scalable categorization

    stylist flexibility

    customer clarity

    fair market-driven pricing

    precise scheduling

    reliable chair matching

    strong reputation scoring

    compatibility with cross-border expansion

    deep integration with the DeFi and liquidity layer

This is now the master blueprint of the entire Vlossom service ecosystem.




































