# 23 — DevOps & Infrastructure

Deployment Architecture, Runtime Environments, Observability, Indexing, CI/CD & Operational Reliability for Vlossom Protocol

---

## 1. Purpose of This Document

This document defines the operational, infrastructural, and deployment architecture required to run Vlossom in production:

    Runtime environments (mobile app + backend + chain interactions)

    API gateway + microservices structure

    Smart contract deployment & monitoring

    Indexers and data pipelines

    CI/CD pipelines

    Observability (logging, monitoring, alerting)

    Security posture (secrets management, access control, backups)

    Disaster recovery

    Release management

    Cost optimization

    Chain adapter setup (Base / Abstract)

This ensures:

    Vlossom is stable

    Vlossom scales

    The chain integration is reliable

    Booking & escrow flows never break

    Paymaster cost is predictable

    Wallet actions remain gasless

This is the operational blueprint for engineering, SRE, and Claude Code agent workflows

---

## 2. Architectural Overview

Vlossom’s technical stack has four major layers:

### 2.1 Client Layer

Mobile app (iOS/Android built via React Native or Expo)

Web client (Next.js frontend for stylists/property dashboards & LP UX)

Admin panel (React dashboard)

### 2.2 Backend Layer

A microservice-oriented backend:

| Service                   | Responsibility                            |
| ------------------------- | ----------------------------------------- |
| **API Gateway**           | Auth, routing, rate limits                |
| **Booking Service**       | Bookings, approvals, scheduling logic     |
| **Payments Service**      | Onramp/offramp, fiat <-> USDC sync        |
| **Wallet Service**        | User AA wallet info, P2P, balance sync    |
| **Escrow Engine**         | Booking → escrow → split → settlement     |
| **Reputation Engine**     | Ratings, TPS, dispute resolution scoring  |
| **Notifications Service** | Push notifications, emails, SMS           |
| **DeFi Service**          | LP staking, yield calc, pool unlock logic |
| **Property Service**      | Chair availability, amenities, rules      |
| **Search & Discovery**    | Geolocation + availability + filtering    |
| **Risk Engine**           | Fraud detection, anomaly detection        |
| **Admin Panel Backend**   | Logs, moderation tools                    |

All services communicate through:

    gRPC (internal high-speed calls)

    Kafka or Redis Streams (events & async pipelines)

    PostgreSQL + Redis caching layer

---

## 3. Chain Environment Layer (Base or Abstract)

All chain interactions are isolated behind a Chain Adapter Layer, supporting:

BaseChainAdapter

AbstractChainAdapter

This lets us switch chains later with zero rewrite of business logic.

### Supported chain functionality:

| Functionality               | Provided by chain adapter    |
| --------------------------- | ---------------------------- |
| AA wallet creation          | ✔ (AccountFactory interface) |
| Gas sponsorship (Paymaster) | ✔                            |
| Stablecoin transfer         | ✔                            |
| Smart contract calls        | ✔                            |
| Event subscriptions         | ✔                            |
| Indexer sync state          | ✔                            |

### Network Environments

| Environment    | Purpose                                          |
| -------------- | ------------------------------------------------ |
| **LocalDev**   | Unit testing, contracts development              |
| **Testnet**    | Feature testing, paymaster simulation            |
| **Staging**    | Near-production; canonical stablecoin test image |
| **Production** | Mainnet deployment                               |

Chain RPC providers:

    Base: Alchemy / Infura / Quicknode

    Abstract: Native infra / custom RPC gateways

---

## 4. Smart Contract Deployment Strategy

### 4.1 Deployments are Versioned

Contracts deploy into:

    contracts/v1/ (MVP)

    contracts/v2/ (DeFi activation)

    contracts/v3/ (Subscriptions, multi-sig modules)

Each version has:

    Deployment manifest

    ABI artifact

    Storage layout snapshot

    Verification script

    Chain adapter bindings

### 4.2 Zero-Downtime Contract Upgrades

Critical contracts (BookingRegistry, Escrow, Paymaster) use:

    UUPS or TransparentUpgradeableProxy (OpenZeppelin) only if required

Otherwise we prefer new versions + migration path for safety.

### 4.3 Deployment Pipeline

Deploy contracts via:

    Hardhat or Foundry

    Automated scripts in CI

    Manual gate for production deploys

    Pre-deploy simulation (Tenderly, Foundry Anvil)

### 4.4 Observability for On-Chain

We monitor:

    Contract event emissions

    Gas usage per function

    Paymaster drain rate

    Booking lifecycle anomalies

    Error logs via Tenderly

---

## 5. Indexing & Data Pipelines

Vlossom uses a custom indexer (via Node + TypeScript or Rust), not relying solely on The Graph.

### Why:

    bookings have unique state machine transitions

    escrow events must reconcile reliably

    chair availability + property rules must be merged into booking engine

    referral lineage needs custom handling

    TPS algorithm uses timestamps + sequential data

    we need real-time near-instant responses

