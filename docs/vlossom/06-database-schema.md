# 06 — Vlossom Database Schema

## Scope

This document defines the off-chain relational data model for Vlossom:

    Core tables and relationships

    How off-chain data mirrors on-chain contracts and events

    How we support UX flows: discovery, booking, scheduling, reputation, chair rental, cross-border travel

    How we support analytics, BI, and future DeFi extensions

Assumptions:

    Primary DB: PostgreSQL

    Geospatial: PostGIS

    IDs: uuid for most domain entities, serial/bigserial only for internal logs/config

    Time zone: store timestamps in UTC; convert at the edge

Solidity contracts and on-chain structures are covered in 05-smart-contract-architecture.md.
This file focuses on the off-chain source of truth for UX, operations, and analytics.

---

## 1. Design Principles

Separation of concerns

    Identity / roles

    Location / properties / chairs

    Services & pricing

    Bookings & approvals

    Calendar & time slices

    Payments & on-chain references

    Reputation & reviews

    Notifications & admin

On-chain <→ off-chain mapping

    Every on-chain booking has an off-chain bookings record.

    Every on-chain wallet has an off-chain wallet_accounts record.

    Reputation snapshots can be stored both on-chain (minimal aggregates) and off-chain (rich detail).

Auditability

    Immutable event history tables (status, payments, disputes).

    Soft-delete via deleted_at where useful.

    Row-level created_at / updated_at everywhere.

Extensibility

    New service categories, add-ons, pricing rules, DeFi modules can be added without breaking the core schema.

    Config tables support dynamic “soft ranges” (pricing bands, time bands, etc.).

---

## 2. High-Level Entity Overview

Core domains:

    Identity & Roles

        users

        stylist_profiles

        customer_profiles

        property_owner_profiles

        admin_users

    Locations & Properties

        locations

        properties

        property_chairs

        property_amenities

        stylist_property_memberships

    Services & Categories

        service_categories

        services

        service_addons

        stylist_services

        stylist_service_addons

    Bookings & Scheduling

        bookings

        booking_addons

        booking_status_history

        booking_time_segments (derived)

        stylist_calendar_blocks

        property_chair_reservations

    Payments & Wallets

        wallet_accounts

        payment_intents

        payment_transactions

        payouts

        liquidity_pool_positions (future DeFi)

    Reputation & Reviews

        reviews

        reputation_snapshots

        tps_metrics (time performance)

        behaviour_flags

    Notifications & Admin

        notifications

        admin_audit_logs

        config_kv

    Disputes & Risk

        disputes

        dispute_events

        risk_flags

---

## 3. Identity & Roles Schema

### 3.1 users

Single base identity; roles are attached via profile tables.

CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext UNIQUE NOT NULL,
  phone_number    text,
  password_hash   text,                    -- or external auth only
  auth_provider   text,                    -- 'password','oauth','magic_link', etc
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

---

### 3.2 stylist_profiles

