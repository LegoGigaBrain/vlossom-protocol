# 12 — Liquidity Pool Architecture

Smart Contract Blueprint for Vlossom Liquidity Pools (VLP + Tiered Community Pools)

---

## 1. Purpose of This Document

This document translates the high-level DeFi philosophy (Document 11) into technical, on-chain architecture.

It defines:

    Contract responsibilities

    Pool creation rules

    Tiered pool constraints

    LP deposit/withdraw logic

    APY + yield distribution formulas

    Risk isolation

    Smoothing buffers

    On-chain event flows

    Smart contract modules

    Safety patterns

    Pool lifecycle management

This is the blueprint Claude Code will use to:

    scaffold Solidity contracts

    build Foundry or Hardhat test suites

    design indexer schemas

    implement payout routing logic

---

## 2. Core Contracts Overview

Vlossom’s liquidity layer consists of modular, isolated smart contracts.

### 2.1. VLP (Genesis Pool)

VlossomGenesisPool.sol

    Managed by the protocol

    Safest, default pool

    No creator

    Unlimited liquidity cap

    Used for escrow smoothing + instant payouts

    Benchmark APY

### 2.2. Community Pool Factory

VlossomPoolFactory.sol

    Deploys new community pools

    Enforces tier restrictions

    Validates creator eligibility

    Enforces caps (Tier 1 / 2 / 3)

    Assigns pool tier

    Logs pool metadata

### 2.3. Community Pools (Tiered)

VlossomCommunityPool.sol (proxy or clone pattern)

    Owned by pool creator (limited powers)

    Configurations set by factory

    Handles deposits, withdrawals, accounting

    Distributes yield (based on APY engine)

    Enforces risk + size limits

### 2.4. APY Engine

VlossomYieldEngine.sol

    Calculates APY based on:

        utilization ratio

        platform fee flow

        region demand

        risk tier

        incentives

    Updates pool interest indices

    Emits yield events

### 2.5. Smoothing Buffer

VlossomSmoothingBuffer.sol

    Handles instant stylist payouts

    Absorbs settlement timing risk

    Has replenishment logic via:

        VLP

        platform fees

        dedicated reserves

### 2.6. Treasury

VlossomTreasury.sol

    Holds protocol share

    Funds audits + grants

    Supports VLP reinforcement

---

## 3. Pool Creation Logic (Tier-Based)

### 3.1. Eligibility Based on Percentile

From Document 11, eligibility:

    Tier 1: Top 5% of referrers

    Tier 2: Top 15% of referrers

    Tier 3: Top 30% of referrers

#### Referral Engine provides:

function getReferrerPercentile(address user) returns (uint256 percentile)

#### Factory checks:

if percentile <= 5 → Tier 1
else if percentile <= 15 → Tier 2
else if percentile <= 30 → Tier 3
else revert("Not eligible");

### 3.2. Caps Per Tier

| Tier       | Cap Example  | Notes                                  |
| ---------- | ------------ | -------------------------------------- |
| **Tier 1** | No hard cap  | Still monitored by protocol            |
| **Tier 2** | ~ $50k–$100k | Ensures safety, prevents runaway pools |
| **Tier 3** | ~ $5k–$20k   | Introductory community pools           |

### 3.3. Factory-Enforced Parameters

Factory enforces:

    pool size cap

    pool type (Community only)

    risk score (Tier → risk tier)

    APY multiplier

    allowed borrower classes (future)

    required KYC/verification (future)

Creators cannot override these.

---

## 4. Deposit Flow

1. LP approves stablecoin (USDC or chain-native stable)
2. Calls:
deposit(amount)
3. Pool mints LP shares:
    shares = amount / supplyIndex

4. Shares represent claim on:

    principal

    yield

    incentives

5. Event emitted:
    Deposit(lp, amount, shares, block.timestamp)

### 4.1. Deposit Constraints

    Tier 3 pools reject deposits exceeding cap

    Pools may have cooldown periods

    Protocol may freeze pool for safety

---

## 5. Withdraw Flow

LP calls:

    withdraw(shares)

Contract:

    Converts shares → amount

    Checks pool liquidity

    If insufficient liquidity:

        queue request

        or draw from smoothing buffer (Tier 1 only)

    Burn shares

    Send stablecoins to LP

Event:

    Withdraw(lp, shares, amount, timestamp)

### 5.1. Lock Periods (Optional)

Future version may include:

    7-day lock

    30-day lock

    Boosted APY for longer locks

---

## 6. APY Determination (On-Chain + Off-Chain Hybrid)

APY is determined by the Yield Engine, using:

### 6.1. Utilization Ratio (core)
    
    U = borrowed_liquidity / total_liquidity

### 6.2. Booking Fee Flow

