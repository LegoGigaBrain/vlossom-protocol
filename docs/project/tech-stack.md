# Tech Stack

## Monorepo
- **Tool**: Turborepo + pnpm workspaces
- **Package scope**: @vlossom/*

## Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Component Library**: Radix UI primitives + custom design system
- **State Management**: React Context + Zustand (where needed)
- **Testing**: Vitest + React Testing Library
- **Mobile**: React Native / Expo (future)

## Backend
- **Language**: TypeScript (Node.js)
- **API Style**: tRPC or REST
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Message Queue**: Redis Streams or Kafka
- **Auth**: Privy or Web3Auth (AA-compatible)

### Backend Services
| Service | Responsibility |
|---------|---------------|
| API Gateway | Auth, routing, rate limits |
| Booking Service | Bookings, approvals, scheduling |
| Wallet Service | AA wallet info, P2P, balance sync |
| Escrow Engine | Booking → escrow → split → settlement |
| Reputation Engine | Ratings, TPS, dispute scoring |
| Notifications | Push, email, SMS |
| Property Service | Chair availability, amenities |
| Search & Discovery | Geo + availability + filtering |
| Indexer | Chain event processing |

## Smart Contracts / Web3
- **Chain**: Base (EVM L2), chain-agnostic architecture
- **Language**: Solidity
- **Tooling**: Hardhat
- **Testing**: Hardhat + TypeChain
- **Wallet**: Account Abstraction (ERC-4337)
- **Paymaster**: Custom or Stackup
- **Stablecoin**: USDC (first 2 years)

### Contract Modules
| Module | Purpose | Status |
|--------|---------|--------|
| AccountFactory | AA wallet creation | ✅ Deployed |
| BookingRegistry | Booking state machine | ✅ Deployed |
| Escrow | Payment protection | ✅ Deployed |
| ReputationRegistry | On-chain reputation anchoring | ✅ Deployed |
| PropertyRegistry | Chair rental marketplace | ✅ Deployed |
| Paymaster | Gas sponsorship | ✅ Deployed |

### DeFi Contract Modules (V4.0)
| Module | Purpose | Status |
|--------|---------|--------|
| VlossomGenesisPool | Protocol liquidity pool (VLP) | ✅ Complete |
| VlossomCommunityPool | Tier-gated community pools | ✅ Complete |
| VlossomPoolFactory | Pool deployment via minimal proxy | ✅ Complete |
| VlossomYieldEngine | Aave-style APY calculation | ✅ Complete |
| VlossomTreasury | Fee collection & distribution | ✅ Complete |
| VlossomSmoothingBuffer | Instant payout support | ✅ Complete |

## Infra & DevOps

### Hosting
| Layer | Provider |
|-------|----------|
| Frontend (Next.js) | Vercel |
| Backend APIs | AWS ECS/Fargate or Railway |
| Cron + Scheduling | AWS Lambda |
| Indexer | EC2 or k8s pod |
| Database | AWS RDS (PostgreSQL) |
| Cache | AWS ElastiCache (Redis) |

### CI/CD
- **Pipeline**: GitHub Actions
- **Stages**: Lint → TypeCheck → Test → Deploy
- **Branches**: main → Staging, release/* → Production

### Observability
- **Logging**: CloudWatch / Datadog
- **Metrics**: Prometheus + Grafana
- **Traces**: OpenTelemetry
- **Alerts**: PagerDuty
- **Analytics**: Mixpanel / PostHog

### Security
- **Secrets**: AWS Secrets Manager + KMS
- **Audits**: Halborn, OpenZeppelin, Spearbit (planned)
- **Contract Upgrades**: UUPS or TransparentUpgradeableProxy (when required)

## Chain Adapters
Vlossom uses a Chain Adapter Layer for multi-chain support:
- `BaseChainAdapter`
- `AbstractChainAdapter`

This allows switching chains without rewriting business logic.

## Network Environments
| Environment | Purpose |
|-------------|---------|
| LocalDev | Unit testing, contract development |
| Testnet | Feature testing, paymaster simulation |
| Staging | Near-production testing |
| Production | Mainnet deployment |
