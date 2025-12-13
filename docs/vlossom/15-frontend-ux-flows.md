# 15 — Frontend UX Flows

End-to-End User Experience Flows for Customers, Stylists, Property Owners, LPs & Admins
(with Global Wallet, P2P, DeFi, Social Graph & On-Chain Settlement)

---

## 1. Purpose of This Document

This document defines the complete UX flow architecture for the Vlossom platform — the:

    screens

    states

    transitions

    actor-specific journeys

    wallet + DeFi + P2P interactions

that make up the experience from:

    login → discovery → booking → payment → service → payout → review → rewards → liquidity.

It is the foundation for:

    UI design (Illustrator → Figma → React)

    Frontend engineering (Next.js / React)

    Backend orchestration and indexer logic

    Smart contract integration (escrow, payouts, LP)

    Agentic workflows in Claude Code

It ensures that for every actor:

    every system state

    every approval loop

    every failure case

    every financial pathway

…is represented visually and logically.

---

## 2. Core UX Philosophy


### 2.1 Web2.5 First, Web3 Powered

The UX must feel like:

    a banking app

    a ride-hailing app

    a food delivery app

Under the hood:

    AA wallets for all users

    stablecoin balances (e.g., USDC)

    smart contract escrow

    liquidity pools (DeFi layer)

Web3 stays under the surface unless the user opts into Advanced Mode.

### 2.2 Fiat-First, Token-Second

    Show fiat (ZAR / NGN / USD / etc.) big and bold.

    Show the underlying USDC balance smaller beneath it.

    Allow the user to choose their display currency.

We want Web2.5 users to feel at home but slowly become familiar with Web3 rails.

### 2.3 Wallet-First Interactions

    The Global Wallet is a top-level nav item.

    Wallet balance is always the first funding source.

    Only when wallet funds are insufficient do we prompt onramp.

    Users can preload and treat Vlossom like a financial home

### 2.4 P2P-Native

Users can send money using:

    @username (primary)

    phone number

    wallet address

The system does smart detection to resolve input → identity.

P2P is used for:

    tipping stylists

    paying assistants

    refunds between actors

    gifting hair appointments to friends

Everything is settled on the same wallet rails.

### 2.5 Zero Crypto Anxiety

By default, users do not see:

    gas fees

    chain names

    network jargon

Unless they explicitly turn on Advanced Wallet View.

### 2.6 Premium Beauty UX

Look and feel:

    lots of white / neutral space

    warm tones, soft shadows

    clean type hierarchy

    calm, confident motion

This must feel like a luxury lifestyle app, not a DeFi dashboard.

### 2.7 Real-Time, Alive & Responsive

The app must feel alive:

    live booking updates

    live schedule changes

    live payout notifications

    live yield updates

    live review and social alerts

### 2.8 Role-Aware, Not Role-Locked

One person can be:

    Customer + Stylist

    Stylist + Property Owner

    Any role + LP provider

The UX adapts based on enabled profiles, but all roles share:

    one wallet

    one identity

    one reputation spine

### 2.9 Brand Experience Principles (Vlossom)

The Vlossom experience is designed to feel like a sanctuary — calm, reassuring, and intentional.

All user interactions should reflect the following principles:

Growth from rest
    The interface never rushes the user. Time, availability, and progress are framed gently, without urgency loops or pressure mechanics.

Care before transaction
    Every booking, payment, or approval should feel guided and supportive, not mechanical or extractive.

Soft confidence
    The system communicates certainty and trust without dominance or command-style language.

Predictability and safety
    Money, bookings, and reputation states are always clearly explained. Nothing feels hidden or ambiguous.

Dignified progress
    Rewards, referrals, and reputation are framed as natural growth — not grinding, competition, or gamification.

This philosophy applies across all roles: customers, stylists, property owners, and liquidity participants.

---

## 3. Global Navigation & Layout