CREATE TABLE stylist_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid UNIQUE NOT NULL REFERENCES users(id),
  display_name          text NOT NULL,
  bio                   text,
  avatar_url            text,
  base_location_id      uuid REFERENCES locations(id),
  is_mobile_enabled     boolean NOT NULL DEFAULT false,
  is_fixed_location     boolean NOT NULL DEFAULT false,
  accepts_special_events boolean NOT NULL DEFAULT false,
  travel_preferences    jsonb,      -- modes, classes, radius, cross-border switches
  accreditation_level   text,       -- 'NONE','VL1','VL2','PARTNER'
  status                text NOT NULL DEFAULT 'PENDING' 
                          CHECK (status IN ('PENDING','ACTIVE','SUSPENDED')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

---

### 3.3 customer_profiles

CREATE TABLE customer_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES users(id),
  display_name    text,
  avatar_url      text,
  preferred_locale text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

---

### 3.4 property_owner_profiles

CREATE TABLE property_owner_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES users(id),
  business_name   text,
  contact_name    text,
  verified        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

---

### 3.5 admin_users

CREATE TABLE admin_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES users(id),
  role            text NOT NULL CHECK (role IN ('SUPPORT','RISK','OPS','SUPERADMIN')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

---

## 4. Locations, Properties & Chairs

### 4.1 locations

Normalized geo reference for stylists, customers (saved locations), and properties.

CREATE TABLE locations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label           text,                         -- "Home", "Salon HQ", etc.
  address_line1   text,
  address_line2   text,
  city            text,
  region          text,
  postal_code     text,
  country_code    char(2) NOT NULL,
  geo_point       geography(Point, 4326),      -- PostGIS
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_locations_geo_point ON locations USING GIST (geo_point);

---

### 4.2 properties

A salon, co-working space, or any venue offering chairs.

CREATE TABLE properties (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                uuid NOT NULL REFERENCES property_owner_profiles(id),
  location_id             uuid NOT NULL REFERENCES locations(id),
  name                    text NOT NULL,
  description             text,
  photo_urls              text[],          -- or separate table
  base_currency           text NOT NULL,   -- 'ZAR','NGN','USD', etc
  status                  text NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','ACTIVE','INACTIVE')),
  min_reputation_required integer,         -- optional soft gate for stylists
  amenities_summary       text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

---

### 4.3 property_chairs

Each rentable seat / station in a property.

CREATE TABLE property_chairs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id             uuid NOT NULL REFERENCES properties(id),
  label                   text,              -- "Chair 1", "Wash Station 2"
  is_active               boolean NOT NULL DEFAULT true,
  base_hourly_rate        numeric(12,2),     -- optional
  base_daily_rate         numeric(12,2),
  base_monthly_rate       numeric(12,2),
  pricing_model           text NOT NULL DEFAULT 'MIXED'
                            CHECK (pricing_model IN ('HOURLY','DAILY','MONTHLY','MIXED')),
  surge_pricing_config    jsonb,             -- optional dynamic rules
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

---

### 4.4 property_amenities

CREATE TABLE property_amenities (
  id            serial PRIMARY KEY,
  property_id   uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  key           text NOT NULL,         -- 'WASH_BASIN','WAITING_AREA','AC','KIDS_FRIENDLY'
  value         text,                  -- optional detail
  UNIQUE(property_id, key)
);

---

### 4.5 stylist_property_memberships

Tracks which stylists have ongoing relationships with which properties (e.g., pre-rented chair).

CREATE TABLE stylist_property_memberships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id          uuid NOT NULL REFERENCES stylist_profiles(id),
  property_id         uuid NOT NULL REFERENCES properties(id),
  chair_id            uuid REFERENCES property_chairs(id),
  membership_type     text NOT NULL
                        CHECK (membership_type IN ('LONG_TERM','DAY_PASS','ON_DEMAND')),
  start_date          date NOT NULL,
  end_date            date,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stylist_id, property_id, chair_id, is_active)
);

---

## 5. Services, Categories & Add-Ons

This aligns with the service taxonomy in 03-services-and-categories.md.

### 5.1 service_categories

Top-level service families and subcategories (locks, braids, treatments, male grooming, special events, etc.).

CREATE TABLE service_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       uuid REFERENCES service_categories(id),
  slug            text UNIQUE NOT NULL,   -- 'locks','braids','male_grooming','special_events'
  name            text NOT NULL,
  description     text,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

---

### 5.2 services

Base services (e.g., “Starter Locs – Coils”, “Wash + Treatment + Retwist”, “Beard Treatment + Trim”).

CREATE TABLE services (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id             uuid NOT NULL REFERENCES service_categories(id),
  slug                    text UNIQUE NOT NULL,
  name                    text NOT NULL,
  description             text,
  default_duration_min    integer NOT NULL,  -- e.g., 120
  min_duration_min        integer NOT NULL,
  max_duration_min        integer NOT NULL,
  is_special_event        boolean NOT NULL DEFAULT false,
  is_male_grooming        boolean NOT NULL DEFAULT false,
  is_active               boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

---

### 5.3 service_addons

Reusable add-ons that can be attached to services (e.g., “Extra Length”, “Treatment Upgrade”, “International Travel”, “Special Event Premium”).

CREATE TABLE service_addons (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    text UNIQUE NOT NULL,
  name                    text NOT NULL,
  description             text,
  default_price_delta     numeric(12,2),
  price_delta_type        text NOT NULL DEFAULT 'FIXED'
                            CHECK (price_delta_type IN ('FIXED','PERCENT')),
  default_duration_delta  integer,            -- in minutes (can be negative/zero/positive)
  is_special_event_only   boolean NOT NULL DEFAULT false,
  is_travel_related       boolean NOT NULL DEFAULT false,
  is_active               boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

---

### 5.4 stylist_services

Stylist-specific configuration for each base service.

CREATE TABLE stylist_services (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id              uuid NOT NULL REFERENCES stylist_profiles(id),
  service_id              uuid NOT NULL REFERENCES services(id),
  custom_name             text,
  base_price              numeric(12,2) NOT NULL,
  currency                text NOT NULL,
  duration_min            integer NOT NULL,
  is_active               boolean NOT NULL DEFAULT true,
  experience_level        text,      -- 'JUNIOR','SENIOR','MASTER' etc.
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(stylist_id, service_id)
);

---

### 5.5 stylist_service_addons

Which add-ons a stylist offers for a given service, with overrides.

CREATE TABLE stylist_service_addons (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_service_id      uuid NOT NULL REFERENCES stylist_services(id) ON DELETE CASCADE,
  addon_id                uuid NOT NULL REFERENCES service_addons(id),
  custom_price_delta      numeric(12,2),
  custom_duration_delta   integer,
  is_active               boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(stylist_service_id, addon_id)
);

---

## 6. Bookings Core

Bookings tie together customer, stylist, service, optional property/chair, time, and price.

### 6.1 bookings

CREATE TABLE bookings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id             uuid NOT NULL REFERENCES customer_profiles(id),
  stylist_id              uuid NOT NULL REFERENCES stylist_profiles(id),
  stylist_service_id      uuid NOT NULL REFERENCES stylist_services(id),
  property_id             uuid REFERENCES properties(id),
  chair_id                uuid REFERENCES property_chairs(id),
  service_location_type   text NOT NULL
                            CHECK (service_location_type IN ('STYLIST_BASE','CUSTOMER_HOME','PROPERTY')),
  requested_start_time    timestamptz NOT NULL,
  estimated_duration_min  integer NOT NULL,
  estimated_end_time      timestamptz GENERATED ALWAYS AS
                            (requested_start_time + make_interval(mins => estimated_duration_min)) STORED,
  status                  text NOT NULL
                            CHECK (status IN (
                              'PENDING_STYLIST_APPROVAL',
                              'PENDING_CUSTOMER_PAYMENT',
                              'CONFIRMED',
                              'IN_PROGRESS',
                              'COMPLETED',
                              'CANCELLED_CUSTOMER',
                              'CANCELLED_STYLIST',
                              'NO_SHOW_CUSTOMER',
                              'NO_SHOW_STYLIST',
                              'DISPUTED'
                            )),
  special_event_flag      boolean NOT NULL DEFAULT false,
  special_event_context   jsonb,   -- occasion, multi-day notes, etc.
  base_price              numeric(12,2) NOT NULL,
  addons_total            numeric(12,2) NOT NULL DEFAULT 0,
  travel_fee              numeric(12,2) NOT NULL DEFAULT 0,
  chair_fee               numeric(12,2) NOT NULL DEFAULT 0,
  platform_fee            numeric(12,2) NOT NULL DEFAULT 0,
  total_price             numeric(12,2) NOT NULL,  -- must equal sum of above as per pricing rules
  currency                text NOT NULL,
  onchain_booking_id      text,                   -- optional reference to contract booking ID
  payment_status          text NOT NULL DEFAULT 'UNPAID'
                            CHECK (payment_status IN ('UNPAID','ESCROW','PAID_OUT','REFUNDED','PARTIAL')),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

---

### 6.2 booking_addons

CREATE TABLE booking_addons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id        uuid NOT NULL REFERENCES service_addons(id),
  name_snapshot   text NOT NULL,
  price_delta     numeric(12,2) NOT NULL,
  duration_delta  integer,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id, addon_id)
);

---

### 6.3 booking_status_history

Event log for booking state transitions.

CREATE TABLE booking_status_history (
  id              bigserial PRIMARY KEY,
  booking_id      uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  previous_status text,
  new_status      text NOT NULL,
  changed_by_user uuid REFERENCES users(id),
  reason          text,
  changed_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_status_history_booking ON booking_status_history(booking_id);

---

## 7. Time, Calendar & Chair Reservations

### 7.1 stylist_calendar_blocks

Stylist-managed blocks (availability or unavailability, including rest days, personal events).

CREATE TABLE stylist_calendar_blocks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id      uuid NOT NULL REFERENCES stylist_profiles(id),
  block_type      text NOT NULL   -- 'UNAVAILABLE','AVAILABLE_OVERRIDE'
                      CHECK (block_type IN ('UNAVAILABLE','AVAILABLE_OVERRIDE')),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stylist_calendar_blocks_time
  ON stylist_calendar_blocks(stylist_id, starts_at, ends_at);

---

### 7.2 property_chair_reservations

Reservations of physical chairs, independent of booking (used for pre-rented seats, long-term rentals).

CREATE TABLE property_chair_reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chair_id        uuid NOT NULL REFERENCES property_chairs(id),
  stylist_id      uuid NOT NULL REFERENCES stylist_profiles(id),
  booking_id      uuid REFERENCES bookings(id),  -- when tied to a specific appointment
  reservation_type text NOT NULL
                     CHECK (reservation_type IN ('BOOKING','LONG_TERM','DAY_PASS')),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE','CANCELLED','EXPIRED')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chair_reservations_window
  ON property_chair_reservations(chair_id, starts_at, ends_at);

---

## 8. Payments, Wallets & Liquidity

### 8.1 wallet_accounts

Mapping between user roles and on-chain AA wallets.

CREATE TABLE wallet_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id),
  wallet_address      text NOT NULL UNIQUE,
  chain_id            integer NOT NULL,
  provider            text,            -- 'zksync_aa','abstract','safe', etc
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

---

### 8.2 payment_intents

Represents off-chain intent to pay, linked to a booking.

CREATE TABLE payment_intents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES bookings(id),
  amount              numeric(12,2) NOT NULL,
  currency            text NOT NULL,
  provider            text NOT NULL,   -- 'ONRAMP','CARD','CRYPTO_DIRECT'
  status              text NOT NULL
                        CHECK (status IN ('PENDING','REQUIRES_ACTION','SUCCEEDED','FAILED','CANCELLED')),
  provider_reference  text,            -- id from onramp / aggregator
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

---

### 8.3 payment_transactions

Granular ledger entries for money movement events (escrow deposit, payout, refund, fees).

CREATE TABLE payment_transactions (
  id                  bigserial PRIMARY KEY,
  booking_id          uuid REFERENCES bookings(id),
  wallet_from         text,
  wallet_to           text,
  amount              numeric(12,2) NOT NULL,
  currency            text NOT NULL,
  transaction_type    text NOT NULL
                        CHECK (transaction_type IN (
                          'ESCROW_DEPOSIT',
                          'ESCROW_RELEASE_STYLIST',
                          'ESCROW_RELEASE_PROPERTY',
                          'ESCROW_RELEASE_PLATFORM',
                          'REFUND_CUSTOMER',
                          'FEE_COLLECTION',
                          'LIQUIDITY_POOL_MOVEMENT'
                        )),
  onchain_tx_hash     text,
  occurred_at         timestamptz NOT NULL DEFAULT now(),
  meta                jsonb
);
CREATE INDEX idx_payment_transactions_booking ON payment_transactions(booking_id);

---

### 8.4 payouts

Aggregated payouts to stylists and property owners (e.g., batched daily).

CREATE TABLE payouts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_type    text NOT NULL CHECK (beneficiary_type IN ('STYLIST','PROPERTY_OWNER')),
  beneficiary_id      uuid NOT NULL,      -- stylist_profiles.id or property_owner_profiles.id
  amount              numeric(12,2) NOT NULL,
  currency            text NOT NULL,
  status              text NOT NULL
                        CHECK (status IN ('PENDING','PROCESSING','PAID','FAILED')),
  payout_wallet       text,
  onchain_tx_hash     text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

---

### 8.5 liquidity_pool_positions (Future DeFi)

Skeleton for Vlossom Liquidity Pool (VLP) tracking of LP positions.

CREATE TABLE liquidity_pool_positions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id),
  wallet_address      text NOT NULL,
  pool_id             text NOT NULL,            -- identify which pool
  staked_amount       numeric(18,6) NOT NULL,
  currency            text NOT NULL,
  status              text NOT NULL
                        CHECK (status IN ('ACTIVE','UNSTAKING','CLOSED')),
  started_at          timestamptz NOT NULL,
  closed_at           timestamptz,
  meta                jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

