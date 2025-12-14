#!/bin/bash
# Rollback Script
# Usage: ./scripts/rollback.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

echo "=== Vlossom Rollback ==="
echo "Environment: $ENVIRONMENT"
echo "========================"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "Error: Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Confirm rollback
echo ""
echo "WARNING: You are about to rollback $ENVIRONMENT!"
echo "This will:"
echo "  1. Revert Vercel to previous deployment"
echo "  2. Revert Railway to previous deployment"
echo ""
read -p "Are you sure? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "=== Rollback Frontend ==="

# Check for Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI not installed"
    exit 1
fi

# List recent deployments
echo "Recent Vercel deployments:"
vercel ls --limit 5

echo ""
read -p "Enter deployment URL to promote (or press Enter to skip): " deploy_url

if [[ -n "$deploy_url" ]]; then
    if [[ "$ENVIRONMENT" == "production" ]]; then
        vercel promote "$deploy_url" --yes
    else
        echo "Preview deployments cannot be promoted. Deploy a specific commit instead."
    fi
fi

echo ""
echo "=== Rollback Backend ==="

# Check for Railway CLI
if ! command -v railway &> /dev/null; then
    echo "Error: Railway CLI not installed"
    exit 1
fi

echo ""
echo "Railway rollback must be done manually:"
echo "  1. Go to Railway dashboard"
echo "  2. Select the API service"
echo "  3. Go to Deployments tab"
echo "  4. Click 'Rollback' on a previous deployment"
echo ""
echo "Railway Dashboard: https://railway.app/dashboard"

echo ""
echo "=== Database Rollback ==="
echo ""
echo "If database migrations need to be reverted:"
echo "  1. Identify the migration to revert"
echo "  2. Create a new migration that undoes the changes"
echo "  3. Test in staging first"
echo ""
echo "WARNING: Database rollbacks can cause data loss!"
echo "Consider restoring from backup instead."

echo ""
echo "=== Rollback Complete ==="
echo "Please verify:"
echo "  [ ] Frontend is working"
echo "  [ ] API health check passes"
echo "  [ ] Critical functionality works"
echo "=========================="