Mobile-first, shared by all actors:

    Home / Explore

        discovery feed, promos, recommended stylists/salons.

    Bookings / Schedule

        upcoming and past appointments; reschedule/cancel actions.

    Wallet

        global wallet hub (balance, on/off-ramp, P2P, DeFi, rewards, history).

    Notifications  
   
        Central inbox for all time-based and event-based updates across roles.

    Profile

        actor dashboards (customer, stylist, property owner)

        settings, social connections, advanced wallet toggle.


(Platform Admin uses a separate web console, not mobile nav.)

The Wallet tab being first-class visually communicates that money, payouts, and DeFi are central to the Vlossom ecosystem.

The Notifications tab surfaces a unified feed of booking, payout, DeFi, and social events, while inline toasts/banners still appear contextually inside other flows.

---

## 4. Global Wallet Hub UX

All actors share the same wallet architecture with different context surfaces.

### Emotional Safety Layer — Wallet Experience

Although the wallet is powered by on-chain infrastructure and smart contracts, the experience must feel as familiar and reassuring as a trusted banking app.

Users should feel that:

    their money is safe

    nothing happens without their awareness

    the system is working with them, not against them

Crypto-native complexity remains hidden by default, revealed only by choice (Advanced Mode).

### 4.1 Wallet Tab Structure

The Wallet screen is organized into 5 core sub-views:

    Overview

    DeFi

    Rewards

    History

    Advanced

### 4.2 Wallet — Overview

Primary financial screen.

Balance Card:

    Big: R 1,240.00 (fiat)

Small: (USDC — equivalent)

User can switch display currency:

    ZAR / NGN / USD / GBP / EUR, etc.

Quick Actions:

    Add Money (onramp → wallet USDC)

    Withdraw (offramp → bank/mobile money/etc.)

    Send (P2P transfer)

    Receive (QR + address + payment request link)

    Pay Outstanding (for pending booking balances, if any)

Extra Modules (Stylists & Owners):

    Earnings this week

    Pending payouts

    Upcoming settlements (escrow release)

This gives stylists and owners an immediate sense of cash flow.

### 4.3 Wallet — DeFi

Where all staking, LP, yield, and pool interactions live.

A. Your DeFi Summary

    Total staked

    Total yield (this week / month)

    Average APR

    Referrer percentile and pool unlock progress:

        “You are in the Top 12.4% referrers — Tier 2 pool unlocks at Top 10%.”

B. Pools List

    VLP (Vlossom Liquidity Pool)

        default, safest pool

        stake / unstake

        yield summary

    Community Pools (Tiered)

        Tier 1, 2, 3 — unlocked based on referrer percentiles

        Each shows APR, risk hints, and theme (e.g. “Braids Economy Pool”)

C. Actions

    Stake from wallet balance

    Unstake to wallet balance

    View Pool Details (APY explanation, lockups, etc.)

    Create Pool (visible only when rules from DeFi doc are met – e.g. Top X% referrers)

### 4.4 Wallet — Rewards

Non-transferable, reputation and loyalty artifacts (soulbound style).

Displays:

    reputation badges (punctuality, quality, reliability)

    completion streaks

    “Top Stylist” / “Trusted Customer” / “Top Chair Host”

    loyalty tiers

    event badges

    challenge completions

They represent identity & professionalism across borders.
No transfer, no speculation.

### 4.5 Wallet — History

A unified ledger for all money-related activities.

Filters:

    Bookings

    Chair Rentals

    P2P (Sent / Received)

    Tips

    Onramp

    Offramp

    DeFi (Stake / Unstake / Yield)

    Rewards

    Refunds

Each entry:

    amount (fiat + token)

    type

    actor / counterparty

    timestamp

    status

    link to underlying booking / pool / profile

Export:

    “Download statement (PDF)”

    “Export to CSV”

This supports bookkeeping, tax, and future financings.

### 4.6 Wallet — Advanced (Web3 Mode)

