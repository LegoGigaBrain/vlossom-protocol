#!/bin/bash
# Frontend Deployment Script
# Usage: ./scripts/deploy-frontend.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

echo "=== Vlossom Frontend Deployment ==="
echo "Environment: $ENVIRONMENT"
echo "=================================="

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "Error: Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check for required tools
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Navigate to web app
cd apps/web

# Pull environment
echo "Pulling Vercel environment..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    vercel pull --yes --environment=production
else
    vercel pull --yes --environment=preview
fi

# Build
echo "Building project..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    vercel build --prod
else
    vercel build
fi

# Deploy
echo "Deploying to $ENVIRONMENT..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    URL=$(vercel deploy --prebuilt --prod)
else
    URL=$(vercel deploy --prebuilt)
fi

echo ""
echo "=== Deployment Complete ==="
echo "URL: $URL"
echo "=========================="
