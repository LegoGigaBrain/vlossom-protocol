# 13 — Smart Contract Architecture

On-Chain Modules for Booking, Escrow, Reputation, Wallet & Liquidity

---

## 1. Purpose of This Document

This document defines the on-chain architecture for Vlossom:

    Which contracts exist

    What each contract is responsible for

    How contracts interact (booking → escrow → pools → reputation → rewards)

    How we keep UX Web2.5-simple while infrastructure is fully on-chain

    What invariants must always hold (safety + correctness)

    How we stay chain-agnostic (Base vs Abstract) with a thin integration layer

It is the primary reference for:

    Solidity implementation (Claude Code + devs)

    Audit preparation

    Indexer design

    Backend/API integration

Assumptions:

    All escrow & settlement runs on-chain using stablecoins (e.g., USDC) from day one.

    DeFi / VLP / community pools can be switched on later without redesign.

    Account abstraction (AA) handles wallet UX; users never see gas.

    Vlossom Wallet is the single financial hub for all actors (customers, stylists, owners, LPs).

---

## 2. Design Principles

### 2.1 Web2.5 UX, Web3 Infrastructure

All bookings settle via smart contracts + stablecoins.

Users experience banking / Uber-level simplicity:

    no seed phrases

    no gas settings

    no network switching

AA + relayers + paymaster handle:

    wallet creation

    gas sponsorship

    transaction signing

Implication for contracts:
    They expose clean, deterministic functions that AA wallets + relayers call.
    No UX logic lives inside contracts.

### 2.2 Separation of Concerns

We avoid “god contracts”. Instead, we define small, composable modules:

    Booking state & lifecycle

    Escrow & payment routing

    Reputation aggregation & rewards

    Referral + LP tier signals

    Liquidity pools & smoothing

    Property & chair registration

    Identity & access control

This makes audits easier and upgrades safer.

### 2.3 Stable, Predictable Data Model

    Every booking has a unique on-chain identity.

    Every booking emits a consistent event set.

    Reputation & rewards read from bookings and write aggregated state.

    DeFi & LP logic hooks into fees and volumes, not into core booking invariants.

### 2.4 Chain-Agnostic, AA-First

Business logic contracts are EVM-standard, agnostic to:

    L2 vs L3

    Base vs Abstract

Chain-specific concerns (AA factory, paymaster, gas token) live in a thin integration layer.

### 2.5 Gasless Forever (Paymaster Model)

All user actions are gasless:

    booking creation

    approvals

    completion

    P2P transfers

    LP deposits/withdrawals

A VlossomPaymaster sponsors gas and is funded from:

    Protocol treasury

    Chain grants / ecosystem rewards (later)

    A small portion of platform fees (later)

We design:

    Rate limits per wallet

    Simple, enforceable abuse protections

### 2.6 V1 Scope vs Future Expansion

v1 focuses on:

    standard bookings

    escrow

    basic reputation & rewards

    scaffolded VLP (Genesis Pool)

Future features (subscriptions, multichain, salon multi-sig, advanced LP) are architected but not required for v1 deployment.


---

## 3. Contract Topology Overview

High-level modules:

### 3.1 Identity & Wallet Layer

    VlossomAccountFactory

    VlossomPaymaster

    (AA Wallet implementation, e.g. VlossomAccount using existing AA standard)

### 3.2 Booking & Payments Layer

    VlossomBookingRegistry (booking state machine)

    VlossomPaymentEscrow (escrow & payout routing)

### 3.3 Space & Actor Registry Layer

    VlossomPropertyRegistry (properties + chairs)

    (Optional) VlossomActorRegistry (stylists/customers/owners metadata anchor)

    (Future) SalonTreasury (simple treasury now, multi-sig later)

### 3.4 Reputation, Referrals & Rewards Layer

    VlossomReputationRegistry

    VlossomReferralRegistry

    VlossomRewardsVault / RewardPoints

### 3.5 Liquidity & Treasury Layer

    VlossomGenesisPool (VLP)

    VlossomCommunityPool (template)

    VlossomPoolFactory

    VlossomYieldEngine

    VlossomSmoothingBuffer

    VlossomTreasury

(Full behaviour detailed in Docs 11–12; this doc focuses on integration points.)