Hidden unless the user turns on Advanced Mode in Settings.

Contains:

    wallet address

    QR code

    raw token balances

    export seed phrase / recovery (strong warnings and flows)

    device sign-in history

    network/chain label (abstracted as “Vlossom Network” for v1)

    future: link external wallet or advanced bridges

Default is OFF for Web2.5 users.

---

## 5. Onramp, Offramp & P2P Flows

### 5.1 Add Funds (Onramp)

Entry points:

    Wallet → Add Money

    Booking → insufficient balance → “Top up to complete booking”

    DeFi → insufficient balance → “Top up to stake”

Steps:

    User enters target amount in fiat (e.g. R600).

    App calculates approximate USDC amount + fees.

    User selects payment method:

        card

        Apple Pay / Google Pay

        local methods (EFT, mobile money, etc., where supported)

On success:

    stablecoins credited to AA wallet

    Wallet Overview updates

    any pending flow (booking / LP) resumes smoothly.

### 5.2 Withdraw (Offramp)

Flow: Wallet → Withdraw

1. User selects amount in fiat.

1. Selects destination:

    bank account

    mobile money

    local payout rails

3. Sees:

    estimated arrival time

    fees

4. Confirms; gets status tracking via History.

### 5.3 Send (P2P)

Flow: Wallet → Send

    Input field with smart detection:

        @stylistvuyo → username

        0823456712 → phone

        0xabc123… → wallet address

    App resolves recipient and shows avatar + role.

    User enters amount (fiat, token underneath).

    Optional note (“Tip for Saturday braids”).

    Confirm screen → “Sending R200 to @stylistvuyo (USDC 200).”

    AA wallet signs; gas abstracted.

    Success confirmation.

Used by:

    customers (tips/gifts)

    stylists (assistants, collab stylists)

    property owners (bonuses/adjustments)

### 5.4 Receive

Flow: Wallet → Receive

Shows:

    QR code

    wallet address (copy)

    optional “Request Payment”:

        set amount + note

        generate payment link/QR

        share externally

Useful for stylists migrating off-platform clients into Vlossom.

---

## 6. Customer UX Flows

### 6.1 Onboarding (Customer)

Sign Up Options:

    email + OTP

    phone number + OTP

    Google / Apple

Behind the scenes:

    AA wallet created

    base profile initialized

Basic Setup:

    name

    profile photo

    location (country + city; optional precise GPS)

    hair type & preferences (optional)

    preferred display currency

Optional quick tutorial:

    booking basics

    safety & trust

    wallet basics (“You can preload and pay like a bank app.”)

### 6.2 Discovery & Browsing

Entry via Home / Explore:

    search bar (“Find a stylist, salon, or style…”)

    location selector (auto + manual)

    recommended stylists

    nearby salons

    popular categories

Filters:

    service type

    price range

    rating

    availability (date/time)

    mobile vs in-salon

    accreditation level

Result cards show:

    stylist photo + rating

    2–3 key tags (e.g. “Knotless braids, Locs, Treatments”)

    price range

    “Mobile / Fixed / Hybrid” badge

### 6.3 Selecting a Service

From category or stylist profile:

choose service:

    e.g. “Medium knotless braids”

select addons:

    length, thickness, treatments, wash, styling, special flag

see:

    base price

    addon price increments

    typical duration

    soft range indicator:

        Below market

        Market average

        Premium

All logic ties back to Services & Categories doc.

### 6.4 Location Mode Selection

User chooses where service happens:

    At my location (mobile stylist)

    At stylist base (fixed)

    At chosen salon (property owner’s chair)

App checks:

    stylists that fit the location mode

    chair availability if property is involved

    travel logic if mobile.

### 6.5 Scheduling & Quote

System calculates:

    total duration (including travel buffers where relevant)

    total price (service + addons + travel + chair + platform fee)

    displays total as:

        fiat first

        token underneath

