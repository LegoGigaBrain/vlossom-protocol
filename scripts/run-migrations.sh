#!/bin/bash
# Database Migration Script
# Usage: ./scripts/run-migrations.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

echo "=== Vlossom Database Migrations ==="
echo "Environment: $ENVIRONMENT"
echo "==================================="

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "Error: Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Confirm production migrations
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo ""
    echo "WARNING: You are about to run migrations on PRODUCTION!"
    read -p "Are you sure? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Check for DATABASE_URL
if [[ -z "$DATABASE_URL" ]]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Set it using:"
    echo "  export DATABASE_URL=postgresql://..."
    exit 1
fi

# Navigate to API service
cd services/api

# Check for pending migrations
echo "Checking for pending migrations..."
pnpm prisma migrate status

# Run migrations
echo ""
echo "Running migrations..."
pnpm prisma migrate deploy

echo ""
echo "=== Migrations Complete ==="
echo "=========================="
