#!/bin/bash
# Vlossom API - Quick Setup Script

set -e

echo "🌸 Vlossom API Setup"
echo "===================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi
echo "✓ Node.js $(node -v)"

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing..."
    npm install -g pnpm
fi
echo "✓ pnpm $(pnpm -v)"

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Please ensure it's installed and running"
    echo "   Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:14"
fi
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Important: Update .env with:"
    echo "   - DATABASE_URL"
    echo "   - Contract addresses (after deployment)"
    echo "   - JWT_SECRET and INTERNAL_AUTH_SECRET"
    echo "   - RELAYER_PRIVATE_KEY (after generating)"
    echo ""
    read -p "Press enter when ready to continue..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm db:generate
echo "✅ Prisma client generated"
echo ""

# Ask about migration
echo "🗄️  Database migration"
read -p "Do you want to run database migrations? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm db:migrate
    echo "✅ Migrations completed"
else
    echo "⚠️  Skipping migrations - run 'pnpm db:migrate' when ready"
fi
echo ""

# Success message
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Verify DATABASE_URL in .env"
echo "  2. Run migrations: pnpm db:migrate"
echo "  3. Start dev server: pnpm dev"
echo "  4. API will be available at http://localhost:3002"
echo ""
echo "Useful commands:"
echo "  pnpm dev        - Start development server"
echo "  pnpm db:studio  - Open Prisma Studio"
echo "  pnpm typecheck  - Check TypeScript types"
echo ""