### 3.6 Admin & Config Layer

    VlossomAccessControl

    VlossomConfig

### 3.7 Chain Integration & Adapters

    ChainIntegration (per-chain adapter)

    OnrampOracleAdapter

    OfframpOracleAdapter

---

## 4. Identity & Account Abstraction Layer

### 4.1 VlossomAccountFactory

Role: Deploy and manage AA wallets for users.

Responsibilities:

    Create AA wallet for:

        Web2.5 signups (email/phone/social)

        Web3-native signups (“Sign in with wallet”)

    Maintain mapping:

        userId → AA wallet address

        Optionally, externalWallet → AA wallet

Two modes:

    Default Web2.5 Mode

        User signs up with email/phone/social.

        Backend + factory deploy VlossomAccount with:

            owner key controlled via auth service / passkey.

    User never sees seed phrase.

“Sign up with wallet” Mode

    User connects EOA (e.g. MetaMask, Base Wallet, Abstract Global Wallet).

    EOA becomes owner or guardian of the AA account.

Key functions (conceptual):

    createAccount(Web2AuthPayload)

    createAccountWithWallet(address externalOwner)

    accountOf(userId) / accountOf(externalOwner)

Invariants:

    One primary AA wallet per human user.

    All booking / escrow / P2P / LP flows use this wallet.

 ### 4.2 VlossomPaymaster

Role: Sponsor gas for user operations.

Responsibilities:

    Validate UserOperations for whitelisted contracts:

        BookingRegistry

        PaymentEscrow

        PropertyRegistry

        VLP contracts

        P2P token transfers

    Pay gas in chain’s native token.

Key behaviours:

    Rate limiting:

        max ops per wallet per time window.

    Whitelisting:

        only allows calls to known Vlossom contracts.

    Funding:

        funded from VlossomTreasury.

Invariants:

    Users never pay gas directly.

    Paymaster cannot be drained by arbitrary calls.

### 4.3 Session Keys (Future-Ready)

Core idea:

    VlossomAccount supports:

        Owner key (long-term)

        Session keys (ephemeral, limited scope)

    Usage:

        Mobile app can use a session key to:

            approve bookings

            mark completion

            send P2P tips

    Constraints:

        Session keys have:

            expiry timestamp

            allowed function list

            rate limit

Owner key can revoke session keys at any time.

---

## 5. Booking & Payments Layer

### 5.1 Shared Types & Enums (Conceptual)

These are conceptual types to keep implementation consistent.

BookingType
    STANDARD        // normal in-country appointment
    SPECIAL_EVENT   // weddings, multi-day shoots, etc.
    CHAIR_RENTAL    // stylist renting a chair without a specific customer
    PACKAGE         // bundles (future)

BookingStatus
    NONE
    PENDING_STYLIST_APPROVAL
    AWAITING_CUSTOMER_PAYMENT
    ESCROW_ACTIVE
    IN_SERVICE
    COMPLETED_STYLIST
    COMPLETED_CUSTOMER_CONFIRMED
    DISPUTED
    SETTLED
    CANCELLED

DisputeStatus
    NONE
    OPEN
    RESOLVED_CUSTOMER
    RESOLVED_STYLIST
    RESOLVED_SPLIT
    ESCALATED_TO_ADMIN

PaymentStage
    NONE
    DEPOSIT_ONLY
    FULL
    MULTI_STAGE  // future multiphase payments

MoneySplit (struct)
    stylistAmount
    propertyAmount
    platformAmount
    lpAmount      // optional, can be zero in v1

These do not have to be literal Solidity enums; they are conceptual guides.

### 5.2 VlossomBookingRegistry

Role: Canonical registry for all bookings.

Responsibilities:

    Create new bookings with:

    customer AA wallet

    stylist AA wallet

    optional propertyId / chairId

    service IDs + addons

    booked start/end time

    booking type (standard, special event, chair rental)

    price breakdown (total, escrowed, fees)

    required approvals (stylist + property owner)

