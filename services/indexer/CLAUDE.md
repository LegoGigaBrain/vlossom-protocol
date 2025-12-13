# Indexer Service

> Purpose: Chain event indexer that subscribes to on-chain events and syncs them to PostgreSQL.

## Canonical References
- [Doc 05: System Architecture Blueprint](../../docs/vlossom/05-system-architecture-blueprint.md) (Section 5 - Indexing)
- [Doc 23: DevOps and Infrastructure](../../docs/vlossom/23-devops-and-infrastructure.md)

## Key Files
- `src/index.ts` — Indexer entry point

## Indexed Events
- BookingRegistry: `BookingCreated`, `BookingApproved`, `BookingCompleted`, etc.
- Escrow: `FundsLocked`, `FundsReleased`, `FundsRefunded`
- VLP: `Deposit`, `Withdraw`, `YieldDistributed`
- Reputation: `ScoreUpdated`, `FlagAdded`
- Referrals: `ReferralRegistered`, `RewardClaimed`

## Local Conventions
- Uses viem for chain interaction
- Writes normalized data to PostgreSQL
- Pushes updates to Redis for real-time feeds
- Publishes events to Kafka/Redis Streams

## Dependencies
- Internal: `@vlossom/types`
- External: viem

## Gotchas
- Must handle block re-orgs
- Automatic gap-fill for missed blocks
- Poison queue for malformed events
- Near-instant response required for booking UX
