-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'ASSIGNED', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('SERVICE_NOT_DELIVERED', 'POOR_QUALITY', 'LATE_ARRIVAL', 'NO_SHOW', 'PROPERTY_DAMAGE', 'PAYMENT_ISSUE', 'COMMUNICATION_ISSUE', 'SAFETY_CONCERN', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeResolution" AS ENUM ('FULL_REFUND_CUSTOMER', 'PARTIAL_REFUND', 'NO_REFUND', 'SPLIT_FUNDS', 'STYLIST_PENALTY', 'CUSTOMER_WARNING', 'MUTUAL_CANCELLATION', 'ESCALATED_TO_LEGAL');

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('FIRST_BOOKING', 'TEN_BOOKINGS', 'FIFTY_BOOKINGS', 'HUNDRED_BOOKINGS', 'PERFECT_TPS_MONTH', 'FIVE_STAR_STREAK', 'PUNCTUALITY_PRO', 'TOP_REFERRER', 'COMMUNITY_BUILDER', 'EARLY_ADOPTER', 'VERIFIED_STYLIST', 'PREMIUM_HOST', 'MASTER_BRAIDER', 'HOLIDAY_HERO', 'SUMMER_STAR');

-- CreateEnum
CREATE TYPE "PoolTier" AS ENUM ('GENESIS', 'TIER_1', 'TIER_2', 'TIER_3');

-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "TextureClass" AS ENUM ('TYPE_1A', 'TYPE_1B', 'TYPE_1C', 'TYPE_2A', 'TYPE_2B', 'TYPE_2C', 'TYPE_3A', 'TYPE_3B', 'TYPE_3C', 'TYPE_4A', 'TYPE_4B', 'TYPE_4C', 'MIXED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PatternFamily" AS ENUM ('STRAIGHT', 'WAVY', 'CURLY', 'COILY', 'KINKY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ThreeLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "LoadFactor" AS ENUM ('LIGHT', 'STANDARD', 'HEAVY');

-- CreateEnum
CREATE TYPE "RoutineType" AS ENUM ('GROWTH', 'REPAIR', 'MAINTENANCE', 'KIDS', 'PROTECTIVE', 'TRANSITION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "HairEventCategory" AS ENUM ('HAIR_RITUAL', 'BOOKING_SERVICE', 'EDUCATION_PROMPT', 'REST_BUFFER', 'RECOVERY_WINDOW');

-- CreateEnum
CREATE TYPE "HairEventStatus" AS ENUM ('PLANNED', 'DUE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "HairInsightType" AS ENUM ('MOISTURE_NEED', 'PROTEIN_NEED', 'REST_RECOMMENDATION', 'RECOVERY_WINDOW', 'WASH_DAY_REMINDER', 'WEATHER_ALERT', 'ROUTINE_ADJUSTMENT', 'LEARNING_PROMPT', 'STYLIST_PREP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SESSION_PROGRESS';
ALTER TYPE "NotificationType" ADD VALUE 'STYLIST_ARRIVED';
ALTER TYPE "NotificationType" ADD VALUE 'CUSTOMER_ARRIVED';

-- CreateTable
CREATE TABLE "favorite_stylists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stylistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_stylists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "filedById" TEXT NOT NULL,
    "filedAgainstId" TEXT NOT NULL,
    "type" "DisputeType" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrls" JSONB NOT NULL DEFAULT '[]',
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolution" "DisputeResolution",
    "resolutionNotes" TEXT,
    "refundPercent" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "escalatedById" TEXT,
    "escalationReason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "attachmentUrls" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_xp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "stylistPoints" INTEGER NOT NULL DEFAULT 0,
    "customerPoints" INTEGER NOT NULL DEFAULT 0,
    "ownerPoints" INTEGER NOT NULL DEFAULT 0,
    "referralScore" INTEGER NOT NULL DEFAULT 0,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "streakType" TEXT NOT NULL DEFAULT 'bookings',
    "lastActivityAt" TIMESTAMP(3),
    "tier" "UserTier" NOT NULL DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_xp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "bookingId" TEXT,
    "referralId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "refereeTotalBookings" INTEGER NOT NULL DEFAULT 0,
    "refereeSpentAmount" BIGINT NOT NULL DEFAULT 0,
    "refereeIsActive" BOOLEAN NOT NULL DEFAULT false,
    "referrerXPAwarded" INTEGER NOT NULL DEFAULT 0,
    "refereeXPAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "customCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidity_pools" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "PoolTier" NOT NULL,
    "creatorId" TEXT,
    "status" "PoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalDeposits" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "totalShares" DECIMAL(30,18) NOT NULL DEFAULT 0,
    "supplyIndex" DECIMAL(30,18) NOT NULL DEFAULT 1,
    "currentAPY" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "cap" DECIMAL(20,6),
    "creatorFeeBps" INTEGER NOT NULL DEFAULT 0,
    "isGenesis" BOOLEAN NOT NULL DEFAULT false,
    "totalYieldDistributed" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "depositorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liquidity_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidity_deposits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "shares" DECIMAL(30,18) NOT NULL,
    "depositAmount" DECIMAL(20,6) NOT NULL,
    "depositIndex" DECIMAL(30,18) NOT NULL,
    "depositTxHash" TEXT,
    "lastClaimAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidity_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yield_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "amount" DECIMAL(20,6) NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yield_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defi_tier_status" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralPercentile" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "tier" "PoolTier",
    "canCreatePool" BOOLEAN NOT NULL DEFAULT false,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defi_tier_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "hair_health_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileVersion" TEXT NOT NULL DEFAULT '0.7',
    "textureClass" "TextureClass" NOT NULL DEFAULT 'UNKNOWN',
    "patternFamily" "PatternFamily" NOT NULL DEFAULT 'UNKNOWN',
    "strandThickness" "ThreeLevel",
    "densityLevel" "ThreeLevel",
    "shrinkageTendency" "ThreeLevel",
    "porosityLevel" "ThreeLevel",
    "retentionRisk" "ThreeLevel",
    "detangleTolerance" "ThreeLevel",
    "manipulationTolerance" "ThreeLevel",
    "tensionSensitivity" "ThreeLevel",
    "scalpSensitivity" "ThreeLevel",
    "washDayLoadFactor" "LoadFactor",
    "estimatedWashDayMinutes" INTEGER,
    "routineType" "RoutineType" NOT NULL DEFAULT 'UNKNOWN',
    "learningNodesUnlocked" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "hair_health_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hair_rituals" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ritualType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultDurationMinutes" INTEGER NOT NULL,
    "loadLevel" "LoadFactor" NOT NULL,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdByStylistId" TEXT,
    "educationHintId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hair_rituals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hair_ritual_steps" (
    "id" TEXT NOT NULL,
    "ritualId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "name" TEXT,
    "estimatedMinutes" INTEGER NOT NULL,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hair_ritual_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hair_calendar_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "eventCategory" "HairEventCategory" NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "loadLevel" "LoadFactor",
    "requiresRestBuffer" BOOLEAN NOT NULL DEFAULT false,
    "recommendedRestHoursAfter" INTEGER,
    "status" "HairEventStatus" NOT NULL DEFAULT 'PLANNED',
    "completionQuality" TEXT,
    "completedAt" TIMESTAMP(3),
    "linkedRitualId" TEXT,
    "linkedBookingId" TEXT,
    "linkedEducationContentId" TEXT,
    "generatedBy" TEXT,
    "recurrenceRule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hair_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hair_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "insightType" "HairInsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "displayStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayEnd" TIMESTAMP(3),
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "linkedEventId" TEXT,
    "linkedBookingId" TEXT,
    "sourceData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hair_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stylist_client_contexts" (
    "id" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "stylistUserId" TEXT NOT NULL,
    "consentGranted" BOOLEAN NOT NULL DEFAULT false,
    "consentGrantedAt" TIMESTAMP(3),
    "consentScope" JSONB NOT NULL DEFAULT '[]',
    "sharedProfileSnapshot" JSONB,
    "stylistNotes" TEXT,
    "lastServiceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stylist_client_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_stylists_userId_idx" ON "favorite_stylists"("userId");

-- CreateIndex
CREATE INDEX "favorite_stylists_stylistId_idx" ON "favorite_stylists"("stylistId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_stylists_userId_stylistId_key" ON "favorite_stylists"("userId", "stylistId");

-- CreateIndex
CREATE INDEX "disputes_bookingId_idx" ON "disputes"("bookingId");

-- CreateIndex
CREATE INDEX "disputes_filedById_idx" ON "disputes"("filedById");

-- CreateIndex
CREATE INDEX "disputes_filedAgainstId_idx" ON "disputes"("filedAgainstId");

-- CreateIndex
CREATE INDEX "disputes_assignedToId_idx" ON "disputes"("assignedToId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_priority_idx" ON "disputes"("priority");

-- CreateIndex
CREATE INDEX "disputes_createdAt_idx" ON "disputes"("createdAt");

-- CreateIndex
CREATE INDEX "dispute_messages_disputeId_idx" ON "dispute_messages"("disputeId");

-- CreateIndex
CREATE INDEX "dispute_messages_authorId_idx" ON "dispute_messages"("authorId");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_idx" ON "audit_logs"("targetType");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_idx" ON "audit_logs"("targetId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_xp_userId_key" ON "user_xp"("userId");

-- CreateIndex
CREATE INDEX "user_xp_totalXP_idx" ON "user_xp"("totalXP");

-- CreateIndex
CREATE INDEX "user_xp_tier_idx" ON "user_xp"("tier");

-- CreateIndex
CREATE INDEX "user_xp_referralScore_idx" ON "user_xp"("referralScore");

-- CreateIndex
CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");

-- CreateIndex
CREATE INDEX "user_badges_badgeType_idx" ON "user_badges"("badgeType");

-- CreateIndex
CREATE INDEX "user_badges_earnedAt_idx" ON "user_badges"("earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeType_key" ON "user_badges"("userId", "badgeType");

-- CreateIndex
CREATE INDEX "xp_events_userId_idx" ON "xp_events"("userId");

-- CreateIndex
CREATE INDEX "xp_events_eventType_idx" ON "xp_events"("eventType");

-- CreateIndex
CREATE INDEX "xp_events_category_idx" ON "xp_events"("category");

-- CreateIndex
CREATE INDEX "xp_events_createdAt_idx" ON "xp_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_refereeId_key" ON "referrals"("refereeId");

-- CreateIndex
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");

-- CreateIndex
CREATE INDEX "referrals_referralCode_idx" ON "referrals"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_userId_key" ON "referral_codes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_customCode_key" ON "referral_codes"("customCode");

-- CreateIndex
CREATE INDEX "referral_codes_code_idx" ON "referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_customCode_idx" ON "referral_codes"("customCode");

-- CreateIndex
CREATE UNIQUE INDEX "liquidity_pools_address_key" ON "liquidity_pools"("address");

-- CreateIndex
CREATE INDEX "liquidity_pools_tier_idx" ON "liquidity_pools"("tier");

-- CreateIndex
CREATE INDEX "liquidity_pools_status_idx" ON "liquidity_pools"("status");

-- CreateIndex
CREATE INDEX "liquidity_pools_isGenesis_idx" ON "liquidity_pools"("isGenesis");

-- CreateIndex
CREATE INDEX "liquidity_pools_creatorId_idx" ON "liquidity_pools"("creatorId");

-- CreateIndex
CREATE INDEX "liquidity_deposits_userId_idx" ON "liquidity_deposits"("userId");

-- CreateIndex
CREATE INDEX "liquidity_deposits_poolId_idx" ON "liquidity_deposits"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "liquidity_deposits_userId_poolId_key" ON "liquidity_deposits"("userId", "poolId");

-- CreateIndex
CREATE INDEX "yield_claims_userId_idx" ON "yield_claims"("userId");

-- CreateIndex
CREATE INDEX "yield_claims_poolId_idx" ON "yield_claims"("poolId");

-- CreateIndex
CREATE INDEX "yield_claims_createdAt_idx" ON "yield_claims"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "defi_tier_status_userId_key" ON "defi_tier_status"("userId");

-- CreateIndex
CREATE INDEX "defi_tier_status_tier_idx" ON "defi_tier_status"("tier");

-- CreateIndex
CREATE INDEX "defi_tier_status_referralPercentile_idx" ON "defi_tier_status"("referralPercentile");

-- CreateIndex
CREATE UNIQUE INDEX "hair_health_profiles_userId_key" ON "hair_health_profiles"("userId");

-- CreateIndex
CREATE INDEX "hair_health_profiles_userId_idx" ON "hair_health_profiles"("userId");

-- CreateIndex
CREATE INDEX "hair_rituals_userId_idx" ON "hair_rituals"("userId");

-- CreateIndex
CREATE INDEX "hair_rituals_ritualType_idx" ON "hair_rituals"("ritualType");

-- CreateIndex
CREATE INDEX "hair_ritual_steps_ritualId_idx" ON "hair_ritual_steps"("ritualId");

-- CreateIndex
CREATE UNIQUE INDEX "hair_ritual_steps_ritualId_stepOrder_key" ON "hair_ritual_steps"("ritualId", "stepOrder");

-- CreateIndex
CREATE INDEX "hair_calendar_events_userId_scheduledStart_idx" ON "hair_calendar_events"("userId", "scheduledStart");

-- CreateIndex
CREATE INDEX "hair_calendar_events_status_idx" ON "hair_calendar_events"("status");

-- CreateIndex
CREATE INDEX "hair_calendar_events_linkedBookingId_idx" ON "hair_calendar_events"("linkedBookingId");

-- CreateIndex
CREATE INDEX "hair_insights_userId_isDismissed_idx" ON "hair_insights"("userId", "isDismissed");

-- CreateIndex
CREATE INDEX "hair_insights_displayStart_displayEnd_idx" ON "hair_insights"("displayStart", "displayEnd");

-- CreateIndex
CREATE INDEX "stylist_client_contexts_customerUserId_idx" ON "stylist_client_contexts"("customerUserId");

-- CreateIndex
CREATE INDEX "stylist_client_contexts_stylistUserId_idx" ON "stylist_client_contexts"("stylistUserId");

-- CreateIndex
CREATE UNIQUE INDEX "stylist_client_contexts_customerUserId_stylistUserId_key" ON "stylist_client_contexts"("customerUserId", "stylistUserId");

-- AddForeignKey
ALTER TABLE "favorite_stylists" ADD CONSTRAINT "favorite_stylists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_stylists" ADD CONSTRAINT "favorite_stylists_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidity_deposits" ADD CONSTRAINT "liquidity_deposits_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "liquidity_pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yield_claims" ADD CONSTRAINT "yield_claims_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "liquidity_pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_ritual_steps" ADD CONSTRAINT "hair_ritual_steps_ritualId_fkey" FOREIGN KEY ("ritualId") REFERENCES "hair_rituals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_calendar_events" ADD CONSTRAINT "hair_calendar_events_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "hair_health_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_calendar_events" ADD CONSTRAINT "hair_calendar_events_linkedRitualId_fkey" FOREIGN KEY ("linkedRitualId") REFERENCES "hair_rituals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_calendar_events" ADD CONSTRAINT "hair_calendar_events_linkedBookingId_fkey" FOREIGN KEY ("linkedBookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hair_insights" ADD CONSTRAINT "hair_insights_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "hair_health_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stylist_client_contexts" ADD CONSTRAINT "stylist_client_contexts_profile_fkey" FOREIGN KEY ("customerUserId") REFERENCES "hair_health_profiles"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stylist_client_contexts" ADD CONSTRAINT "stylist_client_contexts_customer_fkey" FOREIGN KEY ("customerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stylist_client_contexts" ADD CONSTRAINT "stylist_client_contexts_stylist_fkey" FOREIGN KEY ("stylistUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
