/**
 * Test Fixtures
 *
 * Factory functions for creating test data consistently.
 */

import { PrismaClient, ActorRole, BookingStatus, VerificationStatus, OperatingMode, LocationType } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
}

/**
 * Create a test user with authentication token
 */
export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<{
    email: string;
    password: string;
    role: ActorRole;
    displayName: string;
    walletAddress: string;
  }> = {}
): Promise<TestUser> {
  const email = overrides.email || `test.${Date.now()}@test.vlossom`;
  const password = overrides.password || 'TestPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const walletAddress = overrides.walletAddress || `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: overrides.displayName || 'Test User',
      roles: [overrides.role || ActorRole.CUSTOMER],
      verificationStatus: VerificationStatus.PENDING,
      walletAddress,
    },
  });

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '1h',
  });

  return {
    id: user.id,
    email,
    password,
    token,
  };
}

/**
 * Create a test stylist with profile and services
 */
export async function createTestStylist(
  prisma: PrismaClient,
  overrides: Partial<{
    email: string;
    displayName: string;
    services: Array<{ name: string; priceAmountCents: bigint; estimatedDurationMin: number; category: string }>;
  }> = {}
): Promise<TestUser & { profileId: string; serviceIds: string[] }> {
  const testUser = await createTestUser(prisma, {
    ...overrides,
    role: ActorRole.STYLIST,
  });

  // Create stylist profile
  const profile = await prisma.stylistProfile.create({
    data: {
      userId: testUser.id,
      bio: 'Test stylist bio',
      specialties: ['Hair', 'Makeup'],
      operatingMode: OperatingMode.HYBRID,
    },
  });

  // Create services
  const services = overrides.services || [
    { name: 'Haircut', priceAmountCents: BigInt(5000), estimatedDurationMin: 60, category: 'Hair' },
    { name: 'Styling', priceAmountCents: BigInt(3000), estimatedDurationMin: 45, category: 'Hair' },
  ];

  const serviceRecords = await Promise.all(
    services.map((service) =>
      prisma.stylistService.create({
        data: {
          stylistId: profile.id,
          name: service.name,
          priceAmountCents: service.priceAmountCents,
          estimatedDurationMin: service.estimatedDurationMin,
          category: service.category,
          isActive: true,
        },
      })
    )
  );

  return {
    ...testUser,
    profileId: profile.id,
    serviceIds: serviceRecords.map((s) => s.id),
  };
}

/**
 * Create a test customer with wallet
 */
export async function createTestCustomer(
  prisma: PrismaClient,
  overrides: Partial<{
    email: string;
    displayName: string;
    walletBalance: bigint;
  }> = {}
): Promise<TestUser & { walletId: string; walletAddress: string }> {
  const walletAddress = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`;

  const testUser = await createTestUser(prisma, {
    ...overrides,
    role: ActorRole.CUSTOMER,
    walletAddress,
  });

  // Create wallet with required salt field
  const wallet = await prisma.wallet.create({
    data: {
      userId: testUser.id,
      address: walletAddress,
      chainId: 84532, // Base Sepolia
      salt: '0x' + '0'.repeat(64), // 32-byte zero salt for testing
      isDeployed: true,
    },
  });

  return {
    ...testUser,
    walletId: wallet.id,
    walletAddress,
  };
}

/**
 * Create a test booking
 */
export async function createTestBooking(
  prisma: PrismaClient,
  customerId: string,
  stylistId: string,
  serviceId: string,
  overrides: Partial<{
    status: BookingStatus;
    scheduledStartTime: Date;
    quoteAmountCents: bigint;
  }> = {}
) {
  const service = await prisma.stylistService.findUnique({
    where: { id: serviceId },
  });

  const scheduledStartTime = overrides.scheduledStartTime || new Date(Date.now() + 24 * 60 * 60 * 1000);
  const estimatedDuration = service?.estimatedDurationMin || 60;
  const scheduledEndTime = new Date(scheduledStartTime.getTime() + estimatedDuration * 60 * 1000);
  const quoteAmountCents = overrides.quoteAmountCents || service?.priceAmountCents || BigInt(5000);
  const platformFeeCents = quoteAmountCents * BigInt(15) / BigInt(100);
  const stylistPayoutCents = quoteAmountCents - platformFeeCents;

  const booking = await prisma.booking.create({
    data: {
      customerId,
      stylistId,
      serviceId,
      status: overrides.status || BookingStatus.PENDING_STYLIST_APPROVAL,
      scheduledStartTime,
      scheduledEndTime,
      serviceType: service?.name || 'Test Service',
      serviceCategory: service?.category || 'General',
      estimatedDurationMin: estimatedDuration,
      quoteAmountCents,
      platformFeeCents,
      stylistPayoutCents,
      locationType: LocationType.CUSTOMER_HOME,
      locationAddress: '123 Test Street, Test City',
    },
    include: {
      customer: true,
      stylist: true,
      service: true,
    },
  });

  // Create initial status history
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      fromStatus: null,
      toStatus: overrides.status || BookingStatus.PENDING_STYLIST_APPROVAL,
      changedBy: customerId,
    },
  });

  return booking;
}

/**
 * Generate authentication header for a test user
 */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
