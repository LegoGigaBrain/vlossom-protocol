# 21 — Security & Risk Register

Comprehensive Security, Risk, Abuse Prevention & Operational Safety Framework for Vlossom Protocol

---

## 1. Purpose of This Document

This file defines the full security posture of the Vlossom ecosystem across:

    Smart contracts

    Account abstraction + gasless infrastructure

    Onramp / offramp

    Payments & escrow

    Backend services & APIs

    Database & PII

    Role-based permissions

    Booking system integrity

    Reputation system fraud prevention

    Property owner–stylist interactions

    DeFi + liquidity pools

    App-level abuse prevention

This is both:

    A security design spec for the engineering team

    An audit preparation document for external reviewers

    A risk register used for ongoing monitoring

---

## 2. Security Philosophy

### 2.1 Trust by Design

Users interact with money, time, reputation, and real-world services.
Safety must extend from blockchain → app → physical world.

### 2.2 Minimize Attack Surface

    Highly modular smart contracts

    Strict access control

    Minimal external dependencies

    Verified pricing snapshots

    Limited on-chain storage

### 2.3 Human + Technical Safety

Real-world beauty services introduce risks beyond code:
no-shows, unsafe homes, unreliable landlords, etc.

This register captures both.

### 2.4 Continuous Monitoring

Security is not a one-time deliverable.

A structured risk register enables:

    tracking

    mitigation

    detection

    response

    improvement

---

## 3. Risk Categories

    Smart Contract Security

    Account Abstraction + Paymaster Risks

    Escrow & Settlement Safety

    Onramp / Offramp Risks

    Backend & Database Security

    Authentication & Identity

    Booking Flow Integrity

    Reputation & Review Fraud

    Property Owner–Stylist Conflicts

    Customer Safety & Abuse Prevention

    Financial Risk & Liquidity Pools

    Operational Risks

    Compliance & Regulatory

    Physical Safety Risks (real-world services)

Each category below includes:

    Risk Description

    Severity

    Likelihood

    Mitigation

    Monitoring

---

## 4. Smart Contract Security Risks

### 4.1 Reentrancy Attacks

Description:
Attackers exploit reentrant calls during settlement.

Mitigation:

    OpenZeppelin ReentrancyGuard

    Checks-Effects-Interactions pattern

    No external callbacks in escrow logic

Monitoring:

    Automated scanning (Slither, Echidna)

    Test suite invariant coverage

### 4.2 Price Manipulation / Incorrect Settlement

Description:
If pricing were calculated on-chain, attackers could manipulate inputs.

Mitigation:

    All pricing precomputed off-chain

    Immutable pricing snapshot stored at booking creation

    Escrow contract uses stored pricing only

### 4.3 Unauthorized Access

Description:
Actors calling functions they should not.

Mitigation:

    Role-based access via AccessControl

    bookingId ownership checks

    Only AA wallet can trigger user actions

### 4.4 Oracle Dependency

Description:
If oracles provide pricing, KYC, or identity data, they can be compromised.

Mitigation:

    Minimal oracle usage

    Oracle actions limited to writing hashed reputation snapshots

    Multi-sig approval for oracle key rotation

### 4.5 Pool Draining (DeFi)

Description:
LP funds drained due to incorrect accounting or malicious logic.

Mitigation:

    Pools isolated

    No cross-pool transfer

    Hard caps per pool tier

    Independent audits before activation

---

## 5. Account Abstraction + Paymaster Risks

### 5.1 Paymaster Drain

Description:
Attackers spam transactions to drain sponsored gas.

Mitigation:

    Daily tx limits per wallet

    Rate limiting via paymaster policy

    Require minimum reputation for certain actions

    Reject transactions calling unknown contracts

### 5.2 Stolen Device Risk

Description:
If a phone is stolen, attacker may trigger actions.

Mitigation:

    Device binding

    Biometric unlock for critical actions

    Session key timeouts

### 5.3 AA Wallet Exploits

Description:
Smart contract wallets introduce complexity.

Mitigation:

    Use audited ERC-4337 compliant factory

    Minimal custom logic in wallets

    Fallback guardian & recovery mechanisms

---

## 6. Escrow & Settlement Risks

### 6.1 Double-Spend or Double-Release

Mitigation:

    Escrow state machine enforces one settlement

    Settlement event emitted once

    Reentrancy guard

### 6.2 Incorrect Refund Path

Bad refund logic can overpay customers or stylists.

Mitigation:

    Refund matrix encoded in config

    All refund scenarios unit-tested

    Immutable refund rule snapshot stored per booking

### 6.3 Instant Payout Timing Risk

If stylist is paid immediately but customer funds fail to settle.

Mitigation:

    Smoothing buffer

    VLP short-term liquidity

    Strict repayment rules

---

## 7. Onramp / Offramp Risks

### 7.1 Onramp Provider Failure

Mitigation:

    Multiple providers integrated

    Reconciliation logs stored off-chain

    Failover to different onramp

### 7.2 Delayed Fiat Settlement

Mitigation:

    Smoothing buffer

    OnrampOracleAdapter event reconciliation

### 7.3 Chargebacks / Fraudulent Cards

Mitigation:

    Escrow prevents early release

    Refund timeline delayed until card settles

    Blacklist users for repeated chargebacks

---

## 8. Backend & Database Security

### 8.1 PII Leakage

Mitigation:

    Field-level encryption

    No sensitive data on-chain

    Zero personal info in events

    GDPR-style deletion capabilities

### 8.2 API Abuse

Mitigation:

    API key rotation

    HMAC signed booking requests

    Rate limiting

    Abuse detection via IP + device fingerprinting

