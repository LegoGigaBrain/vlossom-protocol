-- CreateEnum
CREATE TYPE "ActorRole" AS ENUM ('CUSTOMER', 'STYLIST', 'PROPERTY_OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OperatingMode" AS ENUM ('MOBILE', 'FIXED', 'HYBRID');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('STYLIST_BASE', 'CUSTOMER_HOME');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_STYLIST_APPROVAL', 'PENDING_CUSTOMER_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'AWAITING_CUSTOMER_CONFIRMATION', 'SETTLED', 'CANCELLED', 'DECLINED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('LOCKED', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'FAUCET_CLAIM');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_DECLINED', 'PAYMENT_CONFIRMED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'BOOKING_CANCELLED', 'BOOKING_REMINDER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "PaymasterTxStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_BALANCE', 'HIGH_USAGE', 'ERROR_RATE');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('LUXURY', 'BOUTIQUE', 'STANDARD', 'HOME_BASED');

-- CreateEnum
CREATE TYPE "PropertyApprovalMode" AS ENUM ('FULL_APPROVAL', 'NO_APPROVAL', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "ChairType" AS ENUM ('BRAID_CHAIR', 'BARBER_CHAIR', 'STYLING_STATION', 'WASH_STATION', 'MAKEUP_STATION', 'NAIL_STATION', 'GENERAL');

-- CreateEnum
CREATE TYPE "ChairStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ChairRentalMode" AS ENUM ('PER_BOOKING', 'PER_HOUR', 'PER_DAY', 'PER_WEEK', 'PER_MONTH');

-- CreateEnum
CREATE TYPE "ChairRentalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('CUSTOMER_TO_STYLIST', 'STYLIST_TO_CUSTOMER', 'PROPERTY_TO_STYLIST', 'STYLIST_TO_PROPERTY');

-- CreateEnum
CREATE TYPE "EscrowFailureStatus" AS ENUM ('PENDING_REVIEW', 'RESOLVED', 'MANUAL_INTERVENTION');

-- CreateEnum
CREATE TYPE "EscrowOperationType" AS ENUM ('LOCK', 'RELEASE', 'REFUND');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "roles" JSONB NOT NULL DEFAULT '[]',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stylist_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "specialties" JSONB NOT NULL DEFAULT '[]',
    "serviceCategories" JSONB NOT NULL DEFAULT '[]',
    "portfolioImages" JSONB NOT NULL DEFAULT '[]',
    "operatingMode" "OperatingMode" NOT NULL,
    "serviceRadius" INTEGER,
    "baseLocationLat" DOUBLE PRECISION,
    "baseLocationLng" DOUBLE PRECISION,
    "baseLocationAddress" TEXT,
    "isAcceptingBookings" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stylist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stylist_availability" (
    "id" TEXT NOT NULL,
    "stylistId" TEXT NOT NULL,
    "schedule" JSONB NOT NULL DEFAULT '{}',
    "exceptions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stylist_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stylist_services" (
    "id" TEXT NOT NULL,
    "stylistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "priceAmountCents" BIGINT NOT NULL,
    "estimatedDurationMin" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stylist_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stylistId" TEXT NOT NULL,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceCategory" TEXT NOT NULL,
    "estimatedDurationMin" INTEGER NOT NULL,
    "actualDurationMin" INTEGER,
    "scheduledStartTime" TIMESTAMP(3) NOT NULL,
    "scheduledEndTime" TIMESTAMP(3) NOT NULL,
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "locationType" "LocationType" NOT NULL,
    "locationAddress" TEXT NOT NULL,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "quoteAmountCents" BIGINT NOT NULL,
    "finalAmountCents" BIGINT,
    "platformFeeCents" BIGINT NOT NULL,
    "stylistPayoutCents" BIGINT NOT NULL,
    "propertyPayoutCents" BIGINT DEFAULT 0,
    "status" "BookingStatus" NOT NULL,
    "escrowId" TEXT,
    "escrowStatus" "EscrowStatus",
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 8453,
    "salt" TEXT NOT NULL,
    "isDeployed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "token" TEXT NOT NULL DEFAULT 'USDC',
    "counterparty" TEXT,
    "txHash" TEXT,
    "userOpHash" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_requests" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "memo" TEXT,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "payerId" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moonpay_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fiatAmount" DECIMAL(65,30) NOT NULL,
    "fiatCurrency" TEXT NOT NULL,
    "cryptoAmount" DECIMAL(65,30) NOT NULL,
    "cryptoCurrency" TEXT NOT NULL DEFAULT 'USDC',
    "paymentMethod" TEXT,
    "cardLast4" TEXT,
    "bankAccountId" TEXT,
    "bankName" TEXT,
    "accountLast4" TEXT,
    "redirectUrl" TEXT,
    "webhookData" JSONB,
    "walletTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "moonpay_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardExpMonth" INTEGER,
    "cardExpYear" INTEGER,
    "bankName" TEXT,
    "accountLast4" TEXT,
    "accountType" TEXT,
    "moonpayId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "externalId" TEXT,
    "error" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymaster_transactions" (
    "id" TEXT NOT NULL,
    "userOpHash" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "gasUsed" BIGINT NOT NULL,
    "gasPrice" BIGINT NOT NULL,
    "totalCost" BIGINT NOT NULL,
    "txHash" TEXT,
    "status" "PaymasterTxStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "paymaster_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymaster_alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "lastValue" DOUBLE PRECISION,
    "notifySlack" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "emailRecipients" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paymaster_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymaster_daily_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalTxCount" INTEGER NOT NULL DEFAULT 0,
    "successTxCount" INTEGER NOT NULL DEFAULT 0,
    "failedTxCount" INTEGER NOT NULL DEFAULT 0,
    "totalGasUsed" BIGINT NOT NULL DEFAULT 0,
    "totalCostWei" BIGINT NOT NULL DEFAULT 0,
    "avgGasPrice" BIGINT NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paymaster_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "PropertyCategory" NOT NULL DEFAULT 'STANDARD',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'ZA',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "images" JSONB NOT NULL DEFAULT '[]',
    "coverImage" TEXT,
    "operatingHours" JSONB NOT NULL DEFAULT '{}',
    "approvalMode" "PropertyApprovalMode" NOT NULL DEFAULT 'CONDITIONAL',
    "minStylistRating" DOUBLE PRECISION,
    "minTpsScore" DOUBLE PRECISION,
    "allowedCategories" JSONB NOT NULL DEFAULT '[]',
    "blockedCategories" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chairs" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChairType" NOT NULL DEFAULT 'GENERAL',
    "status" "ChairStatus" NOT NULL DEFAULT 'AVAILABLE',
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "hourlyRateCents" BIGINT,
    "dailyRateCents" BIGINT,
    "weeklyRateCents" BIGINT,
    "monthlyRateCents" BIGINT,
    "perBookingFeeCents" BIGINT,
    "rentalModesEnabled" JSONB NOT NULL DEFAULT '["PER_BOOKING"]',
    "exceptions" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chair_rental_requests" (
    "id" TEXT NOT NULL,
    "chairId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "stylistId" TEXT NOT NULL,
    "rentalMode" "ChairRentalMode" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "totalAmountCents" BIGINT NOT NULL,
    "platformFeeCents" BIGINT NOT NULL,
    "ownerPayoutCents" BIGINT NOT NULL,
    "status" "ChairRentalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "escrowId" TEXT,
    "escrowStatus" "EscrowStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chair_rental_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chair_reservations" (
    "id" TEXT NOT NULL,
    "chairId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "feeCents" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chair_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_blocklist" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "stylistId" TEXT NOT NULL,
    "reason" TEXT,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedBy" TEXT NOT NULL,

    CONSTRAINT "property_blocklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "reviewType" "ReviewType" NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "professionalismRating" INTEGER,
    "communicationRating" INTEGER,
    "cleanlinessRating" INTEGER,
    "punctualityRating" INTEGER,
    "qualityRating" INTEGER,
    "comment" VARCHAR(500),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_events" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" "ActorRole" NOT NULL,
    "bookingId" TEXT,
    "eventType" TEXT NOT NULL,
    "scoreImpact" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorType" "ActorRole" NOT NULL,
    "totalScore" INTEGER NOT NULL DEFAULT 5000,
    "tpsScore" INTEGER NOT NULL DEFAULT 5000,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 5000,
    "feedbackScore" INTEGER NOT NULL DEFAULT 5000,
    "disputeScore" INTEGER NOT NULL DEFAULT 10000,
    "completedBookings" INTEGER NOT NULL DEFAULT 0,
    "cancelledBookings" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reputation_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_failures" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "operation" "EscrowOperationType" NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "txHash" TEXT,
    "status" "EscrowFailureStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "amount" BIGINT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_failures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "stylist_profiles_userId_key" ON "stylist_profiles"("userId");

-- CreateIndex
CREATE INDEX "stylist_profiles_userId_idx" ON "stylist_profiles"("userId");

-- CreateIndex
CREATE INDEX "stylist_profiles_isAcceptingBookings_idx" ON "stylist_profiles"("isAcceptingBookings");

-- CreateIndex
CREATE UNIQUE INDEX "stylist_availability_stylistId_key" ON "stylist_availability"("stylistId");

-- CreateIndex
CREATE INDEX "stylist_availability_stylistId_idx" ON "stylist_availability"("stylistId");

-- CreateIndex
CREATE INDEX "stylist_services_stylistId_idx" ON "stylist_services"("stylistId");

-- CreateIndex
CREATE INDEX "stylist_services_category_idx" ON "stylist_services"("category");

-- CreateIndex
CREATE INDEX "stylist_services_isActive_idx" ON "stylist_services"("isActive");

-- CreateIndex
CREATE INDEX "bookings_customerId_idx" ON "bookings"("customerId");

-- CreateIndex
CREATE INDEX "bookings_stylistId_idx" ON "bookings"("stylistId");

-- CreateIndex
CREATE INDEX "bookings_serviceId_idx" ON "bookings"("serviceId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_scheduledStartTime_idx" ON "bookings"("scheduledStartTime");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_status_scheduledStartTime_idx" ON "bookings"("status", "scheduledStartTime");

-- CreateIndex
CREATE INDEX "booking_status_history_bookingId_idx" ON "booking_status_history"("bookingId");

-- CreateIndex
CREATE INDEX "booking_status_history_changedAt_idx" ON "booking_status_history"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_address_idx" ON "wallets"("address");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_txHash_key" ON "wallet_transactions"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_userOpHash_key" ON "wallet_transactions"("userOpHash");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "wallet_transactions_status_idx" ON "wallet_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_requests_recipientId_idx" ON "payment_requests"("recipientId");

-- CreateIndex
CREATE INDEX "payment_requests_status_idx" ON "payment_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "moonpay_transactions_sessionId_key" ON "moonpay_transactions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "moonpay_transactions_walletTransactionId_key" ON "moonpay_transactions"("walletTransactionId");

-- CreateIndex
CREATE INDEX "moonpay_transactions_walletId_idx" ON "moonpay_transactions"("walletId");

-- CreateIndex
CREATE INDEX "moonpay_transactions_sessionId_idx" ON "moonpay_transactions"("sessionId");

-- CreateIndex
CREATE INDEX "moonpay_transactions_status_idx" ON "moonpay_transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "saved_payment_methods_moonpayId_key" ON "saved_payment_methods"("moonpayId");

-- CreateIndex
CREATE INDEX "saved_payment_methods_userId_idx" ON "saved_payment_methods"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "paymaster_transactions_userOpHash_key" ON "paymaster_transactions"("userOpHash");

-- CreateIndex
CREATE INDEX "paymaster_transactions_createdAt_idx" ON "paymaster_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "paymaster_transactions_sender_idx" ON "paymaster_transactions"("sender");

-- CreateIndex
CREATE INDEX "paymaster_transactions_status_idx" ON "paymaster_transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "paymaster_alerts_type_key" ON "paymaster_alerts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "paymaster_daily_stats_date_key" ON "paymaster_daily_stats"("date");

-- CreateIndex
CREATE INDEX "paymaster_daily_stats_date_idx" ON "paymaster_daily_stats"("date");

-- CreateIndex
CREATE INDEX "properties_ownerId_idx" ON "properties"("ownerId");

-- CreateIndex
CREATE INDEX "properties_city_idx" ON "properties"("city");

-- CreateIndex
CREATE INDEX "properties_isActive_idx" ON "properties"("isActive");

-- CreateIndex
CREATE INDEX "properties_lat_lng_idx" ON "properties"("lat", "lng");

-- CreateIndex
CREATE INDEX "chairs_propertyId_idx" ON "chairs"("propertyId");

-- CreateIndex
CREATE INDEX "chairs_type_idx" ON "chairs"("type");

-- CreateIndex
CREATE INDEX "chairs_status_idx" ON "chairs"("status");

-- CreateIndex
CREATE INDEX "chairs_isActive_idx" ON "chairs"("isActive");

-- CreateIndex
CREATE INDEX "chair_rental_requests_chairId_idx" ON "chair_rental_requests"("chairId");

-- CreateIndex
CREATE INDEX "chair_rental_requests_propertyId_idx" ON "chair_rental_requests"("propertyId");

-- CreateIndex
CREATE INDEX "chair_rental_requests_stylistId_idx" ON "chair_rental_requests"("stylistId");

-- CreateIndex
CREATE INDEX "chair_rental_requests_status_idx" ON "chair_rental_requests"("status");

-- CreateIndex
CREATE INDEX "chair_rental_requests_startTime_idx" ON "chair_rental_requests"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "chair_reservations_bookingId_key" ON "chair_reservations"("bookingId");

-- CreateIndex
CREATE INDEX "chair_reservations_chairId_idx" ON "chair_reservations"("chairId");

-- CreateIndex
CREATE INDEX "chair_reservations_bookingId_idx" ON "chair_reservations"("bookingId");

-- CreateIndex
CREATE INDEX "chair_reservations_startTime_endTime_idx" ON "chair_reservations"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "property_blocklist_propertyId_idx" ON "property_blocklist"("propertyId");

-- CreateIndex
CREATE INDEX "property_blocklist_stylistId_idx" ON "property_blocklist"("stylistId");

-- CreateIndex
CREATE UNIQUE INDEX "property_blocklist_propertyId_stylistId_key" ON "property_blocklist"("propertyId", "stylistId");

-- CreateIndex
CREATE INDEX "reviews_revieweeId_idx" ON "reviews"("revieweeId");

-- CreateIndex
CREATE INDEX "reviews_reviewerId_idx" ON "reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "reviews_reviewType_idx" ON "reviews"("reviewType");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "reviews"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_reviewType_key" ON "reviews"("bookingId", "reviewType");

-- CreateIndex
CREATE INDEX "reputation_events_actorId_idx" ON "reputation_events"("actorId");

-- CreateIndex
CREATE INDEX "reputation_events_actorType_idx" ON "reputation_events"("actorType");

-- CreateIndex
CREATE INDEX "reputation_events_eventType_idx" ON "reputation_events"("eventType");

-- CreateIndex
CREATE INDEX "reputation_events_createdAt_idx" ON "reputation_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reputation_scores_userId_key" ON "reputation_scores"("userId");

-- CreateIndex
CREATE INDEX "reputation_scores_totalScore_idx" ON "reputation_scores"("totalScore");

-- CreateIndex
CREATE INDEX "reputation_scores_actorType_idx" ON "reputation_scores"("actorType");

-- CreateIndex
CREATE INDEX "reputation_scores_isVerified_idx" ON "reputation_scores"("isVerified");

-- CreateIndex
CREATE INDEX "escrow_failures_status_idx" ON "escrow_failures"("status");

-- CreateIndex
CREATE INDEX "escrow_failures_createdAt_idx" ON "escrow_failures"("createdAt");

-- CreateIndex
CREATE INDEX "escrow_failures_bookingId_idx" ON "escrow_failures"("bookingId");

-- AddForeignKey
ALTER TABLE "stylist_profiles" ADD CONSTRAINT "stylist_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stylist_availability" ADD CONSTRAINT "stylist_availability_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "stylist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stylist_services" ADD CONSTRAINT "stylist_services_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "stylist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "stylist_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moonpay_transactions" ADD CONSTRAINT "moonpay_transactions_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moonpay_transactions" ADD CONSTRAINT "moonpay_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_payment_methods" ADD CONSTRAINT "saved_payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chairs" ADD CONSTRAINT "chairs_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chair_rental_requests" ADD CONSTRAINT "chair_rental_requests_chairId_fkey" FOREIGN KEY ("chairId") REFERENCES "chairs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chair_rental_requests" ADD CONSTRAINT "chair_rental_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chair_reservations" ADD CONSTRAINT "chair_reservations_chairId_fkey" FOREIGN KEY ("chairId") REFERENCES "chairs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_blocklist" ADD CONSTRAINT "property_blocklist_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_failures" ADD CONSTRAINT "escrow_failures_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