Each booking contributes:

    platform fee

    chair fee share

    cancellation penalties

    property owner split (in some pools)

    smoothing buffer contributions

### 6.3. Pool Risk Tier

    Tier 1 → safe
    Tier 2 → medium
    Tier 3 → volatile

### 6.4. Platform Incentives

Allow:

    yield boosters

    referral bonuses

    seasonal multipliers

### 6.5. APY Update Logic

updateSupplyIndex() called on:

    deposits

    withdrawals

    booking settlement

    fixed intervals via keeper bot

---

## 7. Yield Distribution

### 7.1. To Liquidity Providers

Proportional to:

    LP_shares / total_shares

Across:

    interest

    booking fees

    risk margin

    multipliers

### 7.2. To Pool Creators (Pool Captains)

Tier-based share:

    Tier 1 → highest

    Tier 2 → moderate

    Tier 3 → minimal

### 7.3. To Vlossom Treasury

Stable, small cut:

    supports audits

    liquidity reinforcement

    cross-border scaling

---

## 8. Risk Isolation

### 8.1. Pool Isolation

Every community pool is completely isolated.

    No contagion

    No cascading failures

    No shared liability

### 8.2. Genesis Pool Cannot Be Risk-Stained

Rules:

    No external borrowing

    No risk exposure to community pools

    Only supports platform functions

### 8.3. Smoothing Buffer Protects LPs

Buffer absorbs:

    payout timing mismatches

    short-term liquidity dips

    Not major losses.

### 8.4. Emergency Stop Mechanisms

All pools have:

    pause

    withdrawal freeze

    rate limit

    emergency exit (partial)

These follow standard DeFi safety patterns.

---

## 9. Lifecycle of a Pool

## Phase 1 — Creation

    Factory deploys → assigns tier → registers metadata.

## Phase 2 — Live

    Accepts deposits → generates yield → LP tokens issued.

## Phase 3 — Saturation

    Cap reached (Tier 2/3) → deposits disabled.

## Phase 4 — Audit/Review

    Protocol evaluates performance.

## Phase 5 — Promotion or Demotion

A pool can:

    be upgraded (Tier 3 → Tier 2)

    be downgraded

    be closed for safety

## Phase 6 — Shutdown

    LPs withdraw → pool retired → metadata archived.

---

## 10. Technical Patterns & Best Practices

### 10.1. CEI (Checks-Effects-Interactions)

    Avoid reentrancy.

### 10.2. Minimal Proxy / Clone Factory

    Low gas cost for community pool deployment.

### 10.3. Modular Architecture

Separate:

    pool logic

    yield logic

    factory

    treasury

    smoothing

### 10.4. Role-Based Access Control

Factory controls critical operations.
Pool creators have limited permissions.

### 10.5. Upgrades

Genesis pool may use:

    UUPS proxy

    or minimal proxy with versioning

Community pools should stay immutable to prevent abuse.

---

## 11. Future Expansion Hooks

The architecture allows:

### 11.1. Credit Lines

    stylist micro-loans

    equipment financing

    salon renovation loans

### 11.2. Real-World Revenue Tokenization

    Salon owners can tokenize chair revenue.

### 11.3. Pool Fusion & Migration

    Move liquidity between pools safely.

### 11.4. Multi-Chain Liquidity Routing

    Bridge LP shares to other chains.

### 11.5. Reputation-Based Borrower Access

    Higher-rep stylists borrow at lower cost.

---

## 12. Summary

This architecture ensures:

    VLP = safe, foundational, stable

    Community pools = scalable, merit-based, viral

    Tier unlock = prestige + network effects

    Yield = real-world + stable + utilitarian

    Multiple pool types = flexible and powerful

    Risk isolation = no contagion events

    Cultural alignment = stokvel-driven

    Web2.5 UX = simple, smooth, trustworthy

This blueprint is ready for smart contract scaffolding (Document 11 → 12 → 13), backend indexing, and Claude Code implementation.

---

# 1 — DeFi & Liquidity Architecture
v1.1 Addendum — Wallet Integration, Paymaster Logic, and AA-based UX Guarantees

(This section extends the existing 11-defi-and-liquidity-architecture.md without modifying the core content.)

---

## A. Overview of What Changed After the Global Wallet Specification

The original Document 11 fully defines:

    Genesis Pool

    Tiered community pools

    Referral → percentile unlocking

    Real yield from bookings

    Stokvel-inspired dynamics

    Risk management

    Roadmap phases

v1.1 adds the missing architectural links created when we introduced:

    Global Wallet

    DeFi Tab

    Onramp/Offramp UX

    Stablecoin-only architecture

    Gasless AA wallets + Paymaster

    P2P-native financial layer

These changes do not alter the economics — they simply define HOW money enters and leaves pools in the new wallet-centric system.

---

