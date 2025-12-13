# Product Roadmap

## 0. Current Stage
**Concept / Pre-Development**

Repository scaffolding and initial architecture setup in progress.

---

## 1. Now (0-3 months) — Foundations & MVP Core

### Phase 0: Foundations (Weeks 0-2)
- Monorepo setup (Turborepo + pnpm)
- AA wallet infrastructure (Stackup or custom)
- Paymaster stub implementation
- Chain adapter (Base/Abstract placeholder)
- Claude Code agent workflow setup
- PostgreSQL + Prisma schema
- CI/CD pipeline (GitHub Actions)

### Phase 1: Account Layer + Wallet (Weeks 2-5)
- Full AA wallet lifecycle
- Gasless operations via Paymaster
- Stablecoin (USDC) integration
- Wallet microservice
- P2P send/receive transfers
- QR request/pay flows
- Global wallet history

### Phase 2: Booking & Scheduling Engine (Weeks 5-10)
- BookingRegistry smart contract
- Escrow contract
- Stylist approval flow (MVP: no property owner)
- Scheduling engine with conflict detection
- Location routing (mobile vs fixed)
- Appointment state machine
- Notifications for all transitions

---

## 2. Next (3-9 months) — Property, Reputation & DeFi

### Phase 3: Property Owner & Chair Module (Weeks 10-13)
- Property & Chair registry
- Approval rules + blocklist
- Chair availability UI + APIs
- Chair rental payout routing
- Hybrid approval logic (property-level)

### Phase 4: Reputation, Reviews & Rewards (Weeks 13-16)
- ReputationRegistry contract
- Review models + indexer
- TPS (Time Performance Score) pipeline
- Rewards engine + SBT mapping
- Referrals engine

### Phase 5: DeFi Layer v1 (Weeks 16-20)
- VLP (Vlossom Liquidity Pool) contract
- Deposit/withdraw flows
- Simple yield model
- LP dashboard integration
- Referral → LP unlock logic

---

## 3. Later (9+ months) — Frontend, Beta & Expansion

### Phase 6: Frontend Deep Build (Weeks 20-28)
- All UX flows assembled
- Wallet, booking, stylist, property dashboards
- Notifications center
- DeFi tab
- Design system tokens applied

### Phase 7: Beta Launch (Weeks 28-36)
- Limited geographic rollout (SA cities)
- Real-world testing
- Monitoring dashboards
- Bug bounties
- Paymaster cost analysis

### Future Expansion
- Special events full flow
- Business sub-accounts
- Salon treasury multi-sig
- Subscription manager
- Nails, makeup verticals
- Educational & product marketplace
- Tokenized salon financing
- Cross-chain DeFi routing

---

## 4. Non-Goals (Not in MVP)

- Full property owner involvement in booking approval
- Chair rental with complex pricing tiers
- Special events with custom quote builder
- Travel fees and cross-border bookings
- DeFi/LP integration in booking flow
- Reputation display (tracked but hidden)
- Multi-chain deployment
- Salon business accounts
- Subscription plans
- Educational content marketplace