---

## 9. Reputation, Reviews & Behaviour

### 9.1 reviews

Customer reviews for stylist and property; property owners may also review stylists.

CREATE TABLE reviews (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id              uuid NOT NULL REFERENCES bookings(id) UNIQUE,
  reviewer_user_id        uuid NOT NULL REFERENCES users(id),
  stylist_id              uuid REFERENCES stylist_profiles(id),
  property_id             uuid REFERENCES properties(id),
  rating_overall          integer CHECK (rating_overall BETWEEN 1 AND 5),
  rating_punctuality      integer,
  rating_professionalism  integer,
  rating_cleanliness      integer,
  comment                 text,
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_stylist ON reviews(stylist_id);
CREATE INDEX idx_reviews_property ON reviews(property_id);

### For property-owner-on-stylist reviews, we can either:

    reuse this table with reviewer_user_id = property owner’s user, or

    add a second table.
    For now we keep it unified and distinguish via reviewer_user_id + role.

---

### 9.2 tps_metrics (Time Performance Score)

Aggregates punctuality metrics for stylists and optionally customers.

CREATE TABLE tps_metrics (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id              uuid REFERENCES stylist_profiles(id),
  customer_id             uuid REFERENCES customer_profiles(id),
  period                  text NOT NULL,         -- 'ALL_TIME','LAST_90_DAYS','ROLLING'
  bookings_count          integer NOT NULL DEFAULT 0,
  on_time_ratio           numeric(5,4),          -- 0.0–1.0
  avg_delay_minutes       numeric(6,2),
  severe_late_count       integer NOT NULL DEFAULT 0,
  last_updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stylist_id, period),
  UNIQUE (customer_id, period)
);

