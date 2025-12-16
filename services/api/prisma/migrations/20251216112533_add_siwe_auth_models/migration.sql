-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'ETHEREUM');

-- CreateTable
CREATE TABLE "idempotent_requests" (
    "key" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotent_requests_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "external_auth_providers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_auth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linked_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "identifier" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linked_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siwe_nonces" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "address" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "siwe_nonces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idempotent_requests_expiresAt_idx" ON "idempotent_requests"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "external_auth_providers_address_key" ON "external_auth_providers"("address");

-- CreateIndex
CREATE INDEX "external_auth_providers_userId_idx" ON "external_auth_providers"("userId");

-- CreateIndex
CREATE INDEX "external_auth_providers_address_idx" ON "external_auth_providers"("address");

-- CreateIndex
CREATE UNIQUE INDEX "external_auth_providers_provider_address_key" ON "external_auth_providers"("provider", "address");

-- CreateIndex
CREATE INDEX "linked_accounts_userId_idx" ON "linked_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "linked_accounts_userId_provider_identifier_key" ON "linked_accounts"("userId", "provider", "identifier");

-- CreateIndex
CREATE UNIQUE INDEX "linked_accounts_provider_identifier_key" ON "linked_accounts"("provider", "identifier");

-- CreateIndex
CREATE UNIQUE INDEX "siwe_nonces_nonce_key" ON "siwe_nonces"("nonce");

-- CreateIndex
CREATE INDEX "siwe_nonces_nonce_idx" ON "siwe_nonces"("nonce");

-- CreateIndex
CREATE INDEX "siwe_nonces_expiresAt_idx" ON "siwe_nonces"("expiresAt");

-- AddForeignKey
ALTER TABLE "external_auth_providers" ADD CONSTRAINT "external_auth_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
