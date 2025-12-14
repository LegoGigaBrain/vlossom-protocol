# Reputation System - V1.5

> Placeholder for V1.5 feature specifications

## Overview

The Reputation system enables trust and quality tracking through:
- Customer reviews and ratings
- Time Performance Score (TPS) for stylists
- On-chain reputation registry (Soulbound Tokens)
- Rewards engine based on reputation tiers

## Planned Features

| Feature | Description | Priority |
|---------|-------------|----------|
| ReputationRegistry Contract | On-chain reputation storage | P0 |
| Review Models | Customer reviews with ratings | P0 |
| Review Indexer | Sync on-chain → off-chain | P0 |
| TPS Pipeline | Calculate time performance scores | P1 |
| Rewards Engine | Tier-based rewards distribution | P1 |
| SBT Mapping | Soulbound token for reputation | P2 |
| Referrals Engine | Referral tracking and rewards | P2 |

## Canonical References

- [Doc 08: Reputation and Trust System](../../vlossom/08-reputation-and-trust-system.md)
- [Doc 09: Rewards and Incentives Engine](../../vlossom/09-rewards-and-incentives-engine.md)

## Reputation Components

### Time Performance Score (TPS)

Measures stylist reliability:
- On-time arrivals/starts
- Completion within estimated duration
- Cancellation rate
- Response time to booking requests

### Review System

- 1-5 star ratings
- Written reviews (optional)
- Photo attachments
- Service-specific feedback
- Verified booking requirement

### Rewards Tiers

| Tier | TPS Range | Benefits |
|------|-----------|----------|
| Bronze | 0-69 | Base rates |
| Silver | 70-84 | 5% fee reduction |
| Gold | 85-94 | 10% fee reduction + priority |
| Platinum | 95-100 | 15% fee reduction + featured |

## Status

**Not Started** - Scheduled for V1.5 (Weeks 11-18)

---

*Created: December 14, 2025*
*Last Updated: December 14, 2025*
