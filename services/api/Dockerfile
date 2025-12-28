# Build from monorepo root to handle workspace dependencies
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy package.json files for workspace resolution
COPY packages/types/package.json ./packages/types/
COPY services/api/package.json ./services/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy Prisma schema
COPY services/api/prisma ./services/api/prisma

# Generate Prisma client with correct node_modules location
WORKDIR /app/services/api
RUN npx prisma generate

# Copy source files
WORKDIR /app
COPY packages/types ./packages/types
COPY services/api/src ./services/api/src
COPY services/api/tsconfig.json ./services/api/
COPY services/api/tsconfig.build.json ./services/api/

# Build TypeScript
WORKDIR /app/services/api
RUN pnpm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app/services/api

# Copy production files
COPY --from=builder /app/services/api/dist ./dist
COPY --from=builder /app/services/api/prisma ./prisma
COPY --from=builder /app/services/api/node_modules ./node_modules
COPY --from=builder /app/services/api/package.json ./

# Re-generate Prisma client for runtime (ensures correct binary)
RUN npx prisma generate

EXPOSE 3002

CMD ["node", "dist/index.js"]
