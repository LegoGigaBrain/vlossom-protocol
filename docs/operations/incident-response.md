# Incident Response Runbook

Guide for responding to production incidents in Vlossom Protocol.

## Severity Levels

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **P0 - Critical** | Service down, data loss, security breach | 15 minutes | API completely unavailable |
| **P1 - High** | Major feature broken, affecting many users | 1 hour | Payments not processing |
| **P2 - Medium** | Feature degraded, workaround available | 4 hours | Notifications delayed |
| **P3 - Low** | Minor issue, minimal impact | 24 hours | UI bug in admin panel |

## Incident Commander Checklist

### 1. Assess
- [ ] Identify the issue
- [ ] Determine severity level
- [ ] Document initial symptoms

### 2. Communicate
- [ ] Alert relevant team members
- [ ] Post in #incidents Slack channel
- [ ] Update status page (if P0/P1)

### 3. Investigate
- [ ] Check monitoring dashboards
- [ ] Review recent deployments
- [ ] Check error logs in Sentry

### 4. Mitigate
- [ ] Apply immediate fix OR
- [ ] Rollback to previous version
- [ ] Scale resources if needed

### 5. Resolve
- [ ] Verify fix in production
- [ ] Update status page
- [ ] Notify stakeholders

### 6. Post-Mortem
- [ ] Schedule post-mortem meeting
- [ ] Document timeline
- [ ] Identify root cause
- [ ] Create action items

---

## Common Incidents

### API Down / 5xx Errors

**Symptoms:**
- Health check failing
- Users seeing error pages
- Sentry alerts for 500 errors

**Investigation:**
```bash
# Check Railway logs
railway logs --service api

# Check health endpoint
curl https://api.vlossom.io/api/health

# Check database connectivity
# (via Railway dashboard)
```

**Resolution:**
1. Check recent deployments - rollback if needed
2. Check database - restart if connection issues
3. Check memory/CPU - scale up if exhausted
4. Restart service if unclear

---

### Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- Slow API responses
- Health check shows database error

**Investigation:**
```bash
# Check Railway database status
# (via Railway dashboard)

# Check connection pool
# Look for "too many connections" errors
```

**Resolution:**
1. Check if database is running
2. Verify connection string is correct
3. Check connection pool limits
4. Restart database if needed
5. Consider read replica for scaling

---

### Paymaster Out of Funds

**Symptoms:**
- Transactions failing with "insufficient funds"
- Paymaster balance alert triggered
- Users can't complete transactions

**Investigation:**
```bash
# Check paymaster balance
# Use BaseScan or admin dashboard
```

**Resolution:**
1. Fund paymaster immediately from team wallet
2. Update alert threshold if too low
3. Review burn rate and adjust budget

**Prevention:**
- Set conservative alert threshold (0.1 ETH)
- Monitor daily gas costs
- Budget for 2 weeks of operation minimum

---

### High Error Rate

**Symptoms:**
- Sentry alerts for error spike
- User complaints increasing
- Success rate dropping

**Investigation:**
1. Check Sentry for error patterns
2. Identify affected endpoints
3. Check for external service issues

**Resolution:**
1. If deployment-related: rollback
2. If external service: implement fallback
3. If data-related: fix corrupted data

---

### Payment Failures

**Symptoms:**
- Escrow transactions failing
- Users can't complete bookings
- Payment webhooks not processing

**Investigation:**
```bash
# Check blockchain status
# Check escrow contract state
# Review payment logs
```

**Resolution:**
1. Check escrow contract has sufficient allowance
2. Verify USDC contract is operational
3. Check for network congestion
4. Manual intervention if funds stuck

**Escalation:**
- Notify security team immediately
- Consider pausing new bookings
- Communicate with affected users

---

### Notification Delivery Failure

**Symptoms:**
- Users not receiving emails/SMS
- Notification status stuck on PENDING
- SendGrid/SMS provider errors

**Investigation:**
```bash
# Check SendGrid dashboard
# Check notification queue
# Verify API credentials
```

**Resolution:**
1. Check provider status page
2. Verify API keys are valid
3. Check for rate limiting
4. Retry failed notifications

---

## Rollback Procedure

### When to Rollback
- New deployment caused regression
- Error rate > 5%
- Critical functionality broken
- Security vulnerability discovered

### Vercel (Frontend)
```bash
# List recent deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-url]
```

### Railway (Backend)
1. Go to Railway dashboard
2. Select API service
3. Go to Deployments tab
4. Click "Rollback" on previous deployment

### Database
⚠️ **CAUTION: Database rollbacks can cause data loss**

1. Stop all traffic to API
2. Restore from backup
3. Verify data integrity
4. Resume traffic

---

## Communication Templates

### Status Page Update (P0/P1)
```
Investigating: [Issue description]
Time: [HH:MM UTC]
Impact: [Who is affected]
Next update in: [X minutes]
```

### Internal Slack Alert
```
🚨 INCIDENT: [Brief description]
Severity: [P0/P1/P2/P3]
Commander: [Name]
Status: [Investigating/Mitigating/Resolved]
```

### Customer Communication
```
Subject: Service Disruption - Vlossom

We're aware of issues affecting [feature] and are working to resolve them.

What's happening: [Brief description]
Who's affected: [Scope]
What we're doing: [Actions]
Expected resolution: [Time estimate]

We apologize for any inconvenience. Updates will be posted at [status page].
```

---

## Escalation Contacts

| Role | Name | Contact | When to Contact |
|------|------|---------|-----------------|
| On-Call | Rotating | #on-call Slack | All incidents |
| Tech Lead | [Name] | [Phone] | P0/P1 incidents |
| Product | [Name] | [Email] | Customer impact |
| Security | [Name] | [Phone] | Security issues |

---

## Post-Mortem Template

### Incident Summary
- **Date:**
- **Duration:**
- **Severity:**
- **Commander:**

### Timeline
| Time | Event |
|------|-------|
| HH:MM | Issue detected |
| HH:MM | Investigation started |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Service restored |

### Root Cause
[Detailed explanation of what caused the incident]

### Impact
- Users affected: X
- Revenue impact: $X
- Data loss: Y/N

### What Went Well
-

### What Could Be Improved
-

### Action Items
| Item | Owner | Due Date |
|------|-------|----------|
| | | |

---

*Last updated: December 2024*
