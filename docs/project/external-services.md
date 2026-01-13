# External Services Registry

> **Purpose**: Track all external services, their costs, and API key locations for the Vlossom Protocol.
>
> **Last Updated**: January 2, 2026

---

## Summary

| Category | Service | Status | Monthly Cost Estimate |
|----------|---------|--------|----------------------|
| Database | PostgreSQL (Railway/Supabase) | Production | $20-50 |
| Cache | Redis Cloud | Production | $0-30 |
| Blockchain | Alchemy RPC | Production | $0-49 |
| Blockchain | Pimlico Bundler | Production | Pay-per-use |
| Maps | Google Maps Platform | Production | $0-200 |
| Maps | Mapbox (Web) | Production | $0-50 |
| Analytics | PostHog | Optional | $0 (free tier) |
| Error Tracking | Sentry | Optional | $0-26 |
| Email | SendGrid | Production | $0-20 |
| SMS | Clickatell | Optional | Pay-per-use |
| Fiat On-Ramp | Transak | Production | 0% (user pays) |
| Fiat On-Ramp | Kotani Pay | Production | 0% (user pays) |
| Image Storage | Cloudinary | Production | $0 (free tier) |
| Auth | Privy | Production | $0-99 |
| Hosting | Vercel | Production | $0-20 |
| Hosting | Railway | Production | $5-50 |

**Estimated Total**: $25-500/month depending on usage

---

## 1. Database & Cache

### PostgreSQL
- **Provider Options**: Railway, Supabase, Neon, AWS RDS
- **Purpose**: Primary database for users, bookings, transactions
- **Pricing**:
  - Railway: $5/month + usage
  - Supabase: Free tier (500MB), $25/month (8GB)
  - AWS RDS: ~$15-50/month
- **Env Var**: `DATABASE_URL`
- **Location**: `.env`, `services/api/.env`

### Redis
- **Provider Options**: Redis Cloud, Upstash, AWS ElastiCache
- **Purpose**: Rate limiting, session caching, real-time features
- **Pricing**:
  - Redis Cloud: Free tier (30MB), $7/month (250MB)
  - Upstash: Pay-per-request ($0.2 per 100K)
- **Env Var**: `REDIS_URL`
- **Location**: `.env`, `services/api/.env`

---

## 2. Blockchain Infrastructure

### Alchemy (RPC Provider)
- **Website**: https://www.alchemy.com/
- **Purpose**: Blockchain RPC endpoints for Arbitrum & Base
- **Pricing**:
  - Free tier: 300M compute units/month
  - Growth: $49/month (1.5B compute units)
- **Networks Used**:
  - Arbitrum Sepolia (testnet) - Primary
  - Base Sepolia (testnet) - Legacy
  - Arbitrum Mainnet (future)
- **Env Vars**:
  - `NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL`
  - `NEXT_PUBLIC_ARB_MAINNET_RPC_URL`
  - `RPC_URL` (API)
- **Location**: `apps/web/.env`, `services/api/.env`

### Pimlico (Account Abstraction Bundler)
- **Website**: https://pimlico.io/
- **Purpose**: ERC-4337 bundler for gasless transactions
- **Pricing**:
  - Free tier: 100 UserOps/day
  - Pro: $99/month (10K UserOps/day)
  - Enterprise: Custom
- **Env Var**: `BUNDLER_URL`
- **Location**: `services/api/.env`
- **Note**: Critical for gasless UX - monitor usage carefully

---

## 3. Maps & Location

### Google Maps Platform
- **Website**: https://cloud.google.com/maps-platform
- **Purpose**:
  - Mobile map display (React Native Maps)
  - Travel time calculation (Directions API)
  - Geocoding
- **APIs Used**:
  - Maps SDK for iOS/Android
  - Directions API
  - Geocoding API
  - Places API (future)
- **Pricing**:
  - $200/month free credit
  - Maps: $7 per 1,000 loads
  - Directions: $5 per 1,000 requests
  - Geocoding: $5 per 1,000 requests
- **Env Var**: `GOOGLE_MAPS_API_KEY`
- **Location**: `services/api/.env`, `apps/mobile/app.config.js`
- **Billing Alert**: Set up at $100 and $200 thresholds

### Mapbox (Web Only)
- **Website**: https://www.mapbox.com/
- **Purpose**: Web map display with custom styling
- **Pricing**:
  - Free tier: 50,000 map loads/month
  - Pay-as-you-go: $5 per 1,000 loads after