Manage booking state machine:

    States (conceptual):

        Requested

        StylistApproved

        PropertyApproved (if required)

        Confirmed

        Active (service in progress)

        Completed (stylist done)

        CustomerConfirmed

        Disputed

        Cancelled

        Settled

    Core functions (conceptual):

        createBooking(params)

        approveByStylist(bookingId)

        approveByPropertyOwner(bookingId)

        markStarted(bookingId)

        markCompletedByStylist(bookingId)

        confirmByCustomer(bookingId)

        openDispute(bookingId, reasonCode)

        cancelByCustomer(bookingId)

        cancelByStylist(bookingId)

        cancelByPropertyOwner(bookingId)

Events:

    BookingCreated

    BookingStatusChanged

    BookingUpdated

Invariants:

    Booking cannot move backwards in state.

    Booking always references valid actor addresses + optional property/chair IDs.

    Price & fee data are immutable after creation; only cancellation/dispute rules alter distribution.


### 5.3 VlossomPaymentEscrow

Role: Hold and route funds for each booking.

Responsibilities:

    Receive stablecoin payments from customer wallets.

    Map bookingId → escrow record.

    Handle:

        full prepay (v1)

        future deposits / multi-stage payments (enum already reserved)

Core functions (conceptual):

    lockFunds(bookingId, payer, amount, SplitParams)

    releaseOnCompletion(bookingId)

    refundOnCancellation(bookingId, policy)

    markDisputed(bookingId)

    resolveDispute(bookingId, ResolutionParams)

On successful completion:

    Split to:

        stylist AA wallet

        property treasury (if applicable)

        platform treasury

        optional LP / smoothing pool slice

Events:

    EscrowLocked(bookingId, payer, amount)

    EscrowReleased(bookingId, shares)

    EscrowRefunded(bookingId, amount)

Invariants:

    Total outflow ≤ escrowed amount + any buffer funds.

    No release without corresponding booking state from VlossomBookingRegistry.

    No reentrancy on transfer operations.

---

## 6. Space & Actor Registry Layer

### 6.1 VlossomPropertyRegistry

Role: Canonical registry for properties (salons / spaces) and chairs.

Stores:

    property owner AA wallet

    location metadata (minimal on-chain, with off-chain pointer)

    chair count & IDs

    chair amenity flags (wash basin, braiding chair, barber chair, etc.)

    base chair price + soft range classification

    approval rules:

        auto-approval allowed

        minimum stylist reputation

        minimum TPS

        blocklist / allowlist

Core functions (conceptual):

    registerProperty(PropertyParams)

    updatePropertyConfig(propertyId, Config)

    registerChair(propertyId, ChairParams)

    setApprovalRules(propertyId, Rules)

    blockStylist(propertyId, stylist) / unblockStylist(...)

Booking integration:

    When a booking uses a property/chair:

    Registry is consulted for:

        whether property approval is required

        whether stylist is allowed

        whether amenities match service requirements

### 6.2 (Optional) VlossomActorRegistry

Role: Optional central anchor for actor metadata.

Stores:

    Registered actors (customer, stylist, property owner)

    Role flags

    Accreditation / KYC status (future)

Benefits:

    Simplifies access checks.

    Simplifies indexing (single source of actor metadata).

### 6.3 SalonTreasury (Future-Ready)

Role: Treasury for each property, with upgrade path from simple wallet → multi-sig.

In v1:

    Each property has a treasury address (can be the owner’s AA wallet or a minimal treasury contract).

Future:

    Replace treasury with:

        Gnosis Safe

        chain-native multi-sig

        community/stokvel-style ownership

Core interface (conceptual):

    depositChairFees(chairId, amount)

    withdraw(amount, to)

    setBeneficiaries(...)

Invariants:

    Chair fees always route to the treasury.

    Treasury implementation can change without losing balances.

---

## 7. Reputation, Referrals & Rewards Layer

### 7.1 VlossomReputationRegistry

Role: Compact on-chain anchor for reputation metrics.

Inputs (via indexer/oracle):

    Completed bookings outcome

    Cancellations / no-shows

    Disputes

    Ratings:

        customer → stylist

        stylist → customer

        property ↔ stylist

Data model (high-level):

    For each actor address:

        totalCompletedBookings

        totalCancelled

        noShowCount

        avgRating

        tpsAggregate

        disputeCount

Core functions (conceptual):

    recordBookingOutcome(bookingId, OutcomeStruct)

    recordRating(actor, rater, rating, role)

    updateTPS(actor, delta)

