# Rollback Procedure

Step-by-step guide for rolling back deployments in Vlossom Protocol.

## When to Rollback

Rollback immediately if:
- Error rate exceeds 5%
- Critical functionality broken (payments, auth)
- Security vulnerability discovered
- Data corruption detected

## Pre-Rollback Checklist

- [ ] Confirm the issue is deployment-related
- [ ] Identify the last known good version
- [ ] Notify team in #incidents channel
- [ ] Prepare to monitor after rollback

---

## Frontend Rollback (Vercel)

### Option 1: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and select project
2. Navigate to **Deployments** tab
3. Find the last working deployment
4. Click the **"..."** menu
5. Select **"Promote to Production"**
6. Confirm the promotion

### Option 2: Vercel CLI

```bash
# List recent deployments
vercel ls

# Output shows deployments with URLs and status
# Find the URL of the last good deployment

# Promote to production
vercel promote [deployment-url] --yes
```

### Option 3: Git Revert

```bash
# Revert the problematic commit
git revert HEAD

# Push to trigger new deployment
git push origin main
```

### Verification

```bash
# Check the site loads
curl -I https://vlossom.io

# Check for JavaScript errors
# Open browser console on https://vlossom.io

# Test critical flows
# - Login page loads
# - Stylists page loads
# - Wallet page loads
```

---

## Backend Rollback (Railway)

### Option 1: Railway Dashboard

1. Go to [railway.app](https://railway.app) and select project
2. Select the **API** service
3. Go to **Deployments** tab
4. Find the last working deployment
5. Click **"Rollback"**
6. Confirm the rollback

### Option 2: Git Revert

```bash
# Revert the problematic commit
git revert HEAD

# Push to trigger new deployment
git push origin main

# Railway will automatically deploy
```

### Verification

```bash
# Check health endpoint
curl https://api.vlossom.io/api/health

# Expected response:
# {"status":"healthy","version":"x.x.x",...}

# Test critical endpoints
curl https://api.vlossom.io/api/stylists
curl https://api.vlossom.io/api/auth/health
```

---

## Database Rollback

⚠️ **DANGER: Database rollbacks can cause data loss. Only proceed if absolutely necessary.**

### When to Consider Database Rollback

- Corrupted data affecting multiple users
- Failed migration that broke application
- Security breach requiring data restoration

### Pre-Requisites

1. Stop all traffic to the API
2. Notify all team members
3. Have database credentials ready
4. Know the backup timestamp to restore

### Rollback Steps

#### 1. Stop Traffic

```bash
# Scale Railway service to 0
# (via Railway dashboard)
```

#### 2. Identify Backup

```bash
# List available backups
# (Railway dashboard → Database → Backups)

# Or via psql:
# Check point-in-time recovery options
```

#### 3. Restore Backup

**Railway Managed Database:**
1. Go to Railway dashboard
2. Select database service
3. Go to **Backups** tab
4. Select backup to restore
5. Click **Restore**
6. Wait for completion (may take several minutes)

**Manual Restore:**
```bash
# If you have a pg_dump backup
psql $DATABASE_URL < backup.sql
```

#### 4. Verify Data Integrity

```bash
# Connect to database
psql $DATABASE_URL

# Check key tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM wallets;

# Verify recent data exists
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

#### 5. Resume Traffic

```bash
# Scale Railway service back up
# (via Railway dashboard)
```

#### 6. Monitor

- Check health endpoint
- Monitor error rates
- Verify user complaints resolved

---

## Migration Rollback

### If Migration Failed Mid-Way

```bash
# Check migration status
cd services/api
pnpm prisma migrate status

# If migration is partially applied, may need manual intervention
# Consult the specific migration file for rollback SQL
```

### Rollback a Successful Migration

1. Create a new migration that reverses the changes
2. Test in staging first
3. Deploy the reversal migration

```bash
# Generate migration
pnpm prisma migrate dev --name rollback_xyz

# Edit the generated SQL to reverse the changes

# Deploy
pnpm prisma migrate deploy
```

---

## Smart Contract Considerations

⚠️ **Smart contracts cannot be rolled back.** However:

### If Contract Bug Discovered

1. **Pause the contract** (if pausable)
   - Use admin function to pause
   - Prevents new transactions

2. **Deploy new version**
   - Fix the bug
   - Deploy new contract
   - Update frontend to use new address

3. **Migrate state** (if needed)
   - Export data from old contract
   - Import to new contract
   - May require admin functions

### Paymaster Issues

If paymaster has issues:
1. Fund a backup paymaster
2. Update bundler configuration
3. Deploy new paymaster if needed

---

## Post-Rollback

### Immediate Actions

1. Verify service is stable
2. Update status page
3. Notify team of resolution
4. Monitor for 30+ minutes

### Follow-Up

1. Schedule post-mortem
2. Identify root cause
3. Fix the underlying issue
4. Add tests to prevent recurrence
5. Re-deploy with fix

---

## Rollback Contacts

| System | Primary | Backup |
|--------|---------|--------|
| Frontend (Vercel) | [Name] | [Name] |
| Backend (Railway) | [Name] | [Name] |
| Database | [Name] | [Name] |
| Smart Contracts | [Name] | [Name] |

---

## Rollback History

Track all rollbacks for reference:

| Date | System | Reason | Duration | Resolved By |
|------|--------|--------|----------|-------------|
| | | | | |

---

*Last updated: December 2024*