- **Env Var**: `NEXT_PUBLIC_MAPBOX_TOKEN`
- **Location**: `apps/web/.env`
- **Note**: Consider migrating to Google Maps for consistency with mobile

---

## 4. Monitoring & Analytics

### Sentry (Error Tracking)
- **Website**: https://sentry.io/
- **Purpose**: Error tracking for web, API, and mobile
- **Pricing**:
  - Free tier: 5K errors/month
  - Team: $26/month (100K errors)
- **Env Vars**:
  - `NEXT_PUBLIC_SENTRY_DSN` (web)
  - `SENTRY_DSN` (API)
- **Location**: `apps/web/.env`, `services/api/.env`
- **Files**:
  - `apps/web/sentry.client.config.ts`
  - `apps/web/sentry.server.config.ts`
  - `services/api/src/lib/monitoring/sentry.ts`

### PostHog (Product Analytics)
- **Website**: https://posthog.com/
- **Purpose**: User behavior analytics, feature flags, session recordings
- **Pricing**:
  - Free tier: 1M events/month
  - Scale: Pay-as-you-go after
- **Env Vars**:
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`
- **Location**: `apps/web/.env`
- **Files**: `apps/web/lib/posthog.ts`

---

## 5. Communications

### SendGrid (Email)
- **Website**: https://sendgrid.com/
- **Purpose**: Transactional emails (booking confirmations, password reset)
- **Pricing**:
  - Free tier: 100 emails/day
  - Essentials: $20/month (50K emails)
- **Env Vars**:
  - `SENDGRID_API_KEY`
  - `SENDGRID_FROM_EMAIL`
  - `SENDGRID_FROM_NAME`
- **Location**: `services/api/.env`

### Clickatell (SMS)
- **Website**: https://www.clickatell.com/
- **Purpose**: SMS notifications for South African market
- **Pricing**:
  - Pay-per-message (~$0.02-0.05 per SMS)
- **Env Var**: `CLICKATELL_API_KEY`
- **Location**: `services/api/.env`
- **Note**: Optional - can use email as primary channel

---

## 6. Fiat On/Off-Ramp

### Transak
- **Website**: https://transak.com/
- **Purpose**: Fiat-to-crypto on-ramp for funding wallet
- **Pricing**:
  - 0% platform fee (user pays Transak's fee: ~1-5%)
- **Env Vars**:
  - `NEXT_PUBLIC_TRANSAK_API_KEY`
  - `NEXT_PUBLIC_TRANSAK_ENVIRONMENT` (STAGING/PRODUCTION)
- **Location**: `apps/web/.env`
- **Integration**: `apps/web/lib/fiat-ramp/`

### Kotani Pay (Africa-focused)
- **Website**: https://kotanipay.com/
- **Purpose**: Mobile money & bank on/off-ramp for Africa
- **Pricing**:
  - 0% platform fee (user pays transaction fee)
- **Env Vars**: (API-side integration)
- **Location**: `services/api/.env`
- **Files**:
  - `services/api/src/lib/kotani/kotani-client.ts`
  - `apps/web/lib/fiat-ramp/kotani-adapter.ts`

### MoonPay (Backup)
- **Website**: https://moonpay.com/
- **Purpose**: Alternative fiat on/off-ramp
- **Status**: Mock mode (not yet integrated)
- **Env Vars**:
  - `MOONPAY_MODE` (mock/production)
  - `MOONPAY_API_KEY`
  - `MOONPAY_SECRET_KEY`
- **Location**: `services/api/.env`

---

## 7. Media Storage

### Cloudinary
- **Website**: https://cloudinary.com/
- **Purpose**: Portfolio images, avatar uploads
- **Pricing**:
  - Free tier: 25K transformations, 25GB storage
  - Plus: $89/month (more storage/bandwidth)
- **Env Vars**:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- **Location**: `services/api/.env`

---

## 8. Authentication

### Privy
- **Website**: https://privy.io/
- **Purpose**: Social login, email auth, embedded wallets
- **Pricing**:
  - Free tier: 1,000 users
  - Growth: $99/month (10K users)
- **Env Vars**:
  - `PRIVY_APP_ID`
  - `PRIVY_APP_SECRET`
- **Location**: `.env`
- **Note**: Currently using custom JWT auth - Privy for future embedded wallets

### WalletConnect
- **Website**: https://walletconnect.com/
- **Purpose**: External wallet connections (MetaMask, etc.)
- **Pricing**: Free
- **Env Var**: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- **Location**: `apps/web/.env`
- **Dashboard**: https://cloud.walletconnect.com/

---

## 9. Hosting & Deployment

### Vercel (Web Frontend)
- **Website**: https://vercel.com/
- **Purpose**: Next.js web app hosting
- **Pricing**:
  - Free tier: Hobby projects
  - Pro: $20/month (commercial use)
- **Features Used**:
  - Edge functions
  - Preview deployments
  - Analytics
- **Config**: `apps/web/vercel.json`

### Railway (API & Services)
- **Website**: https://railway.app/
- **Purpose**: API, Scheduler, Indexer hosting
- **Pricing**:
  - Hobby: $5/month + usage
  - Pro: $20/month + usage
- **Services**:
  - `services/api` - Express REST API
  - `services/scheduler` - Background jobs
  - `services/indexer` - Blockchain indexer
  - PostgreSQL database
  - Redis cache

---

## 10. Development Tools

### Hardhat (Local Blockchain)
- **Purpose**: Local development, contract deployment
- **Pricing**: Free (open source)
- **Config**: `contracts/hardhat.config.ts`

### Prisma (ORM)
- **Purpose**: Database migrations, type-safe queries
- **Pricing**: Free (open source)
- **Config**: `services/api/prisma/schema.prisma`

---

## API Key Security

### Production Keys Location
All production keys should be stored in:
1. **Vercel Environment Variables** (web frontend)
2. **Railway Environment Variables** (backend services)
3. **AWS Secrets Manager** (optional, for relayer private key)

### Never Commit
The following should NEVER be in git:
- `.env` files (only `.env.example`)
- Private keys
- API secrets
- Database URLs with credentials

### Rotation Schedule
| Service | Rotation Frequency | Last Rotated |
|---------|-------------------|--------------|
| JWT_SECRET | Every 90 days | - |
| RELAYER_PRIVATE_KEY | As needed | - |
| SENDGRID_API_KEY | Every 180 days | - |
| CLOUDINARY_API_SECRET | Every 180 days | - |

---

## Cost Monitoring

### Monthly Budget Alerts
Set up alerts at these thresholds:
- **Google Maps**: $100, $200
- **Alchemy**: 80% of tier limit
- **Pimlico**: 80% of daily quota
- **Vercel**: Bandwidth limits
- **Railway**: $50, $100

### Cost Optimization Tips
1. **Google Maps**: Use map caching, batch geocoding requests
2. **Pimlico**: Batch UserOps where possible
3. **Sentry**: Configure sampling rates for high-traffic endpoints
4. **Cloudinary**: Use responsive images, lazy loading

---

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                       VLOSSOM STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│  │  Vercel  │     │ Railway  │     │ Railway  │            │
│  │  (Web)   │────▶│  (API)   │────▶│  (DB)    │            │
│  └──────────┘     └──────────┘     └──────────┘            │
│       │                │                │                   │
│       ▼                ▼                ▼                   │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│  │  Mapbox  │     │  Redis   │     │ Postgres │            │
│  └──────────┘     └──────────┘     └──────────┘            │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│  │ Alchemy  │◀────│ Pimlico  │     │ Cloudinary│           │
│  │  (RPC)   │     │(Bundler) │     │ (Images) │            │
│  └──────────┘     └──────────┘     └──────────┘            │
│                                                             │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│  │ SendGrid │     │ Transak  │     │  Sentry  │            │
│  │ (Email)  │     │(On-Ramp) │     │ (Errors) │            │
│  └──────────┘     └──────────┘     └──────────┘            │
│                                                             │
│  ┌──────────┐     ┌──────────┐                             │
│  │ PostHog  │     │  Google  │                             │
│  │(Analytics│     │  Maps    │                             │
│  └──────────┘     └──────────┘                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist: Production Launch

- [ ] All production API keys configured
- [ ] Billing alerts set up for all paid services
- [ ] Rate limiting configured (Redis required)
- [ ] Error tracking active (Sentry)
- [ ] Analytics active (PostHog)
- [ ] Email sending verified (SendGrid)
- [ ] On-ramp tested end-to-end (Transak/Kotani)
- [ ] Map billing verified (Google Maps)
- [ ] Database backups configured
- [ ] SSL certificates active

---

*This document should be updated whenever a new external service is added or pricing changes.*