User selects:

    date

    time slot (only from non-conflicting, available windows)

Final Quote Screen:

    stylist

    service + addons

    location

    time & duration

total price breakdown (compact but transparent)

### 6.6 Payment & Booking Creation

App checks wallet balance:

    If sufficient → pay from wallet → funds moved to on-chain escrow.

    If insufficient → inline Add Money flow → then pay from wallet.

Booking record is created both:

    in database (for UX)

    on-chain via escrow contract.

Status for customer:

    “Awaiting stylist approval”

If property involvement requires owner approval:

    “Awaiting stylist approval → awaiting salon approval”

### 6.7 Pre-Appointment UX

Customer sees:

    booking countdown

    location map (if travel or salon)

    stylist travel status (if mobile)

    preparation notes (optional now, deep later)

They can:

    reschedule (within allowed windows)

    cancel (with fee logic defined in pricing docs)

### 6.8 During Appointment

Appointment status transitions:

    “Upcoming” → “In Progress” → “Completed”

Live updates:

    estimated end time

    any delays (if stylists update status)

### 6.9 Completion, Review & Rewards

Flow:

    Stylist taps Complete.

    Customer receives Confirm Completion prompt.

        If no action within timeout → auto-confirm.

    Funds in escrow settle:

        stylist share → stylist wallet

        chair fee → property owner wallet

        platform fee → treasury

        smoothing buffer → pool

Customer is prompted to:

    rate stylist

    rate property (if applicable)

    leave short text review

Rewards:

    loyalty points / streaks

    badges where applicable

History:

    booking card moves into Past Bookings with Rebook button.

### 6.10 Special Event Booking (Customer)

Entry: Special Events category or stylist’s premium offering.

Customer provides:

    event type (wedding, shoot, tour, etc.)

    date(s) and time windows

    locations and travel pattern

    guest details and required looks

    extra context text

System creates Special Event Request, not a standard booking.

Stylist:

    receives request

    opens quote-builder (multi-day, travel, accommodation)

    sets fee structure:

        full upfront

        deposit + balance

Customer:

    reviews quote

    accepts → payment → escrow

    or declines → conversation ends

Special event is tracked in dedicated flow/timeline.

---

## 7. Stylist UX Flows

### 7.1 Becoming a Stylist

From Profile → “Become a Stylist”.

Setup:

    brand name / display name

    profile photo(s)

    bio

    specialization tags

Service Catalog:

    choose categories (braids, locs, natural care, male grooming, etc.)

    for each service:

        name

        duration

        base price

        addons

Location Mode:

    Fixed, Mobile, or Hybrid.

    For fixed:

        base address

        map pin

    For mobile:

        service radius / supported areas

Availability Calendar:

    weekly schedule

    default working hours

    manual blockouts

    holidays

Optional:

    accreditation uploads

    ID verification.

### 7.2 Stylist Dashboard

Key sections:

    Today’s Schedule

    Upcoming Bookings

    Requests Pending Approval

    Earnings Summary

    Reputation Snapshot

    Service Catalog Management

    Locations & Chair Links

    Travel Preferences

    Special Events

    Wallet snapshot

From here, stylists can jump to:

    Wallet

    Profile

    DeFi tab

### 7.3 Booking Approval Flow (Stylist)

When a booking request arrives:

Stylist sees:

    customer name + rating

    service & addons

    location type

    date & time

    duration

    expected earnings after splits

Actions:

    ✅ Approve

    ❌ Decline

    (Future) Suggest new time

Mobile stylists also see:

    travel time

    any travel constraint warnings

If property involved:

    stylist approves first

    then owner sees request (or vice versa depending on chosen flow — covered in booking/owner docs).

Approval → status updates across customer & property owner views.

Decline → funds return to customer wallet; alternatives suggested.

### 7.4 Managing Schedule & Time-Off

Stylist → Schedule:

    day/week/month calendar

    can block out slots as Unavailable

    cannot override slots with existing bookings (unless cancellation flows are triggered)

