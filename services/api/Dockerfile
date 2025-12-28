# Build from monorepo root to handle workspace dependencies
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY services/api/package.json ./services/api/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy Prisma schema first
COPY services/api/prisma ./services/api/prisma

# Generate Prisma client (needs schema but not DATABASE_URL for generation)
WORKDIR /app/services/api
RUN pnpm run db:generate

# Copy remaining source code
WORKDIR /app
COPY packages/types ./packages/types
COPY services/api/src ./services/api/src
COPY services/api/tsconfig.json ./services/api/
COPY services/api/tsconfig.build.json ./services/api/
COPY tsconfig.base.json ./

# Build the API
WORKDIR /app/services/api
RUN pnpm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app/services/api

# Copy only production files
COPY --from=builder /app/services/api/dist ./dist
COPY --from=builder /app/services/api/prisma ./prisma
COPY --from=builder /app/services/api/node_modules ./node_modules
COPY --from=builder /app/services/api/package.json ./

# Expose port
EXPOSE 3002

# Start the server
CMD ["node", "dist/index.js"]
