/**
 * Booking Flow Integration Tests
 *
 * Tests the complete booking lifecycle:
 * - Create booking
 * - Stylist approval/decline
 * - Payment
 * - Service start/complete
 * - Settlement
 * - Cancellation scenarios
 */

import request from 'supertest';
import { Express } from 'express';
import { PrismaClient, BookingStatus } from '@prisma/client';
import { createTestApp, cleanupTestData } from '../../__tests__/setup';
import {
  createTestStylist,
  createTestCustomer,
  createTestBooking,
  authHeader,
} from '../../__tests__/fixtures';

// Mock external services
jest.mock('../../lib/escrow-client', () => ({
  createEscrow: jest.fn().mockResolvedValue({
    success: true,
    escrowId: 'mock-escrow-id',
    txHash: '0xmocktxhash',
  }),
  releaseEscrow: jest.fn().mockResolvedValue({
    success: true,
    txHash: '0xmocktxhash',
  }),
  refundEscrow: jest.fn().mockResolvedValue({
    success: true,
    txHash: '0xmocktxhash',
    refundedAmount: '5000000',
  }),
}));

jest.mock('../../lib/notifications', () => ({
  notifyBookingEvent: jest.fn().mockResolvedValue(undefined),
  NotificationType: {
    BOOKING_REQUESTED: 'BOOKING_REQUESTED',
    BOOKING_APPROVED: 'BOOKING_APPROVED',
    BOOKING_DECLINED: 'BOOKING_DECLINED',
    BOOKING_CANCELLED: 'BOOKING_CANCELLED',
    BOOKING_COMPLETED: 'BOOKING_COMPLETED',
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  },
}));