Design constraint:

    Aggregates on-chain, raw reviews off-chain (database + indexer).

### 7.2 VlossomReferralRegistry

Role: Record referral graph and volumes.

Responsibilities:

    Track:

        referrer → referred relationships

        booking volume / LP volume attributed to referrers

Usage:

    DeFi layer uses referrer scores to unlock VLP tiers and community pools.

Core functions:

    registerReferral(referrer, referred, role)

    recordAttribution(referrer, volume)

    getReferrerScore(referrer)

Invariants:

    One primary referrer per user.

    No retroactive referrer swaps after a defined cutoff.

### 7.3 VlossomRewardsVault / RewardPoints

Role: Track non-transferable reward balances & badges.

Stores:

    stylistPoints

    customerPoints

    propertyPoints

    referrerPoints

Integrations:

    Called on booking completion:

        applyBookingRewards(actors, deltas)

    Called on DeFi actions (LP deposits, pool creation, etc.)

Design:

    Points are non-transferable, non-speculative.

    SBT / visuals can be handled off-chain, anchored by on-chain balances + events.

---

## 8. Liquidity & Treasury Layer (Integration View)

Full logic lives in:

    11 — DeFi & Liquidity Architecture

    12 — Liquidity Pool Architecture

Here we define how core contracts talk to them.

### 8.1 VlossomGenesisPool (VLP)

Role: Primary protocol-owned pool.

    Accepts stablecoin deposits from LPs.

    Provides:

        base yield

        liquidity for smoothing payouts

    Used by:

        VlossomPaymentEscrow

        VlossomSmoothingBuffer

Escrow integration:

    On releaseOnCompletion(bookingId):

        If instant payouts + local escrow is insufficient:

        Borrow from GenesisPool.

        Repay from incoming flows and treasury share.

### 8.2 VlossomCommunityPool & VlossomPoolFactory

Role: Community pools created by top referrers.

    VlossomPoolFactory deployed under protocol admin.

    Only wallets above certain referrer percentile tier can call createPool(...).

Escrow & fee integration:

    A slice of platform fees and/or region-tagged booking fees can flow into a specific community pool.

    Pools can optionally support smoothing for specific regions or verticals.

### 8.3 VlossomYieldEngine

Role: Shared engine for yield accounting.

    Pools call YieldEngine for:

        index updates

        APY scalar calculations

Booking integration:

    On booking settlement, Escrow or Treasury may call:

        onBookingSettled(region, amount, riskTier)

### 8.4 VlossomSmoothingBuffer

Role: Buffer that smooths timing risk.

    Holds dedicated funds to guarantee:

        stylists get instant payouts

        LPs don’t absorb short-term onramp/offramp delays

Integration:

    VlossomPaymentEscrow uses buffer when:

        immediate payout promised

        direct liquidity temporarily insufficient

### 8.5 VlossomTreasury

Role: Protocol treasury.

Receives:

    platform cut of each booking

    pool protocol fees

    share of cancellations/penalties

Spends:

    gas sponsorship (funds Paymaster)

    audits & security

    grants, marketing, ecosystem support

Governance:

    Controlled by multi-sig.

---

## 9. Chain Integration & Oracles

### 9.1 ChainIntegration (Per Chain)

Role: Thin adapter for chain-specific configuration.

Per deployment (e.g. ChainIntegrationBase, ChainIntegrationAbstract), it holds:

    addresses for:

        stablecoin

        Paymaster

        AccountFactory

        system contracts / precompiles (if any)

helper functions for:

    gas estimation / limits

    integration with chain-native features

### 9.2 Onramp & Offramp Oracle Adapters

These interfaces connect fiat ↔ stablecoin flows to on-chain accounting.

    OnrampOracleAdapter

        Emits events when fiat → stablecoin has succeeded.

        Might be the contract we credit stablecoin into AA wallets from.

    OfframpOracleAdapter

        Logs outgoing stablecoin → fiat operations.

        Ensures off-chain reconciliation is possible.

These are tightly coupled to partners (Ramp, Stitch, etc.) and documented further in DevOps & Infrastructure.

---

## 10. Security, Roles & Upgradeability

### 10.1 VlossomAccessControl