---

### 9.3 reputation_snapshots

Periodic reputation snapshots used by matching and incentives engine.

CREATE TABLE reputation_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type            text NOT NULL CHECK (subject_type IN ('STYLIST','PROPERTY','CUSTOMER')),
  subject_id              uuid NOT NULL,
  period                  text NOT NULL,     -- 'ALL_TIME','M_2025_01', etc.
  score_overall           numeric(5,2),
  score_punctuality       numeric(5,2),
  score_quality           numeric(5,2),
  score_reliability       numeric(5,2),
  bookings_count          integer NOT NULL DEFAULT 0,
  disputes_count          integer NOT NULL DEFAULT 0,
  flags_count             integer NOT NULL DEFAULT 0,
  data                    jsonb,            -- extra breakdown, histograms
  computed_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_type, subject_id, period)
);

---

### 9.4 behaviour_flags

Risk and behaviour labels (no-shows, abusive behaviour, etc.).

CREATE TABLE behaviour_flags (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type            text NOT NULL CHECK (subject_type IN ('STYLIST','CUSTOMER','PROPERTY')),
  subject_id              uuid NOT NULL,
  flag_type               text NOT NULL,         -- 'NO_SHOW','ABUSIVE','PAYMENT_ISSUE', etc.
  severity                text NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  source                  text NOT NULL,         -- 'SYSTEM','ADMIN','USER_REPORT'
  description             text,
  created_by_admin_id     uuid REFERENCES admin_users(id),
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_behaviour_flags_subject ON behaviour_flags(subject_type, subject_id);

---

## 10. Notifications & Communication

### 10.1 notifications

Generic notification table for in-app and push communications.

CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  type            text NOT NULL,   -- 'BOOKING_REQUEST','BOOKING_APPROVED','PAYOUT_SENT', etc.
  title           text NOT NULL,
  body            text NOT NULL,
  data            jsonb,
  is_read         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

---

## 11. Admin, Config & Logging

### 11.1 config_kv

Key-value config store for soft rules (pricing bands, time bands, risk thresholds).

CREATE TABLE config_kv (
  key               text PRIMARY KEY,
  value             jsonb NOT NULL,
  description       text,
  updated_by_admin  uuid REFERENCES admin_users(id),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

Examples:

    pricing.soft_ranges

    tps.thresholds

    chair_fee.max_multipliers

---

### 11.2 admin_audit_logs

CREATE TABLE admin_audit_logs (
  id              bigserial PRIMARY KEY,
  admin_id        uuid REFERENCES admin_users(id),
  action_type     text NOT NULL,
  entity_type     text NOT NULL,
  entity_id       text NOT NULL,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_entity ON admin_audit_logs(entity_type, entity_id);

---

## 12. Disputes & Risk Management

### 12.1 disputes

CREATE TABLE disputes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES bookings(id) UNIQUE,
  opened_by_user_id   uuid NOT NULL REFERENCES users(id),
  status              text NOT NULL
                        CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED_CUSTOMER','RESOLVED_STYLIST','RESOLVED_SPLIT','DISMISSED')),
  reason_code         text,                           -- 'QUALITY','NO_SHOW','PAYMENT','OTHER'
  description         text,
  resolution_summary  text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

---

### 12.2 dispute_events

Event log inside each dispute.

CREATE TABLE dispute_events (
  id                  bigserial PRIMARY KEY,
  dispute_id          uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  actor_type          text NOT NULL CHECK (actor_type IN ('CUSTOMER','STYLIST','ADMIN','SYSTEM')),
  actor_user_id       uuid REFERENCES users(id),
  event_type          text NOT NULL,          -- 'MESSAGE','FILE_UPLOAD','STATUS_CHANGE'
  payload             jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispute_events_dispute ON dispute_events(dispute_id);

---

## 13. Notes on Migrations & Indexing

Use explicit, named migrations for each table.

Add indexes for:

    frequent lookups: (stylist_id, requested_start_time), (property_id, geo_point), (status) etc.

    full-text search on service names, property descriptions (later, via tsvector).

Carefully design foreign key cascade behaviour:

    Never CASCADE DELETE on financial or booking data.

    For profiles, prefer soft-delete.

---

## 14. How This Connects to Other Docs

    03-services-and-categories.md → informs service_categories, services, service_addons.

    04-system-architecture-blueprint.md → explains how backend services use this schema.

    05-smart-contract-architecture.md → defines on-chain counterparts for bookings, wallet_accounts, payment_transactions, liquidity_pool_positions.

    07-booking-and-approval-flow.md → describes how statuses evolve in bookings + booking_status_history.

    08-reputation-system-flow.md → describes how reviews, tps_metrics, reputation_snapshots, and behaviour_flags are populated.

This schema is the current v1 foundation.
Future iterations can expand it, but all major concepts we’ve discussed (multi-sided marketplace, chair rentals, travel, special events, reputation, liquidity) have a clear home here.

---

# 06 — Database Schema (v1.1)

Relational Data Model for Vlossom Platform, Wallet, and Reputation

---

## 1. Purpose of This Document

This document defines the relational database schema for the Vlossom platform.

It is used by:

  Backend engineers (service implementation, APIs)

  Data engineers / analytics (reporting, dashboards)

  Claude Code agents (when generating backend / indexer code)

  Product & UX (understanding what is persistently stored)

This v1.1 version extends the original schema with:

  Global wallet support fields & history

  Social link storage for profiles

  External wallet address mapping

  Onramp / off-ramp audit history

It does not change file names or overall numbering in the docs set.

---

## 2. Design Principles

### Single human, multiple roles
One user record can act as customer, stylist, property owner, LP, or any combination.

### Global wallet per user
Each human has one primary Vlossom wallet (AA-based on-chain), with balances and history.

### Immutable booking history
Bookings, financial records, and reviews are append-only; updates are done via new rows, not overwrites where possible.

### On-chain is source of truth for funds, DB for UX
Stablecoin balances and escrow are enforced by contracts; database mirrors them for fast queries and UX.

### Brand & context friendly
Room for hair-type profiles, preferences, and narrative fields without compromising structure.

---

## 3. High-Level Entity Map

Core domains:

  Users & Roles

    users

    user_roles

    user_profiles (optional extra fields / preferences)

  Wallet & Money

    wallets

    wallet_balances

    payment_transactions

    topup_history (NEW v1.1)

    withdraw_history (NEW v1.1)

    external_addresses (NEW v1.1)

  Properties, Chairs, and Spaces

    properties

    chairs

    property_rules

    Amenities

  Bookings & Services

    services

    service_addons

    booking_requests

    booking_items

    booking_status_history

  Reputation, Reviews & Rewards

    reviews

    reputation_snapshots

    reward_points

    referrals

  Social & Following

    social_links (NEW v1.1)

    user_follows

  DeFi / Liquidity (DB reflection of on-chain)

    liquidity_pools

    liquidity_positions

    pool_yield_snapshots

  System & Admin

    config

    audit_logs

Below is the table-level breakdown.

---

## 4. Users & Roles

### 4.1 users

Canonical record for each human.

Columns (key ones):

  id (PK, UUID)

  created_at, updated_at

  email (nullable if phone-only)

  phone (nullable if email-only)

  password_hash (if using local auth; nullable if social-only)

  auth_provider (enum: password, google, apple, phone, wallet)

  status (enum: active, suspended, deleted)

  display_name

  avatar_url

  country_code

  city

  primary_language (e.g. en, xho, etc.)

  wallet_id (FK → wallets.id)

  wallet_preference_currency (NEW v1.1)

    enum: ZAR, NGN, USD, EUR, etc.

    Used to display balances & prices in preferred fiat.

  hair_profile_json (JSON; hair type, porosity, goals – supporting “growth from rest” journeys)

  bio (short text)

## 4.2 user_roles

Allows one person to have multiple roles.

Columns:

  id (PK)

  user_id (FK → users.id)

  role (enum: customer, stylist, property_owner, lp, admin)

  created_at

## 4.3 user_profiles (optional enrichment)

Additional, slower-changing preferences.

Columns:

  id (PK)

  user_id (FK → users.id)

  notifications_enabled (bool)

  marketing_opt_in (bool)

  preferred_booking_radius_km (int)

  preferred_service_categories (JSON array of service IDs)

  time_zone (string)

  extra_preferences_json (JSON)

---

## 5. Wallet & Money

### 5.1 wallets

Each human has one Vlossom wallet (AA on-chain account).

Columns:

  id (PK, UUID)

  user_id (FK → users.id, unique)

  onchain_address (string)

  chain_id (int, EVM chain ID)

  status (enum: active, frozen, closed)

  created_at, updated_at

### 5.2 wallet_balances

Denormalized snapshot for quick display; on-chain is source of truth.

Columns:

id (PK)

  wallet_id (FK → wallets.id)

  token_symbol (e.g. USDC, USDT, VLPTOKEN)

  token_contract_address

  balance (decimal)

  last_synced_at (timestamp)

### 5.3 payment_transactions

Generic ledger of money movements related to bookings, chair rentals, LP, and P2P.

Columns:

  id (PK, UUID)

  created_at

  wallet_id (FK → wallets.id)

  counterparty_wallet_id (nullable, FK)

  booking_id (nullable, FK → booking_requests.id)

  property_id (nullable, FK)

  pool_id (nullable, FK → liquidity_pools.id)

  type (enum:

    booking_payment

    booking_payout

    chair_rental_payment

    chair_rental_payout

    lp_deposit

    lp_withdrawal

    p2p_send

    p2p_receive

    reward_credit

    refund
    )

  direction (enum: debit, credit)

  amount_token (decimal)

  token_symbol

  amount_fiat (decimal, nullable; for reporting)

  fiat_currency (nullable)

  tx_hash (nullable)

  status (enum: pending, confirmed, failed)

### 5.4 topup_history (NEW v1.1)

Audit log of onramp operations (fiat → stablecoin).

Columns:

  id (PK, UUID)

  created_at, updated_at

  wallet_id (FK → wallets.id)

  user_id (FK → users.id)

  provider (string: ramp_network, moonpay, local_bank_partner, etc.)

  provider_reference (string)

  amount_fiat (decimal)

  fiat_currency (string)

  amount_token (decimal)

  token_symbol (string, e.g. USDC)

  status (enum: pending, completed, failed, refunded)

  error_code (nullable, string)

  metadata_json (JSON; device, region, etc.)

### 5.5 withdraw_history (NEW v1.1)

Audit log of offramp operations (stablecoin → fiat).

Columns:

  id (PK, UUID)

  created_at, updated_at

  wallet_id (FK → wallets.id)

  user_id (FK → users.id)

  provider (string)

  provider_reference (string)

  amount_token (decimal)

  token_symbol (string)

  amount_fiat (decimal)

  fiat_currency (string)

  status (enum: pending, completed, failed, refunded)

  error_code (nullable)

  metadata_json (JSON)

### 5.6 external_addresses (NEW v1.1)

Linked external wallets (for “sign in with wallet” and advanced Web3 flows).

Columns:

  id (PK, UUID)

  user_id (FK → users.id)

  chain_id (int)

  address (string)

  label (string; e.g. MetaMask, Ledger, Abstract Global Wallet)

  is_primary (bool)

  created_at, updated_at

---

## 6. Properties, Chairs & Rules

### 6.1 properties

Registered salons / spaces.

Columns:

  id (PK, UUID)

  owner_user_id (FK → users.id)

  name

  description

  country_code

  city

  address_line_1, address_line_2

  latitude, longitude

  photos_json (array of URLs)

  amenities_json (JSON of amenity flags)

  status (enum: active, inactive, pending_review)

  created_at, updated_at

### 6.2 chairs

Individual rentable seats.

Columns:

  id (PK, UUID)

  property_id (FK → properties.id)

  name (e.g. “Braids Chair 1”)

  type (enum: braids, locs, wash_basin, barber, etc.)

  amenities_json (JSON, chair-specific)

  base_rate_hourly (decimal)

  base_rate_daily (decimal)

  base_rate_weekly (decimal)

  base_rate_monthly (decimal)

  soft_range_band (enum: budget, average, premium)

  status (enum: active, inactive)

  created_at, updated_at

### 6.3 property_rules

Config for approvals & blocklists.

Columns:

  id (PK)

  property_id (FK → properties.id, unique)

  requires_owner_approval (bool)

  auto_approve_min_reputation (int)

  auto_approve_min_tps (int)

  blocked_stylists (JSON of user_ids)

  allowed_stylists (JSON of user_ids, optional)

  special_events_allowed (bool)

  created_at, updated_at

---

## 7. Services, Add-ons & Bookings

### 7.1 services

Canonical catalog of service types.

Columns:

  id (PK)

  category (e.g. braids, locs, natural_care, wig_installs, male_grooming, special_events)

  name

  description

  base_duration_minutes

  base_price_hint (optional)

  active (bool)

  metadata_json (JSON)

### 7.2 service_addons

Modular add-ons like wash, treatments, extra length, male grooming modules, etc.

Columns:

  id (PK)

  service_id (FK → services.id, nullable if global)

  name

  description

  duration_delta_minutes

  price_delta_type (enum: flat, percentage, tiered)

  price_delta_value (decimal or JSON, depending on type)

  active (bool)

  metadata_json (JSON: e.g. hair length, thickness tiers)

(This is where male grooming combinations can be built as modular sets.)

### 7.3 booking_requests

Top-level booking record.

Columns:

  id (PK, UUID)

  created_at, updated_at

  customer_user_id (FK → users.id)

  stylist_user_id (FK → users.id)

  property_id (nullable, FK → properties.id)

  chair_id (nullable, FK → chairs.id)

  service_date (date)

  start_time (timestamp)

  end_time_estimated (timestamp)

  location_type (enum: customer_location, stylist_base, property)

  total_price_token (decimal)

  token_symbol

  total_price_fiat (decimal)

  fiat_currency

  pricing_band (enum: budget, average, premium)

  requires_property_approval (bool)

  special_event_flag (bool)

  travel_flag (enum: none, domestic, international)

  status (enum: draft, pending_payment, pending_approvals, confirmed, in_progress, awaiting_confirmation, completed, cancelled, disputed)

  onchain_booking_id (string/hash, nullable until created)

  notes_for_stylist (text)

  notes_internal (text)

### 7.4 booking_items

Line items for services & add-ons within a booking.

Columns:

  id (PK)

  booking_id (FK → booking_requests.id)

  service_id (FK → services.id)

  addon_ids_json (array of addon IDs)

  duration_minutes

  rice_token (decimal)

  price_fiat (decimal)

  metadata_json (JSON)

### 7.5 booking_status_history

Tracks how a booking moved through states.

Columns:

  id (PK)

  booking_id (FK)

  old_status (enum)

  new_status (enum)

  changed_by_user_id (FK → users.id, nullable if system)

  changed_at

  reason (text, optional)

---

## 8. Reputation, Reviews & Rewards
8.1 reviews

Detailed, human-readable reviews.

Columns:

  id (PK, UUID)

  booking_id (FK → booking_requests.id)

  reviewer_user_id (FK → users.id)

  reviewed_user_id (FK → users.id) // stylist, customer, or owner

  reviewed_role (enum: stylist, customer, property_owner)

  rating (int, 1–5)

  comment (text)

  created_at

### 8.2 reputation_snapshots

Aggregate scores.

Columns:

  id (PK)

  user_id (FK → users.id)

  role (enum: stylist, customer, property_owner)

  total_bookings_completed (int)

  total_cancellations (int)

  no_show_count (int)

  average_rating (decimal)

  tps_score (decimal) // time performance

  dispute_count (int)

  last_updated_at

### 8.3 reward_points

Simple points tracking (non-transferable).

Columns:

  id (PK)

  user_id (FK → users.id)

  role (enum: customer, stylist, property_owner, referrer)

  points_balance (int)

  lifetime_points (int)

  tier (enum: none, bronze, silver, gold, platinum)

  last_earned_at

### 8.4 referrals

Who brought whom into the garden.

Columns:

  id (PK)

  referrer_user_id (FK → users.id)

  referred_user_id (FK → users.id)

  referred_role (enum)

  created_at

  attributed_volume_token (decimal)

  attributed_bookings_count (int)

---

## 9. Social & Following

### 9.1 social_links (NEW v1.1)

External social accounts attached to a profile.

Columns:

  id (PK, UUID)

  user_id (FK → users.id)

  platform (enum: instagram, tiktok, x, youtube, whatsapp, other)

  handle (string)

  url (string)

  is_public (bool)

  is_verified (bool)

  created_at, updated_at

### 9.2 user_follows

Basic follower graph for “follow stylist / follow salon”.

Columns:

  id (PK)

  follower_user_id (FK → users.id)

  followed_user_id (FK → users.id)

  created_at

Unique index on (follower_user_id, followed_user_id).

---

## 10. DeFi / Liquidity (DB Reflection)

On-chain contracts are source of truth; DB is a mirror for analytics and UX.

### 10.1 liquidity_pools

Columns:

  id (PK)

  onchain_pool_address

  name

  type (enum: genesis, community)

  creator_user_id (FK → users.id, nullable for genesis)

  status (enum: active, frozen, closed)

  chain_id

  created_at, updated_at

### 10.2 liquidity_positions

Columns:

  id (PK, UUID)

  pool_id (FK → liquidity_pools.id)

  user_id (FK → users.id)

  shares (decimal)

  amount_deposited_token (decimal)

  amount_withdrawn_token (decimal)

  last_updated_at

### 10.3 pool_yield_snapshots

Columns:

  id (PK)

  pool_id (FK)

  timestamp

  tvl_token (decimal)

  estimated_apr (decimal)

  metadata_json (JSON)

---

## 11. System & Admin

### 11.1 config

Key/value store for environment-level settings.

Columns:

  key (PK)

  value (string or JSON)

  updated_at

### 11.2 audit_logs

Tracks sensitive changes and admin activities.

Columns:

  id (PK)

  created_at

  actor_user_id (FK → users.id, nullable if system)

  action (string)

  entity_type (string)

  entity_id (string)

  details_json (JSON)

---

## 12. Hair Health Intelligence Tables (v0.7)

The Hair Health Intelligence system enables personalized care recommendations, ritual scheduling, and stylist context sharing. These tables support the "growth from rest" philosophy by modeling hair care as ongoing wellness, not just transactions.

### 12.1 hair_health_profiles

Core hair profile for personalized care intelligence.

```sql
CREATE TABLE hair_health_profiles (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid UNIQUE NOT NULL REFERENCES users(id),
  profile_version           text NOT NULL DEFAULT '0.7',

  -- Core classification (Andre Walker + extensions)
  texture_class             text CHECK (texture_class IN (
    '1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C','MIXED','UNKNOWN'
  )),
  pattern_family            text CHECK (pattern_family IN (
    'STRAIGHT','WAVY','CURLY','COILY','KINKY','UNKNOWN'
  )),
  strand_thickness          text CHECK (strand_thickness IN ('FINE','MEDIUM','COARSE','UNKNOWN')),
  density_level             text CHECK (density_level IN ('LOW','MEDIUM','HIGH','UNKNOWN')),
  shrinkage_tendency        text CHECK (shrinkage_tendency IN ('MINIMAL','MODERATE','HIGH','EXTREME','UNKNOWN')),

  -- Health metrics
  porosity_level            text CHECK (porosity_level IN ('LOW','MEDIUM','HIGH','UNKNOWN')),
  retention_risk            text CHECK (retention_risk IN ('LOW','MEDIUM','HIGH')),  -- derived from porosity + texture

  -- Sensitivity & tolerance
  detangle_tolerance        text CHECK (detangle_tolerance IN ('LOW','MEDIUM','HIGH')),
  manipulation_tolerance    text CHECK (manipulation_tolerance IN ('LOW','MEDIUM','HIGH')),
  tension_sensitivity       text CHECK (tension_sensitivity IN ('LOW','MEDIUM','HIGH')),
  scalp_sensitivity         text CHECK (scalp_sensitivity IN ('LOW','MEDIUM','HIGH')),

  -- Wash day characteristics
  wash_day_load_factor      text CHECK (wash_day_load_factor IN ('LIGHT','STANDARD','HEAVY')),
  estimated_wash_day_minutes integer CHECK (estimated_wash_day_minutes BETWEEN 30 AND 480),

  -- Routine strategy
  routine_type              text CHECK (routine_type IN (
    'GROWTH','REPAIR','MAINTENANCE','KIDS','PROTECTIVE','TRANSITION','UNKNOWN'
  )),

  -- Learning progress (which concepts user has unlocked)
  learning_nodes_unlocked   text[],  -- e.g., ['POROSITY_BASICS','MOISTURE_PROTEIN_BALANCE']

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at          timestamptz
);

CREATE INDEX idx_hair_health_profiles_user ON hair_health_profiles(user_id);
```

---

### 12.2 hair_rituals

Templates for hair care rituals (wash day, deep condition, etc.).

```sql
CREATE TABLE hair_rituals (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid REFERENCES users(id),  -- NULL for system templates

  ritual_type               text NOT NULL CHECK (ritual_type IN (
    'WASH_DAY_FULL',
    'WASH_DAY_QUICK',
    'DEEP_CONDITION',
    'MOISTURE_REFRESH',
    'PROTEIN_TREATMENT',
    'SCALP_TREATMENT',
    'DETANGLE_SESSION',
    'PROTECTIVE_STYLE_PREP',
    'TAKEDOWN_RECOVERY',
    'TRIM_MAINTENANCE',
    'CUSTOM'
  )),

  name                      text NOT NULL,
  description               text,
  default_duration_minutes  integer NOT NULL,
  load_level                text NOT NULL CHECK (load_level IN ('LOW','MEDIUM','HIGH')),

  -- For educational content linkage
  education_hint_id         text,

  -- Template vs custom
  is_template               boolean NOT NULL DEFAULT false,
  created_by_stylist_id     uuid REFERENCES users(id),  -- if shared by stylist

  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hair_rituals_user ON hair_rituals(user_id);
CREATE INDEX idx_hair_rituals_type ON hair_rituals(ritual_type);
```

---

### 12.3 hair_ritual_steps

Individual steps within a ritual.

```sql
CREATE TABLE hair_ritual_steps (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id                 uuid NOT NULL REFERENCES hair_rituals(id) ON DELETE CASCADE,

  step_order                integer NOT NULL,
  step_type                 text NOT NULL CHECK (step_type IN (
    'PRE_POO',
    'SHAMPOO',
    'CLARIFY',
    'CONDITION',
    'DEEP_CONDITION',
    'PROTEIN_TREATMENT',
    'DETANGLE',
    'RINSE',
    'LEAVE_IN',
    'MOISTURIZE',
    'SEAL',
    'STYLE',
    'DRY',
    'SCALP_MASSAGE',
    'CUSTOM'
  )),

  name                      text,  -- custom step name if type is CUSTOM
  estimated_minutes         integer NOT NULL,
  optional                  boolean NOT NULL DEFAULT false,
  notes                     text,

  created_at                timestamptz NOT NULL DEFAULT now(),

  UNIQUE(ritual_id, step_order)
);

CREATE INDEX idx_hair_ritual_steps_ritual ON hair_ritual_steps(ritual_id);
```

---

### 12.4 hair_calendar_events

Scheduled hair care events (rituals, bookings, prompts).

```sql
CREATE TABLE hair_calendar_events (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL REFERENCES users(id),

  event_category              text NOT NULL CHECK (event_category IN (
    'HAIR_RITUAL',
    'BOOKING_SERVICE',
    'EDUCATION_PROMPT',
    'REST_BUFFER',
    'RECOVERY_WINDOW'
  )),
  event_type                  text NOT NULL,  -- specific ritual/service type

  title                       text NOT NULL,
  description                 text,

  scheduled_start             timestamptz NOT NULL,
  scheduled_end               timestamptz NOT NULL,

  -- Load and recovery
  load_level                  text CHECK (load_level IN ('LOW','MEDIUM','HIGH')),
  requires_rest_buffer        boolean NOT NULL DEFAULT false,
  recommended_rest_hours_after integer,

  -- Status tracking
  status                      text NOT NULL DEFAULT 'PLANNED' CHECK (status IN (
    'PLANNED',
    'DUE',
    'IN_PROGRESS',
    'COMPLETED',
    'SKIPPED',
    'RESCHEDULED'
  )),
  completion_quality          text CHECK (completion_quality IN ('FULL','PARTIAL','RUSHED')),
  completed_at                timestamptz,

  -- Linkages
  linked_ritual_id            uuid REFERENCES hair_rituals(id),
  linked_booking_id           uuid REFERENCES bookings(id),
  linked_education_content_id text,

  -- Generation metadata
  generated_by                text CHECK (generated_by IN ('SYSTEM','USER','STYLIST')),
  recurrence_rule             jsonb,  -- iCal RRULE-like for future expansion

  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hair_calendar_events_user_time ON hair_calendar_events(user_id, scheduled_start);
CREATE INDEX idx_hair_calendar_events_status ON hair_calendar_events(status);
CREATE INDEX idx_hair_calendar_events_booking ON hair_calendar_events(linked_booking_id);
```

---

### 12.5 hair_insights

Generated care recommendations and insights.

```sql
CREATE TABLE hair_insights (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL REFERENCES users(id),

  insight_type                text NOT NULL CHECK (insight_type IN (
    'MOISTURE_NEED',
    'PROTEIN_NEED',
    'REST_RECOMMENDATION',
    'RECOVERY_WINDOW',
    'WASH_DAY_REMINDER',
    'WEATHER_ALERT',
    'ROUTINE_ADJUSTMENT',
    'LEARNING_PROMPT',
    'STYLIST_PREP'
  )),

  title                       text NOT NULL,
  body                        text NOT NULL,

  confidence_score            numeric(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  priority                    text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW','NORMAL','HIGH')),

  -- Display control
  display_start               timestamptz NOT NULL DEFAULT now(),
  display_end                 timestamptz,
  is_dismissed                boolean NOT NULL DEFAULT false,
  dismissed_at                timestamptz,

  -- Linkages
  linked_event_id             uuid REFERENCES hair_calendar_events(id),
  linked_booking_id           uuid REFERENCES bookings(id),

  -- Metadata
  source_data                 jsonb,  -- what data generated this insight

  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hair_insights_user ON hair_insights(user_id, is_dismissed);
CREATE INDEX idx_hair_insights_display ON hair_insights(display_start, display_end);
```

---

### 12.6 stylist_client_contexts

Consent-based sharing of hair health context with stylists.

```sql
CREATE TABLE stylist_client_contexts (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id            uuid NOT NULL REFERENCES users(id),
  stylist_user_id             uuid NOT NULL REFERENCES users(id),

  -- Consent management
  consent_granted             boolean NOT NULL DEFAULT false,
  consent_granted_at          timestamptz,
  consent_scope               text[] NOT NULL DEFAULT '{}',  -- e.g., ['TEXTURE','POROSITY','SENSITIVITY']

  -- Visible data snapshot (refreshed on booking)
  shared_profile_snapshot     jsonb,  -- subset of hair_health_profile based on consent_scope

  -- Notes from stylist
  stylist_notes               text,
  last_service_notes          text,

  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),

  UNIQUE(customer_user_id, stylist_user_id)
);

CREATE INDEX idx_stylist_client_contexts_customer ON stylist_client_contexts(customer_user_id);
CREATE INDEX idx_stylist_client_contexts_stylist ON stylist_client_contexts(stylist_user_id);
```

---

## 13. What Changed in v1.1 (Quick Diff View)

To make your life easier when updating the existing file:

New columns:

  users.wallet_preference_currency

New tables:

  topup_history

  withdraw_history

  external_addresses

  social_links

  user_follows

Light narrative alignment:

A few fields (hair_profile_json, referrals/roles) support the “growth from rest” and relationship-centric brand philosophy, without changing any technical contract.












