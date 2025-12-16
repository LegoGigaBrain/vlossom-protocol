/**
 * Integration Test Setup
 *
 * Provides test database setup, cleanup utilities, and test app configuration.
 * Uses a separate test database or mocked Prisma client.
 */

import { PrismaClient } from '@prisma/client';
import express from 'express';
import { errorHandler, notFoundHandler } from '../middleware/error-handler';
import { correlationIdMiddleware } from '../middleware/correlation-id';
import authRouter from '../routes/auth';
import bookingsRouter from '../routes/bookings';
import walletRouter from '../routes/wallet';
import stylistsRouter from '../routes/stylists';

// Test Prisma client - can use a test database or mock
export const testPrisma = new PrismaClient();

// Test Express app
export function createTestApp(): express.Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(correlationIdMiddleware);

  // Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/bookings', bookingsRouter);
  app.use('/api/v1/wallet', walletRouter);
  app.use('/api/v1/stylists', stylistsRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Clean up test data before/after tests
 */
export async function cleanupTestData() {
  // Delete in order of dependencies
  await testPrisma.bookingStatusHistory.deleteMany({});
  await testPrisma.booking.deleteMany({});
  await testPrisma.stylistService.deleteMany({});
  await testPrisma.stylistProfile.deleteMany({});
  await testPrisma.wallet.deleteMany({});
  await testPrisma.user.deleteMany({
    where: { email: { contains: '@test.vlossom' } }
  });
}

/**
 * Generate a unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2)}@test.vlossom`;
}

/**
 * Setup before all tests
 */
export async function globalSetup() {
  // Ensure test database connection
  await testPrisma.$connect();
}

/**
 * Teardown after all tests
 */
export async function globalTeardown() {
  await cleanupTestData();
  await testPrisma.$disconnect();
}
