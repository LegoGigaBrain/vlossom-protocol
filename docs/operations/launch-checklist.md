# Beta Launch Checklist

Pre-launch verification checklist for Vlossom Protocol beta release.

## Infrastructure

### Database
- [ ] Production PostgreSQL provisioned (Railway)
- [ ] Connection string configured in secrets
- [ ] Backup schedule configured (daily)
- [ ] Read replica set up (if needed)

### Hosting
- [ ] Vercel project created for frontend
- [ ] Railway service created for backend
- [ ] Custom domain configured (vlossom.io)
- [ ] SSL certificates valid and auto-renewing

### CDN & Media
- [ ] Cloudinary account configured
- [ ] Upload presets created
- [ ] Image transformations tested

### Environment Variables

**Frontend (Vercel):**
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_CHAIN_ID` (84532 for Base Sepolia)
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`

**Backend (Railway):**
- [ ] `DATABASE_URL`
- [ ] `JWT_SECRET` (rotated from dev)
- [ ] `SENTRY_DSN`
- [ ] `POSTHOG_API_KEY`
- [ ] `GOOGLE_MAPS_API_KEY`
- [ ] `SENDGRID_API_KEY`
- [ ] `CLOUDINARY_*` credentials
- [ ] `SLACK_WEBHOOK_URL` (for alerts)

---

## Smart Contracts

### Deployment
- [ ] VlossomAccountFactory deployed to Base Sepolia
- [ ] VlossomPaymaster deployed and funded
- [ ] Escrow contract deployed
- [ ] Mock USDC contract deployed (testnet)

### Verification
- [ ] All contracts verified on BaseScan
- [ ] Contract addresses documented
- [ ] ABI files exported to frontend

### Funding
- [ ] Paymaster deposit balance: minimum 0.5 ETH
- [ ] Low balance alert configured (0.1 ETH threshold)
- [ ] Refill procedure documented

---

## Security

### Authentication
- [ ] JWT secret rotated from development
- [ ] Password hashing configured (bcrypt)
- [ ] Account lockout after 5 failed attempts
- [ ] Session timeout configured

### Rate Limiting
- [ ] Login: 5 requests / 15 minutes
- [ ] Signup: 3 requests / hour
- [ ] Bookings: 20 requests / hour
- [ ] Faucet: 1 request / 24 hours
- [ ] Global: 100 requests / minute

### Headers
- [ ] CORS configured for production domain
- [ ] Security headers enabled (helmet.js)
- [ ] CSP configured
- [ ] HSTS enabled

### Audit
- [ ] `pnpm audit` - no critical/high vulnerabilities
- [ ] Dependencies up to date
- [ ] No secrets in codebase
- [ ] .env files in .gitignore

---

## Monitoring

### Error Tracking (Sentry)
- [ ] Sentry project created
- [ ] DSN configured in environment
- [ ] Source maps uploaded
- [ ] Alert rules configured:
  - [ ] Error spike (>10 in 5 min)
  - [ ] Slow transactions (p95 > 2s)
  - [ ] Payment errors (any)

### Analytics (PostHog)
- [ ] PostHog project created
- [ ] Events firing correctly:
  - [ ] user_signup
  - [ ] booking_created
  - [ ] booking_completed
  - [ ] wallet_funded
  - [ ] faucet_claimed
- [ ] Dashboard created

### Health Checks
- [ ] `/api/health` endpoint active
- [ ] Database connectivity verified
- [ ] Blockchain connectivity verified
- [ ] Uptime monitoring configured (e.g., BetterStack)

### Paymaster Dashboard
- [ ] Admin access configured
- [ ] Stats loading correctly
- [ ] Alerts configured

---

## Testing

### Automated Tests
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Contract tests passing
- [ ] CI pipeline green

### Manual Testing
- [ ] Customer signup flow
- [ ] Stylist signup flow
- [ ] Booking creation
- [ ] Payment flow (faucet → book → complete)
- [ ] Cancellation flow
- [ ] Notification delivery (email)

### Cross-Browser
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (mobile/iOS)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast sufficient

---

## Documentation

### Internal
- [ ] API documentation updated
- [ ] Deployment runbook complete
- [ ] Incident response plan documented
- [ ] Rollback procedure documented

### External
- [ ] Help center published
- [ ] Getting started guide complete
- [ ] FAQ complete
- [ ] Terms of service published
- [ ] Privacy policy published

---

## Team Readiness

### Contacts
- [ ] On-call schedule established
- [ ] Escalation path documented
- [ ] Slack channel for incidents

### Access
- [ ] Team has Vercel access
- [ ] Team has Railway access
- [ ] Team has Sentry access
- [ ] Team has database access (read-only)

---

## Launch Day Checklist

### T-24 Hours
- [ ] Final database backup
- [ ] Review monitoring dashboards
- [ ] Verify all team contacts
- [ ] Send "heads up" to beta users

### T-0 (Launch)
- [ ] Deploy production build
- [ ] Verify health checks
- [ ] Monitor error rates
- [ ] Test critical paths manually
- [ ] Announce to beta users

### T+1 Hour
- [ ] Check error rate < 1%
- [ ] Review first signups
- [ ] Monitor paymaster balance
- [ ] Check notification delivery

### T+24 Hours
- [ ] Analyze first-day metrics
- [ ] Address any critical bugs
- [ ] Send welcome email to users
- [ ] Update team on status

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | | | |
| Product | | | |
| QA | | | |
| Security | | | |

---

*Last updated: December 2024*
