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

### 12.1 Notifications UX

Vlossom uses a dedicated Notifications tab in the bottom nav as well as inline toasts/banners.

Notifications Tab (Global Inbox)

Central feed for:
    booking requests & approvals

    booking reminders and status changes

    payout confirmations and wallet events

    LP yield and pool unlock updates

    referral milestones

    new reviews

    new posts / announcements from followed stylists and salons

    chair availability updates and special event responses

Each notification appears as a card with:
    actor avatar + role (Customer / Stylist / Owner / Vlossom)

    short title + description

    timestamp

    status (unread / read)

    deep link: CTA (e.g. “View booking”, “Open wallet”, “Respond to event request”).

Inline notifications:

Still appear in context for:

    payment success/failure

    booking creation or updates

    sensitive actions (withdrawals, onramp errors)

Tapping an inline toast can also route to the Notifications tab → specific item.

#### 12.1.1 Notification Card Patterns

Notifications in Vlossom are displayed as consistent, reusable card components.
They appear primarily in the Notifications tab, but compact variants may surface inline within booking, wallet, or profile screens when contextually relevant.

Each notification card contains:

    Actor avatar or system icon

    Title (high-signal summary)

    Body text (1–2 lines of context)

    Meta row:

        timestamp

        status chip (New, Pending, Action Required, Completed)

    Primary Call-to-Action (e.g., “View booking”, “Respond”, “Open wallet”)

    Optional Secondary Action (e.g., “Message”, “View profile”)

Cards are grouped by date within the Notifications tab.

Below are defined notification patterns per actor and event type.

##### 12.1.1.A — Customer Notification Patterns

Type A — Booking Approved

    Trigger:

        Stylist accepts customer’s booking.

    Card:

        Title: Booking confirmed with [Stylist Name]

        Body: [Service] on [Date, Time] at [Location].

        Meta: Just now • Confirmed

        CTA: View booking

Type B — Booking Declined

    Trigger:

        Stylist declines or approval times out.

    Card:

        Title: Booking declined by [Stylist Name]

        Body: Your payment has been returned to your Vlossom wallet.

        Meta: Refunded

        CTA: Find another stylist

Type C — Upcoming Appointment Reminder

    Trigger:

        T-24h / T-2h before appointment.

    Card:

        Title: Reminder: [Service] tomorrow at [Time]

        Body: With [Stylist Name] at [Location].

        Meta: Scheduled

        CTA: View details

Type D — Service Completed → Review Prompt

    Trigger:

        Stylist marks appointment complete.

    Card:

        Title: How was your appointment?

        Body: Rate your stylist and, if applicable, the salon.

        Meta: Awaiting review

        CTA: Leave a review

Type E — Wallet Events

    Includes:

        Onramp success

        Offramp success

        P2P received

Examples:

    Onramp success

        Title: Wallet topped up

        Body: R [amount] added to your Vlossom wallet.

        CTA: View wallet

    P2P received

        Title: You received R [amount] from @[username]

        Body: “[Optional note]”

        CTA: View wallet

##### 12.1.1.B — Stylist Notification Patterns

Type F — New Booking Request

    Trigger:

        Customer initiates booking pending stylist approval.

    Card:

        Title: New booking request from [Customer Name]

        Body: [Service] on [Date, Time] at [Location].

        Meta: Action required

        CTA: Review & respond

Type G — Special Event Proposal

    Trigger:

        Customer submits special event brief.

    Card:

        Title: New special event request

        Body: [Event type] in [Location] on [Dates].

        Meta: Special request

        CTA: Open proposal

Type H — Schedule Conflict Warning

    Trigger:

        New request overlaps or blocks travel time.

    Card:

        Title: Potential schedule conflict

        Body: This request overlaps with an existing booking.

        Meta: Warning

        CTA: Review schedule

Type I — Stylist Payout Received

    Trigger:

        Escrow releases after booking completion.

    Card:

        Title: Payout received

        Body: R [amount] added to your Vlossom wallet.

        CTA: View wallet

Type J — New Review

    Trigger:

        Customer submits review.

    Card:

        Title: New review from [Customer Name]

        Body: “[Short excerpt/preview]”

        CTA: View review

##### 12.1.1.C — Property Owner Notification Patterns

Type K — Chair Booking Approval Needed

    Trigger:

        Booking requires property owner approval (based on rules).

    Card:

        Title: Approval needed for chair booking

        Body: [Stylist Name] requests [Chair X] on [Date, Time].

        Meta: Action required

        CTA: Approve or decline

Type L — Chair Rental Confirmed

    Trigger:

        Stylist books a chair for a time window.

    Card:

        Title: Chair rental confirmed

        Body: [Stylist Name] booked [Chair X] from [Date range].

        CTA: View schedule

Type M — Property Owner Payout

    Trigger:

        Chair fee or booking split settles.

    Card:

        Title: Salon earnings received

        Body: R [amount] added to your Vlossom wallet.

        CTA: View wallet

Type N — New Salon Review

    Trigger:

        Customer reviews salon property.

    Card:

        Title: New salon review from [Customer Name]

        Body: “[Short excerpt/preview]”

        CTA: View review

##### 12.1.1.D — LP / Referrer Notification Patterns

Type O — LP Yield / Pool Updates

    Trigger:

        Yield distribution or APR change.

    Card:

        Title: Yield update for [Pool Name]

        Body: You earned R [amount].

        CTA: Open DeFi

Type P — Referral Milestones

    Triggers include:

        New referral

        Tier upgrade

    Examples:

        New referral:

            Title: New referral joined

            Body: @[username] used your link.

            CTA: View referrals

    Tier upgrade:

        Title: You reached Top [X]%

        Body: You unlocked [Tier N] pools.

        CTA: Browse pools

Type Q — Pool Creation Rights Unlocked

    Trigger:

        User reaches required percentile.

    Card:

        Title: You can now create a liquidity pool

        Body: As a Top [X]% referrer, you’ve unlocked pool creation rights.

        CTA: Create pool

##### 12.1.1.E — System & Security Notifications

Type R — Security Events

    Examples:

        New device login

    Title: New sign-in detected

        Body: Your account was accessed from a new device.

        CTA: Review security

    Temporary wallet hold

        Title: Wallet under review

        Body: Some activity is being reviewed. Your funds are safe.

        CTA: Contact support

Type S — Product Announcements

    Trigger:

        New features or policy updates.

    Card:

        Title: New feature: Special Events

        Body: You can now request multi-day event stylists.

        CTA: Learn more

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

This document is now the canonical front-end UX map for the Vlossom ecosystem and should stay tightly aligned with:

10-pricing-and-fees-model.md

11-defi-and-liquidity-architecture.md

12-liquidity-pool-architecture.md

16-property-owner-and-chair-rental-module.md

17-stylist-schedule-simulation.md

18-travel-and-cross-border-bookings.md