Roles (conceptual):

    DEFAULT_ADMIN_ROLE

    PROTOCOL_ADMIN_ROLE (config, pools, fees)

    TREASURY_ROLE (treasury allocations)

    RISK_ADMIN_ROLE (pausing, risk limits)

    RELAYER_ROLE (backend, off-chain agents)

    ORACLE_ROLE (reputation/referral updates, onramp/offramp oracles)

Constraints:

    No single role can drain funds.

    Critical actions emit events for auditing.

### 10.2 VlossomConfig

Centralized config for:

    fee percentages

    cancellation windows

    TPS thresholds

    pricing soft-range bands

    pool parameters (caps, APY tiers)

Other contracts read from Config; only PROTOCOL_ADMIN_ROLE can update it.

### 10.3 Upgradeability Strategy (v1)

To keep audits simple:

    Core value-holding contracts can be:

        versioned deployments (V1, V2, etc.)

        or minimal proxies with strict upgrade policies

v1 recommendation:

    Start with versioned contracts:

        VlossomBookingRegistryV1

        VlossomPaymentEscrowV1

        VlossomGenesisPoolV1

If breaking changes needed:

    deploy V2 versions

    route new bookings to V2

    allow V1 to naturally sunset after all escrows are resolved

---

## 11. Future Extensions (Detailed Blueprints)

These are not required for MVP, but architected so they can be added without breaking core logic.

### 11.1 SubscriptionManager (Beauty Subscription Manager)

Use cases:

    Monthly braid maintenance

    Weekly blowouts

    Nail or makeup subscriptions

Core idea:

    Users opt-in to recurring plans.

    SubscriptionManager pulls funds periodically and triggers:

        credits in-app

        or scheduled bookings.

Interfaces:

    createPlan(PlanConfig)

    subscribe(user, planId)

    cancelSubscription(user, planId)

    executeCycle(planId, user)

Invariants:

    SubscriptionManager never overdrafts wallets:

        checks balance before pulling.

    Each execution emits events for notifications & accounting.

### 11.2 BusinessProfileRegistry (Stylist Sub-Accounts)

Use cases:

    One stylist operates multiple “brands”.

    Separate business entities under one human.

Core idea:

    A businessId represents a business profile:

        brand name

        metadata hash

        payout rules

Linked to an owner AA wallet.

Interfaces:

    createBusiness(owner, metadata)

    updateBusiness(businessId, metadata)

    setPayoutConfig(businessId, config)

Integration:

    BookingEscrow can route stylist share to:

        a specific businessId instead of raw wallet.

    Internally, BusinessProfileRegistry splits payouts between:

        main stylist

        assistants

        business treasury

### 11.3 SalonTreasury Multi-Sig & Community Ownership

Use cases:

    Family-owned salons

    Community/stokvel-owned salons

    Future tokenized property (RWA) scenarios

Core idea:

    PropertyChairRegistry points each property to a salon treasury contract, which can evolve:

        single-owner contract

        multi-sig

        token-holder controlled vault

We keep the interface simple (see 6.3), making upgrades possible without touching booking logic.

### 11.4 ChainRouter (Multichain DeFi)

Use cases:

    Booking & escrow on canonical chain (e.g., Abstract or Base).

    High-yield DeFi pools on other chains.

Core idea:

    ChainRouter contract:

        locks liquidity on origin chain

        uses bridges/message buses to synchronize with pools on other chains

We define this now to ensure:

    Core contracts don’t assume “everything is on one chain forever”.

### 11.5 Wallet Login & Session Keys (Extended)

We already support:

    Email/phone → AA wallet

    “Sign in with wallet” → AA wallet owner/guardian

Further:

    VlossomAccount can expose standardized interfaces for:

        adding/removing session keys

        setting per-operation limits

This allows:

    fast, mobile-native UX

    limited-risk keys for assistants or front-desk staff (later)

### 11.6 QR / Tap-to-Pay P2P

Use cases:

    Customer tipping stylist face-to-face.

    Owner paying stylist manually.

No new contract needed:

    P2P uses standard stablecoin transfer() from AA wallet to AA wallet.

    QR/Tap-to-pay is purely UI, encoding:

        recipient address or @username

        optional amount

        memo

Contracts stay unchanged; UX becomes richer.

---

##  12. v1 Scope — What We Include vs Defer