The booking engine uses:

    availability

    travel buffers

    existing bookings

…to show only valid slots to customers.

### 7.5 Stylist & Wallet

Stylist’s Wallet view is the same global Wallet, but contextual:

    “Earnings this week” module

    “Pending payouts”

    “Next payouts”

From Wallet, stylists can:

    withdraw to bank

    stake LP

    pay property owners P2P

    tip assistants

    pay other stylists

---

## 8. Property Owner UX Flows

### 8.1 Becoming a Property Owner

From Profile → “List my space”.

Setup:

    salon name

    description

    cover + interior photos

    address + map pin

    amenities:

        basins, power, AC, WiFi, parking, etc.

Chairs:

    number of chairs

    type per chair

    availability patterns

Pricing:

    base chair rates (per hour / day / week / month)

    soft ranges (platform may show “below/market/premium” to stylists)

    optional peak pricing windows

Rules:

    toggle: “Require my approval for new stylists?”

    set rules (e.g. min stylist reputation, TPS, etc. in future)

    blocklist / allowlist for specific stylists

### 8.2 Property Owner Dashboard

Key sections:

    Chair Calendar (per chair)

    Stylist Approvals & Requests

    Salon Amenities & Profile

    Pricing Rules

    Financials / Revenue

    Reviews

    Blocklist / Allowlist

Owner can:

    block chairs for maintenance or off-days

    adjust pricing window in advance

    review stylists that have worked there

### 8.3 Property Owner & Wallet

Owners see:

    total income from chair rentals

    per-booking splits (when bookings route through their location)

From Wallet they can:

    withdraw

    provide LP

    pay stylists P2P (bonuses / reconciliation)

    book hair services for themselves

Everything flows through the same global wallet.

---

## 9. Liquidity Provider & Referrer UX

LP Mode is not a separate identity — just a mode inside Wallet → DeFi tab.

### 9.1 LP Dashboard

Shows:

    total staked

    yield over time

    pools participated in

    LP tier based on referral & staking criteria

    progress bars for unlocking higher pool privileges

### 9.2 LP Deposit Flow

From DeFi tab:

    choose pool (e.g. VLP initially)

    enter amount

    check wallet balance:

        if insufficient → Add Money

    confirm deposit

    funds move from wallet → pool contract

UI shows updated stake & projected yield.

### 9.3 LP Withdrawal Flow

From DeFi tab:

    select pool & amount

    show effect on stake & yield

    confirm

    funds return from pool contract → wallet

### 9.4 Referrer View (High-Level)

Referrer section shows:

    total referred users

    breakdown by role (customers, stylists, owners, LPs)

    cumulative economic impact

    percentile ranking

    pool creation unlock status

This logic ties to DeFi & Liquidity Architecture doc.

---

## 10. Platform Admin (High-Level)

Platform admins use a separate console (not in consumer nav).

Features:

    system dashboards: bookings, revenues, liquidity, reputation distributions

    moderation: verify accounts, handle disputes, freeze accounts/wallets when needed

    financial controls: fee configs, LP parameters

    risk & security tools

Full detail lives in 21-admin-panel-and-moderation.md.

---

## 11. Profile, Social, and Account Connections

All social + follow logic lives under Profile.

Profile sections:

### 11.1 About

    name / handle

    role badges (Customer / Stylist / Owner / LP)

    location

    short bio

### 11.2 Social Connections

Connect:

    Instagram

    TikTok

    X

    WhatsApp

    (optionally YouTube, etc.)

Used for:

    stylists showing portfolio content

    salons showing space content

    influencers amplifying their presence.

### 11.3 Follow System

Users can:

    follow stylists

    follow salons

Following surfaces:

    their posts (later)

    their availability updates

key milestones (e.g. accreditation, new services)

### 11.4 Reviews & Wall

