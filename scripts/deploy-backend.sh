#!/bin/bash
# Backend Deployment Script
# Usage: ./scripts/deploy-backend.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

echo "=== Vlossom Backend Deployment ==="
echo "Environment: $ENVIRONMENT"
echo "=================================="

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "Error: Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check for required tools
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check Railway authentication
if ! railway whoami &> /dev/null; then
    echo "Error: Not logged into Railway. Run 'railway login' first."
    exit 1
fi

# Deploy
echo "Deploying to Railway ($ENVIRONMENT)..."
railway up --service api --environment "$ENVIRONMENT"

echo ""
echo "=== Backend Deployment Initiated ==="
echo "Check Railway dashboard for status"
echo "===================================="