### 8.3 Indexer Compromise

Mitigation:

    Indexer writes only non-critical data

    Critical values anchored on-chain

    Backup indexer nodes

---

## 9. Authentication & Identity Risks

### 9.1 Account Takeover

Mitigation:

    Passkeys

    Social login with device binding

    Multi-factor patterns (email OTP + device)

### 9.2 Fake Stylist or Fake Property Owner

Mitigation:

    Required minimum reputation before receiving bookings

    Optional ID verification step

    Risk scoring for brand new accounts

### 9.3 Sybil Attacks (Fake referrals)

Mitigation:

    Unique device fingerprint

    Risk engine checks for linked identities

    Referral fraud detection

---

## 10. Booking Flow Integrity Risks

### 10.1 Stylist Accepting but Intending Not to Show Up

Mitigation:

    TPS (Time Performance Score)

    Auto-penalties

    Auto-reassignment suggestions

    Low TPS hides stylist from search

### 10.2 Customer Cancels at Last Minute

Mitigation:

    Cancellation fees

    Stylist compensation rules

    Dynamic penalties

### 10.3 Property Owner Rejects After Stylist Accepts

Mitigation:

    Property approval timeout

    Clear ordering: stylist acceptance → property acceptance

    Auto-refund if property rejects

### 10.4 Special Event Miscommunication

Mitigation:

Multi-quote system

Written agreement snapshot

Locked-in multi-day pricing

---

## 11. Reputation & Review Fraud

### 11.1 Fake Reviews

Mitigation:

    Only allowed after completed booking

    One review per booking

    Multi-actor review mapping

### 11.2 Stylist-Property Review Collusion

Mitigation:

    Weighting of reviews based on booking types

    Sudden rating spikes flagged

### 11.3 Revenge Reviews

Mitigation:

    NLP sentiment analysis (future)

    Weight reduction of outlier reviews

---

## 12. Property Owner–Stylist Safety Risk

### 2.1 Unsafe Salons

Mitigation:

    Amenity verification

    Reviews from stylists

    Risk engine hides unsafe salons

### 12.2 Predatory Property Owners

Mitigation:

    Automated approval rules

    Minimum pricing transparency

    Dispute system

    P2P refunds logged

### 12.3 Stylist Blocklist

Properties maintain:

    stylist blocklist

    allowlist

    min reputation

---

## 13. Customer Safety Risks

### 13.1 Unsafe Home Environments

Stylists going mobile may face risk.

Mitigation:

    Address validation

    “Trusted Customer” tier

    Panic button (Phase 3)

### 13.2 Aggressive or Abusive Customers

Mitigation:

    Blocklist

    Support escalation

    Pattern detection

---

## 14. Financial & DeFi Risks

### 14.1 Liquidity Pool Abuse

Mitigation:

    Caps per pool

    Withdrawal cooldowns

    Tiered permissions

    Audits

### 14.2 Referral Abuse for Pool Creation

Mitigation:

    Referral fraud detection

    Minimum revenue threshold

    Minimum active users referred

### 14.3 Yield Manipulation

Mitigation:

    Transparent yield calculation

    Non-custodial predictable engine

---

## 15. Operational Risks

### 15.1 Data Loss

Mitigation:

    Daily backups

    Multi-region redundancy

    Encrypted snapshots

### 15.2 Deployment Errors

Mitigation:

    CI/CD with automated tests

    Deployment previews

    Rollback mechanisms

### 15.3 Team Access Abuse

Mitigation:

    Role separation

    Multi-sig treasury

    Logging & auditing

---

## 16. Compliance & Legal Risks

### 16.1 Money Transmission

Wallet + P2P + onramp/offramp = regulatory concerns.

Mitigation:

    Partner with licensed onramp/offramp providers

    Avoid custody of fiat

    DeFi opt-in with non-custodial structure

### 16.2 Data Privacy Laws

Mitigation:

    User-controlled data deletion

    Pseudonymous blockchain storage

    Strong consent flows

### 16.3 Tax Reporting

Mitigation:

    Exportable transaction history

    Optional business receipts

    Future API integration with tax tools

---

## 17. Real-World / Physical Safety Risks

These are unique because Vlossom enables physical appointments.

### 17.1 Stylist Personal Safety

Mitigation:

    Verified address

    Only allow mobile bookings for customers with good history

    Panic button

### 17.2 Property Safety

Mitigation:

    Damage report flow

    Insurance partnerships (future)

    Escrow holds for certain events

### 17.3 Customer Safety

Mitigation:

    Verified stylists

    Ratings from previous customers

    Studio-grade salon profiles

    In-app support

---

## 18. Monitoring Framework

Each risk has:

    Indicator (metric or trigger)

    Threshold

    Response action

    Escalation path

Examples:

| Risk                | Indicator                     | Threshold    | Action                        |
| ------------------- | ----------------------------- | ------------ | ----------------------------- |
| Paymaster drain     | gas spend spike               | >3× baseline | auto-disable non-critical ops |
| Fake referrals      | multiple accounts same device | 3+           | flag + rate limit             |
| Unsafe salons       | falling review average        | <3.0         | hide from search              |
| Stylists cancelling | high TPS penalty              | 20%          | reduce ranking                |

---

## 19. Summary

The Vlossom Security & Risk Register provides:

    complete coverage of smart contracts

    AA wallet + paymaster protections

    escrow & settlement safety

    customer/stylist/property real-world safety

    reputation integrity

    DeFi risk containment

    compliance guidance

    operational safeguards

This document becomes the foundation for:

    audits

    testing plans

    backend architecture

    admin tooling

    internal monitoring











