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

# Install all dependencies (need to update lockfile for new esbuild dep)
RUN pnpm install --no-frozen-lockfile

# Copy Prisma schema and generate client
COPY services/api/prisma ./services/api/prisma
WORKDIR /app/services/api
RUN npx prisma generate

# Copy source files and build script
WORKDIR /app
COPY packages/types ./packages/types
COPY services/api/src ./services/api/src
COPY services/api/build.mjs ./services/api/

# Build with esbuild (fast, no type checking)
WORKDIR /app/services/api
RUN node build.mjs

# Production image
FROM node:20-alpine AS runner

# Install pnpm for production install
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy monorepo structure for pnpm workspace
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types ./packages/types

# Copy API package files
COPY --from=builder /app/services/api/package.json ./services/api/
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/prisma ./services/api/prisma

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile=false

# Generate Prisma client for Alpine
WORKDIR /app/services/api
RUN npx prisma generate

EXPOSE 3002

CMD ["node", "dist/index.js"]