## B. Wallet → DeFi Funding Model (New)

LP deposits now follow a single consistent flow:

### 1. User always interacts with their Global Wallet first.

There is no direct “deposit with card” flow.

Instead:

    Fiat → Onramp → Wallet → LiquidityPool

This keeps:

    UX unified

    contracts consistent

    accounting clean

    all funds tracked through wallet history

### 2. Deposits use the user’s AA wallet to call:

    pool.deposit(amount);

### 3. Withdrawals always return to the AA wallet.

    pool.withdraw(shares) → AA wallet balance increases

---

##  C. Paymaster Implications for DeFi Interactions

Because the entire app is gasless:

### 1. All LP interactions are gas-sponsored:

    deposit

    withdraw

    claim yield

    create pool (once unlocked)

### 2. Paymaster rule set (new):

The Paymaster enforces:

    daily operation limits to prevent griefing

    pool creation restrictions (reflecting percentile unlocks)

    transaction purpose validation

    blocklist handling (risk-based)

### 3. Treasury must budget gas for:

    high-volume booking activity

    periodic yield claims

    high-frequency LP interactions from power users

Result: DeFi feels completely Web2-smooth.

---

## D. Yield → Wallet Integration (New)

All yield streams now route to the Global Wallet, not to a separate DeFi balance.

### How yield is paid out:

    Yield Engine → LiquidityPool → AA Wallet (USDC)

### Wallet Display:

    fiat-converted view (default)

    stablecoin balance (secondary)

    transaction category: “DeFi Yield”

### Brand Layer (light):

Yield entries appear with soft, growth-inspired language in UI:

    “Your liquidity blossomed: +R128.40 yield earned this week.”    

---

## E. How Onramp/Offramp Integrates Into DeFi (New)

Onramp → LP Flow

If user tries to stake but lacks balance:

    Stake attempt → “Add Funds” → onramp → wallet → stake completes

No multi-step friction.

### Offramp After Withdrawal

User withdraws from pool:

    LP → wallet (USDC)
    wallet → withdraw (ZAR/NGN/USD/etc.)

Full circle, clean traceability.

---

## F. P2P + DeFi Interplay (New)

Because wallet supports P2P:

Users can:

    Send yield to friends (“gift yield”)

    LPs can redistribute community rewards inside their pool

    Pool captains can be tipped by members

All via simple:

    Wallet → Send → @username

No DeFi contract changes required — this is wallet-level UX.

---

## G. DeFi Tab UX Rules (New)

To align with the new wallet-based flow, the DeFi tab must:

### Show:

    Total staked

    Total yield

    Pool list (VLP + unlocked community pools)

    Pool caps + APY bands

    Referral percentile

    “Create Pool” button (only when eligible)

### Allow:

    stake/unstake from wallet

    view yield history

    see pool health metrics

### Soft Brand Layer:

The DeFi tab uses the “growth from rest” tonal language:

    “Your liquidity is cultivating steady growth.”

    “Community pools thrive when nurtured together.”

    “Your referrals have unlocked new garden tiers.”

This is light-touch brand integration, not a rewrite.

---

## H. Contract Architecture Alignment With Wallet Changes (New)

### 1. Deposits originate from AA Wallet

Pool contract must validate:

    msg.sender == AA wallet address, not user EOA

### 2. Paymaster whitelist

    DeFi contracts must be callable by paymaster-sponsored user operations.

### 3. Treasury + Paymaster gas model

Contracts do not change, but:

    events include metadata for gas budgeting

    backend indexer coordinates deposits/withdrawals

    treasury funding schedule supports DeFi volume

### 4. No change to yield engine or APY model

All unchanged:

    utilization-based APY

    pool-tier multipliers

    region multipliers

Only settlement rails changed.

---

## I. Delta Summary (What Changed Compared to Original Document 11)

Added:

    wallet→DeFi funding path

    paymaster rules for DeFi interactions

    yield → wallet distribution

    unified transaction history categories

    P2P + DeFi social dynamics

    DeFi tab guidelines

    AA wallet + contract interaction rules

    brand-light language guidelines

Not changed:

    All original economics, pool tiers, yield logic, stokvel philosophy, risk framework, roadmap remain exactly as previously defined.

---

## J. Final Statement

This v1.1 Addendum ensures the DeFi system:

    integrates seamlessly with the Global Wallet

    supports gasless UX

    matches stablecoin-based settlement

    preserves the stokvel-inspired mechanics

    aligns technically with Smart Contract Architecture v2

    aligns experientially with Vlossom’s emerging brand

This now brings Document 11 into full alignment with:

    Document 13 (Smart Contracts v2)

    Document 15 (Frontend UX v1.1)

    The unified wallet system

    The brand strategy (“Vlossom is where you blossom”)



















































