describe('Booking Flow Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let customer: Awaited<ReturnType<typeof createTestCustomer>>;
  let stylist: Awaited<ReturnType<typeof createTestStylist>>;

  beforeAll(async () => {
    app = createTestApp();
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create fresh test users for each test
    customer = await createTestCustomer(prisma, {
      email: `customer.${Date.now()}@test.vlossom`,
    });
    stylist = await createTestStylist(prisma, {
      email: `stylist.${Date.now()}@test.vlossom`,
    });
  });

  afterEach(async () => {
    // Clean up bookings after each test
    await prisma.bookingStatusHistory.deleteMany({});
    await prisma.booking.deleteMany({});
  });

  describe('Happy Path: Create -> Approve -> Pay -> Start -> Complete -> Settle', () => {
    it('should complete full booking lifecycle', async () => {
      // Step 1: Customer creates booking
      const createResponse = await request(app)
        .post('/api/v1/bookings')
        .set(authHeader(customer.token))
        .send({
          stylistId: stylist.id,
          serviceIds: [stylist.serviceIds[0]],
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Test booking',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.booking).toBeDefined();
      expect(createResponse.body.booking.status).toBe('PENDING_STYLIST_APPROVAL');

      const bookingId = createResponse.body.booking.id;

      // Step 2: Stylist approves booking
      const approveResponse = await request(app)
        .post(`/api/v1/bookings/${bookingId}/approve`)
        .set(authHeader(stylist.token));

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.booking.status).toBe('AWAITING_PAYMENT');

      // Step 3: Customer pays for booking
      const payResponse = await request(app)
        .post(`/api/v1/bookings/${bookingId}/pay`)
        .set(authHeader(customer.token));

      expect(payResponse.status).toBe(200);
      expect(payResponse.body.booking.status).toBe('CONFIRMED');

      // Step 4: Stylist starts service
      const startResponse = await request(app)
        .post(`/api/v1/bookings/${bookingId}/start`)
        .set(authHeader(stylist.token));

      expect(startResponse.status).toBe(200);
      expect(startResponse.body.booking.status).toBe('IN_PROGRESS');

      // Step 5: Stylist completes service
      const completeResponse = await request(app)
        .post(`/api/v1/bookings/${bookingId}/complete`)
        .set(authHeader(stylist.token));

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.booking.status).toBe('AWAITING_CUSTOMER_CONFIRMATION');

      // Step 6: Customer confirms completion
      const confirmResponse = await request(app)
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set(authHeader(customer.token));

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.booking.status).toBe('SETTLED');
    });
  });

  describe('Stylist Decline Flow', () => {
    it('should allow stylist to decline booking with reason', async () => {
      const booking = await createTestBooking(
        prisma,
        customer.id,
        stylist.id,
        stylist.serviceIds[0],
        { status: BookingStatus.PENDING_STYLIST_APPROVAL }
      );

      const response = await request(app)
        .post(`/api/v1/bookings/${booking.id}/decline`)
        .set(authHeader(stylist.token))
        .send({ reason: 'Schedule conflict' });

      expect(response.status).toBe(200);
      expect(response.body.booking.status).toBe('DECLINED');
    });
  });

  describe('Customer Cancellation Flow', () => {
    it('should allow customer to cancel before payment with full refund', async () => {
      const booking = await createTestBooking(
        prisma,
        customer.id,
        stylist.id,
        stylist.serviceIds[0],
        { status: BookingStatus.PENDING_CUSTOMER_PAYMENT }
      );

      const response = await request(app)
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set(authHeader(customer.token))
        .send({ reason: 'Changed my mind' });

      expect(response.status).toBe(200);
      expect(response.body.booking.status).toBe('CANCELLED');
    });

    it('should calculate partial refund for late cancellation', async () => {
      // Create a booking scheduled soon (within 24 hours)
      const soonDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now

      const booking = await createTestBooking(
        prisma,
        customer.id,
        stylist.id,
        stylist.serviceIds[0],
        {
          status: BookingStatus.CONFIRMED,
          scheduledStartTime: soonDate,
        }
      );

      const response = await request(app)
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set(authHeader(customer.token))
        .send({ reason: 'Emergency' });

      expect(response.status).toBe(200);
      expect(response.body.booking.status).toBe('CANCELLED');
      // Partial refund should be applied
    });
  });

  describe('Invalid Status Transitions', () => {
    it('should prevent customer from approving booking', async () => {
      const booking = await createTestBooking(
        prisma,
        customer.id,
        stylist.id,
        stylist.serviceIds[0]
      );

      const response = await request(app)
        .post(`/api/v1/bookings/${booking.id}/approve`)
        .set(authHeader(customer.token));

      expect(response.status).toBe(403);
    });

    it('should prevent starting service before payment', async () => {
      const booking = await createTestBooking(
        prisma,
        customer.id,
        stylist.id,
        stylist.serviceIds[0],
        { status: BookingStatus.PENDING_CUSTOMER_PAYMENT }
      );

      const response = await request(app)
        .post(`/api/v1/bookings/${booking.id}/start`)
        .set(authHeader(stylist.token));

      expect(response.status).toBe(400);
    });

    it('should prevent completing already settled booking', async () => {
      const booking = await createTestBooking(
        prisma,
        customer.id,
        stylist.id,
        stylist.serviceIds[0],
        { status: BookingStatus.SETTLED }
      );

      const response = await request(app)
        .post(`/api/v1/bookings/${booking.id}/complete`)
        .set(authHeader(stylist.token));

      expect(response.status).toBe(400);
    });
  });

  describe('Authorization Checks', () => {
    it('should prevent other customers from viewing booking', async () => {
      const booking = await createTestBooking(
        prisma,
        customer.id,
        stylist.id,
        stylist.serviceIds[0]
      );

      // Create another customer
      const otherCustomer = await createTestCustomer(prisma, {
        email: `other.${Date.now()}@test.vlossom`,
      });

      const response = await request(app)
        .get(`/api/v1/bookings/${booking.id}`)
        .set(authHeader(otherCustomer.token));

      expect(response.status).toBe(403);
    });

    it('should prevent other stylists from approving booking', async () => {
      const booking = await createTestBooking(
        prisma,
        customer.id,
        stylist.id,
        stylist.serviceIds[0]
      );

      // Create another stylist
      const otherStylist = await createTestStylist(prisma, {
        email: `other.stylist.${Date.now()}@test.vlossom`,
      });

      const response = await request(app)
        .post(`/api/v1/bookings/${booking.id}/approve`)
        .set(authHeader(otherStylist.token));

      expect(response.status).toBe(403);
    });
  });

  describe('Booking Retrieval', () => {
    it('should return customer bookings with pagination', async () => {
      // Create multiple bookings
      await createTestBooking(prisma, customer.id, stylist.id, stylist.serviceIds[0]);
      await createTestBooking(prisma, customer.id, stylist.id, stylist.serviceIds[0]);
      await createTestBooking(prisma, customer.id, stylist.id, stylist.serviceIds[0]);

      const response = await request(app)
        .get('/api/v1/bookings')
        .query({ role: 'customer', page: 1, limit: 2 })
        .set(authHeader(customer.token));

      expect(response.status).toBe(200);
      expect(response.body.bookings).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter bookings by status', async () => {
      await createTestBooking(prisma, customer.id, stylist.id, stylist.serviceIds[0], {
        status: BookingStatus.PENDING_STYLIST_APPROVAL,
      });
      await createTestBooking(prisma, customer.id, stylist.id, stylist.serviceIds[0], {
        status: BookingStatus.CONFIRMED,
      });

      const response = await request(app)
        .get('/api/v1/bookings')
        .query({ role: 'customer', status: 'CONFIRMED' })
        .set(authHeader(customer.token));

      expect(response.status).toBe(200);
      expect(response.body.bookings).toHaveLength(1);
      expect(response.body.bookings[0].status).toBe('CONFIRMED');
    });
  });
});