### Indexer Responsibilities

Subscribe to:

        BookingRegistry events

        Escrow events

        VLP events

        Reputation events

        Referral registry events

    Write normalized data to PostgreSQL

    Push updates to Redis for real-time feeds

    Publish events to Kafka/Redis Streams for backend services

### Indexer Outputs

    Booking state timeline

    Payment settlement timeline

    Actor reputation caches

    Earnings summaries

    LP yield snapshots

    Property availability updates

### Retry & Failure Handling

    Block re-org detection

    Automatic gap-fill

    Poison queue for malformed events

---

## 6. Infrastructure Environment Setup

Hosting / Compute

Options:

    AWS (EKS or ECS)

    Railway / Render (early phase)

    Fly.io (global edge presence)

    Vercel (frontend)

Recommended production setup:

| Layer                 | Infra                    |
| --------------------- | ------------------------ |
| Frontend (Next.js)    | Vercel                   |
| Mobile backend (APIs) | AWS ECS/Fargate          |
| Cron + scheduling     | AWS Lambda               |
| Indexer               | EC2 or k8s pod           |
| Databases             | AWS RDS (Postgres)       |
| Redis caching         | AWS ElastiCache          |
| Logging               | CloudWatch + S3 archival |
| Analytics             | Mixpanel / PostHog       |

---

## 7. CI/CD & Release Management

## 7.1 CI Pipeline (GitHub Actions)

Runs:

    Linting

    TypeScript checks

    Unit tests

    Contract tests (Hardhat / Foundry)

    Deployment dry-runs

## 7.2 CD Pipeline

Based on merge into protected branches:

    main → Staging deploy

    release/* → Production candidate

    Manual approval → Production deploy

## 7.3 Mobile App Releases

    EAS (Expo Application Services)

    Versioned OTA updates

    Critical fixes delivered via OTA

---

## 8. Logging, Monitoring & Alerts

### 8.1 Observability Stack

    Logging: CloudWatch / Datadog

    Metrics: Prometheus + Grafana

    Alerts: PagerDuty

    Traces: OpenTelemetry

### 8.2 Critical Alerts

    Booking engine delays

    Escrow mismatch

    Paymaster low balance

    Indexer behind > N blocks

    High dispute rate

    Fraud patterns detected

### 8.3 Mobile Analytics

Track:

    onboarding

    booking drop-off

    wallet top-up rate

    P2P usage patterns

    DeFi interactions

    LP unlock progression

---

## 9. Security & Secrets

### 9.1 Secrets Management

    AWS Secrets Manager

    KMS-encrypted keys

Secrets include:

    Paymaster private keys

    Onramp/offramp partner tokens

    Admin user credentials

    Chain RPC keys

### 9.2 Access Control

    Principle of least privilege

    All admin actions logged

    Multi-sig required for sensitive operations

### 9.3 Pen Testing & Audits

    Smart contract audits (Halborn, OpenZeppelin, Spearbit, Code4rena)

    Backend penetration testing

    Mobile app security assessment

---

## 10. Paymaster Infrastructure (Gasless Transactions)

Vlossom sponsors all user gas through:

### 10.1 Paymaster Funding Strategy

    Treasury auto-top-up

    Daily/weekly budget limits

    Alerts for low balance

    Rate-limits per user

### 10.2 Paymaster State Monitoring

Track:

    avg gas spent per booking

    gas per region

    potential abuse patterns

    anomalous tx attempts

---

## 11. Disaster Recovery Strategy

### Backups

    Postgres snapshots (daily)

    Redis snapshot (hourly)

    S3 archive for logs (immutable)

### Recovery Plan

    Restore DB → Restart indexer → Replay missing blocks

    Cold backup environment available

    Failover region (optional Phase 2)

### Smart Contract Recovery

    All critical contracts have emergency pause

    Multisig-controlled config updates

    Paymaster emergency off-switch

---

## 12. Cost Optimization & Scaling

### Stage 1 — MVP

    Minimize infra cost via Render/Fly

    Serverless workloads where possible

    Small indexer instance

### Stage 2 — Growth

    Move to AWS ECS/Kubernetes

    Introduce Redis clustering

    Horizontal scaling of API services

### Stage 3 — Global Expansion

    Multiregion deployments

    Geo-distributed indexers

    CDN-backed media

---

## 13. Summary

Document 23 formally defines how Vlossom runs in production:

    Chain interactions are stable and abstracted

    Booking & escrow flows have guaranteed consistency

    Indexing is resilient

    Paymaster is monitored and safe

    Deployments are versioned and controlled

    Admin operations are auditable

    Infra is scalable and secure

This provides the operational backbone for:

    Engineering

    Support

    SRE

    Claude Code automation






















































