Profile has a Reviews feed:

    reviews from bookings

    badges earned

    highlight achievements

Later: posts & announcements:

    stylists: new hairstyles, availability updates

    salons: promotions, chair openings

### 11.5 Settings

From Profile → Settings:

    language

    display currency

    notification preferences

    connected socials

    Advanced Wallet Mode toggle

---

## 12. Cross-Cutting Flows

### 2.1 Notifications UX 

Vlossom uses a dedicated Notifications tab in the global navigation, supported by contextual inline notifications (toasts / banners).

Notifications are event-driven, state-aware, and actionable.
They never exist purely “for information” — every notification resolves to a clear next step.

### Emotional Tone for Notifications

Notifications should feel like gentle check-ins, not system alerts.

Wherever possible, notification copy should:

    acknowledge the user’s presence

    explain what’s happening in plain language

    suggest the next step without urgency

Tone guidelines:

    Prefer reassurance over warning

    refer explanation over instruction

    Prefer invitation over command

Example framing (guidance only):

    Instead of: “Action required”
    Use: “When you’re ready, you can…”

    Instead of: “Approval pending”
    Use: “Your request is being reviewed”

#### 12.1.1 Notifications Tab (Global Inbox)

The Notifications tab acts as the single source of truth for all system events across roles.

It aggregates notifications for:

    booking requests & approvals

    booking reminders & status changes

    wallet events (payments, payouts, refunds)

    LP yield updates & pool unlocks

    referral milestones

    new reviews

    posts / announcements from followed stylists or salons

    chair availability updates

    special event responses

Notifications are grouped by date (Today / Yesterday / Earlier).

Unread notifications are visually distinct and cleared on interaction.

##### 12.1.2 Notification Card Pattern (Reusable Component)

All notifications are rendered as cards with a consistent structure.

Each notification card contains:

    Header

        Actor avatar or system icon

        Actor label + role

            e.g. Stylist • Ivy Mokoena

            or Vlossom System

    Body

        Title — short, high-signal text

        Description — 1–2 lines of contextual detail

    Meta Row

        Timestamp

        Status chip:

            New

            Pending

            Action Required

            Completed

Primary CTA

    Deep-link action (e.g. View booking, Approve request, Open wallet)

Optional Secondary CTA

    e.g. Message, View profile, Respond

This card pattern is reused across:

    Notifications tab

    Booking detail screens (compact version)

    Dashboard alerts (stylist / owner)

##### 12.1.3 Customer-Facing Notification Examples

Type A — Booking Approved

Trigger
Stylist approves booking.

Card

    Title: Booking confirmed with [Stylist Name]

    Body: [Service] on [Date, Time] at [Location]

    Meta: Just now • Confirmed

    CTA: View booking

Type B — Booking Declined

Trigger
Stylist declines or booking times out.

Card

    Title: Booking request declined

    Body: Your request with [Stylist Name] was not accepted.

    Meta: 2 min ago • Completed

    CTA: View alternatives

Type C — Action Required (Payment / Approval)

Trigger
Dual-approval flow or wallet top-up required.

Card

    Title: Action needed to secure your booking

    Body: Approve payment or wait for property confirmation.

    Meta: Now • Action Required

    CTA: Complete booking

##### 12.1.4 Stylist-Facing Notification Examples

Type D — New Booking Request

Trigger
Customer submits booking request.

Card

    Title: New booking request

    Body: [Service] • [Date, Time] • [Location type]

    Meta: New • Pending

    CTA: Review request

Type E — Upcoming Appointment Reminder

Trigger
Time-based system reminder.

Card

    Title: Upcoming appointment in 1 hour

    Body: [Customer Name] • [Service]

    Meta: Reminder

    CTA: View booking

##### 12.1.5 Property Owner-Facing Notification Examples

Type F — Chair Booking Approval Required

Trigger
Stylist selects salon with approval enabled.