### 12.1 v1 WILL Include

    Standard bookings (single-session)

    Special event bookings with:

        custom quotes via stylist approval

        multi-day logic handled mainly at UX / off-chain level

    Full pre-pay → escrow → settlement (no partial pay yet)

    Stylist approval for all bookings

    Optional property owner involvement in revenue splits

    On-chain stablecoin escrow for all bookings

    Basic on-chain reputation aggregates (customers, stylists, properties)

    Non-transferable rewards & referral points tracking

    Scaffolded Genesis Pool (VLP):

        LP deposits

        basic yield

    Protocol treasury funding the paymaster (gasless UX from day one)

### 12.2 v1 WILL NOT Include (Yet)

    Full community pool program (tiers 1–3 with advanced rules)

    Financing logic (credit lines, loans, BNPL for salons or stylists)

    Tokenized revenue streams or RWA property ownership

    Recurring subscription billing (SubscriptionManager live)

    Multichain liquidity routing (ChainRouter live)

    Default salon multi-sig for all properties

All of these are enabled by the architecture, but deferred from the first production release.

## 13. Invariants, Testing & Summary

### 13.1 Core Invariants

Funds conservation:
    For each booking:
        escrowed = stylistShare + propertyShare + protocolShare + refunds (+ LP share if used)

State consistency:
    Booking state in VlossomBookingRegistry always matches payment state in VlossomPaymentEscrow.

Access safety:
    Only authorized roles (or defined dispute flows) can:

        change config

        resolve disputes

        move treasury funds

Reputation integrity:
    Only valid booking events → reputation changes.

Pool isolation:
    Community pools cannot drain the Genesis Pool or treasury.

Gasless guarantee:
    Users never need to hold chain gas; Paymaster always mediates sponsored operations.

### 13.2 Testing Priorities

When implementing:

    Booking flow unit tests:

        all state transitions

        invalid transitions revert

    Escrow tests:

        lock → release → refund

        cancellation edge cases

        dispute resolution branches

    Reputation tests:

        aggregate counts

        rating updates

        TPS behaviour

    DeFi tests (for VLP v1):

        deposit/withdraw invariants

        yield index sanity

        interaction with Escrow & Treasury

    Paymaster tests:

        rate limiting

        whitelisting

        failure modes

### 13.3 Summary

This Smart Contract Architecture v2:


    Preserves the clarity of the original v1 design.


        Integrates:

            AA wallets

            gasless UX

            global wallet logic

            booking + escrow + chair rental flows

            reputation, referrals & rewards

        a scaffolded Vlossom Liquidity Pool (VLP)

    Stays chain-agnostic, with clean integration points for Base, Abstract, or other EVM chains.

    Explicitly sketches future extensions (subscriptions, multi-sig salons, multichain, plugins) so they can be switched on without re-architecting the core.

It is now ready to guide:

    Solidity scaffolding

    Hardhat/Foundry test-suite design

    Backend indexer + API work

    Claude Code agent implementation for contract generation and integration.

---

# 12 — Liquidity Pool Architecture

## v1.1 Addendum — Global Wallet, AA Settlement & Gasless Operations

This addendum extends the original Liquidity Pool Architecture to align with the introduction of the Global Wallet, Account Abstraction (AA), and Paymaster-sponsored gasless UX, without modifying the original economic, tiering, or risk logic.

---

## A. Scope of This Addendum

This addendum clarifies:

    How liquidity pools integrate with the Global Wallet

    How AA wallets act as the sole interaction point for LP actions

    How gasless transactions are enforced via the Paymaster

    How deposits, withdrawals, and yield distributions route through the wallet

    How the Liquidity Pool layer fits into the Wallet → DeFi tab UX

All pool math, yield logic, tiering, caps, and risk models defined in the original document remain unchanged.

---

## B. Wallet-First Liquidity Constraint

### B.1 Canonical Entry & Exit Point

All liquidity pool interactions MUST route through the Vlossom Global Wallet.

This enforces:

    consistent accounting

    unified transaction history

    predictable UX

    clean on-chain invariants

Deposit Path (Canonical)

    Fiat → Onramp → Global Wallet (USDC) → pool.deposit()

Withdrawal Path (Canonical)

    pool.withdraw() → Global Wallet (USDC) → optional Offramp

