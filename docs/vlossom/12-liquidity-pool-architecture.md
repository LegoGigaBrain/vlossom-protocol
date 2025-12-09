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















































