Card

    Title: Chair booking approval needed

    Body: [Stylist Name] requests a chair on [Date]

    Meta: Pending • Action Required

    CTA: Review request

##### 12.1.6 Wallet & Financial Notifications

Financial events always route to the Wallet.

Examples:

    Payment successful

    Payout received

    Refund processed

    LP yield credited

    Card CTA: Open wallet

##### 12.1.7 Inline Notifications (Contextual)

Inline notifications appear as lightweight toasts or banners for:

    payment success / failure

    booking state changes

    sensitive actions (withdrawals, cancellations)

Tapping an inline notification routes the user to:
Notifications tab → highlighted card

##### 12.1.8 Notification Preferences (UX Rule)

From Profile → Settings → Notifications, users can:

toggle categories:

    bookings

    wallet

    reviews

    LP & rewards

    social updates

choose push vs in-app only

mute specific stylists or salons (future)

Critical system notifications (payments, disputes) cannot be disabled.

##### 12.1.9 Design & Engineering Note

Notifications are event-driven, not poll-driven.

Backend emits events → indexer → notification service.

UI treats all notifications as:

    immutable records

    rendered from shared card components

Delivery may be async, but UX must feel immediate and calm.

### 12.2 Booking Card States

Reusable booking card component with states:

    Draft (quote not finalized)

    Pending payment

    Pending stylist approval

    Pending property approval

    Confirmed

    In progress

    Awaiting completion confirmation

    Completed

    Cancelled

    Dispute (if triggered)

These states are shared across:

    customer views

    stylist dashboards

    owner dashboards

### 12.3 Calendar & Scheduling UX

Shared concepts:

    calendar view (day/week/month)

    service blocks

    travel blocks

    chair availability overlay

    conflict warnings (double-booking, travel impossible, etc.)

This is especially critical for stylists and property owners.

### 12.4 Error & Edge Case UX

Covers:

    failed onramp / offramp

    booking conflict detection

    stylist sudden unavailability

    property refusing a booking after stylist approval

    P2P failures (provider/network issues)

Principles:

    clear, human language

    never lose user funds

    always give next steps (retry, support, alternate options)

### 12.5 Internationalization & Accessibility

    currency conversion & localized formatting

    region-based pricing & content where needed

    large tap zones

    comfortable font sizes

    high-contrast / dark mode possibilities

---

## 13. Implementation Notes

For designers:

    treat Wallet as a first-class nav item.

    design flows as state machines, not static screens.

    give priority to clarity over cleverness in financial UI.

For engineers:

    treat booking, payment, escrow, and approvals as linked state machines.

    ensure wallet operations are atomic and auditable.

    integrate indexer events → real-time UI updates.

For Claude Code:

    use this doc as primary UX reference

    when generating components, consider:

        role context

        wallet integration points

        notification triggers

        DeFi & rewards hooks

### Brand-Aligned Microcopy Patterns (Guidance)

This section provides illustrative examples, not hard rules. It exists to guide tone across UI, notifications, and flows.

| Functional Moment    | Preferred Tone                                               |
| -------------------- | ------------------------------------------------------------ |
| Booking confirmation | “You’re all set 🌸”                                          |
| Awaiting approval    | “Your stylist is reviewing your request”                     |
| Payment held         | “Your payment is safely held until your service is complete” |
| Completion           | “Your session is complete — how was your experience?”        |
| Cancellation         | “This booking has been gently released”                      |

Avoid language that feels abrupt, punitive, or transactional.

### This document is now the canonical front-end UX map for the Vlossom ecosystem and should stay tightly aligned with:

10-pricing-and-fees-model.md

11-defi-and-liquidity-architecture.md

12-liquidity-pool-architecture.md

16-property-owner-and-chair-rental-module.md

17-stylist-schedule-simulation.md

18-travel-and-cross-border-bookings.md

The Vlossom frontend is not only a functional system — it is an emotional environment designed to support ease, trust, and growth over time.