Pools never interact directly with fiat rails or off-ramp providers.

### B.2 AA Wallet as Sole Caller

All pool functions assume:

    msg.sender == AA Wallet Address

Direct EOA-to-pool interaction is not supported in MVP.

This ensures:

    compatibility with gas sponsorship

    unified identity across roles

    consistent permissions & rate limiting

---

## C. Deposit Flow Clarification

### C.1 Deposit Execution

When a user deposits liquidity:

    User initiates action from Wallet → DeFi tab

    AA wallet signs a deposit(amount) call

    Paymaster sponsors gas

    Pool contract mints LP shares

    Wallet balance decreases accordingly

    Transaction is recorded as DeFi → Deposit

All approval logic (token allowance, signature handling) is abstracted by wallet middleware and never exposed in UX.

### C.2 Insufficient Wallet Balance

If wallet balance is insufficient:

    user is prompted to Add Funds

    onramp completes

    deposit resumes automatically

No partial deposits occur.

---

## D. Withdrawal Flow Clarification

### D.1 Withdrawal Execution

When a user withdraws liquidity:

    User initiates action from Wallet → DeFi tab

    AA wallet signs withdraw(shares)

    Paymaster sponsors gas

    Pool burns LP shares

    USDC is returned to the Global Wallet

    Transaction is recorded as DeFi → Withdrawal

Offramping is a separate, optional wallet action and never occurs directly from a pool.

---

## E. Yield Distribution → Wallet

### E.1 Yield Settlement

All yield distributions settle into the Global Wallet.

    Yield Engine → Pool → AA Wallet (USDC)

Yield is displayed as:

    Fiat amount (primary)

    Stablecoin amount (secondary)

    Category: DeFi Yield

This ensures yield feels like part of the everyday Vlossom economy, not a separate financial silo.

---

## F. Paymaster & Gasless DeFi Operations

### F.1 Sponsored Pool Interactions

All liquidity pool interactions are gasless for users:

    deposit

    withdraw

    claim yield

    create pool (once unlocked)

Gas is sponsored by the Vlossom Paymaster.

### F.2 Paymaster Safeguards

The Paymaster enforces:

    per-wallet operation limits

    pool creation eligibility checks

    contract allowlisting (only approved pool contracts)

    abuse protection (rate limiting, denial of spam patterns)

Gas costs are funded by the Protocol Treasury, replenished via platform fees and buffer contributions.

---

## G. Pool Creation (Factory) — Wallet Context

When a qualified referrer unlocks pool creation:

    Action is initiated from Wallet → DeFi tab

    AA wallet calls PoolFactory.createPool(...)

    Paymaster sponsors gas

    New pool is registered and indexed

    Pool becomes visible to eligible participants

No EOA-level pool creation is permitted.

---

## H. DeFi Tab UX Assumptions (Informational)

While this document remains technical, it assumes the following UX realities (defined in Document 15):

    Liquidity pools are accessed exclusively via Wallet → DeFi

    Users do not manage pools outside the wallet context

    Pool metrics (APY, caps, utilization) are read-only indicators

    All actions resolve through wallet-mediated calls

This section exists to guide frontend and indexer implementations.

---

## I. Invariants Introduced by v1.1

The following invariants now apply to all liquidity pools:

### Wallet Invariant
All LP funds must pass through the Global Wallet.

### Gasless Invariant
No pool interaction requires user-paid gas.

### Settlement Invariant
Yield and withdrawals always settle into the wallet first.

### Isolation Invariant
Wallet integration does not alter pool isolation, caps, or risk boundaries.

---

## J. Delta Summary (v1.0 → v1.1)

Added

    wallet-first deposit & withdrawal routing

    AA wallet caller constraint

    paymaster-sponsored pool interactions

    yield → wallet settlement clarification

    DeFi tab UX assumptions

Not Changed

    pool math

    APY logic

    tier unlock rules

    caps & risk models

    smoothing buffer behavior

    treasury relationships

---

##  K. Closing Note

This addendum ensures the Liquidity Pool Architecture is:

    fully compatible with the Global Wallet

    aligned with AA-based identity

    seamless for Web2.5 users

    ready for DeFi activation at any time

It completes the financial substrate of the Vlossom Protocol without compromising its original economic design.


























































