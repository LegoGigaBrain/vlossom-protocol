import { BookingStatus } from '@prisma/client';
import {
  calculateHoursUntilStart,
  getRefundPercentage,
  calculateCustomerRefund,
  calculateStylistCancellationRefund,
  canCancelBooking,
  calculateStylistCompensation,
  CANCELLATION_THRESHOLDS,
  REFUND_PERCENTAGES,
} from './cancellation-policy';

describe('Cancellation Policy Module', () => {
  describe('calculateHoursUntilStart', () => {
    it('should calculate positive hours for future time (48 hours)', () => {
      const futureTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const hours = calculateHoursUntilStart(futureTime);
      expect(hours).toBeCloseTo(48, 0); // Allow 1 hour tolerance
    });

    it('should calculate positive hours for future time (24 hours)', () => {
      const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const hours = calculateHoursUntilStart(futureTime);
      expect(hours).toBeCloseTo(24, 0);
    });

    it('should calculate positive hours for future time (12 hours)', () => {
      const futureTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const hours = calculateHoursUntilStart(futureTime);
      expect(hours).toBeCloseTo(12, 0);
    });

    it('should calculate positive hours for future time (4 hours)', () => {
      const futureTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const hours = calculateHoursUntilStart(futureTime);
      expect(hours).toBeCloseTo(4, 0);
    });

    it('should calculate positive hours for future time (1 hour)', () => {
      const futureTime = new Date(Date.now() + 1 * 60 * 60 * 1000);
      const hours = calculateHoursUntilStart(futureTime);
      expect(hours).toBeCloseTo(1, 0);
    });

    it('should calculate zero hours for current time', () => {
      const now = new Date();
      const hours = calculateHoursUntilStart(now);
      expect(hours).toBeCloseTo(0, 1); // Very small tolerance
    });

    it('should calculate negative hours for past time', () => {
      const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const hours = calculateHoursUntilStart(pastTime);
      expect(hours).toBeCloseTo(-2, 0);
    });

    it('should handle fractional hours (2.5 hours)', () => {
      const futureTime = new Date(Date.now() + 2.5 * 60 * 60 * 1000);
      const hours = calculateHoursUntilStart(futureTime);
      expect(hours).toBeCloseTo(2.5, 0);
    });
  });

  describe('getRefundPercentage', () => {
    describe('Full refund scenarios (>= 24 hours)', () => {
      it('should return 100% for 48 hours before', () => {
        expect(getRefundPercentage(48)).toBe(REFUND_PERCENTAGES.FULL);
        expect(getRefundPercentage(48)).toBe(100);
      });

      it('should return 100% for exactly 24 hours before', () => {
        expect(getRefundPercentage(24)).toBe(REFUND_PERCENTAGES.FULL);
        expect(getRefundPercentage(24)).toBe(100);
      });

      it('should return 100% for 24.1 hours before', () => {
        expect(getRefundPercentage(24.1)).toBe(100);
      });

      it('should return 100% for 25 hours before', () => {
        expect(getRefundPercentage(25)).toBe(100);
      });

      it('should return 100% for 72 hours (3 days) before', () => {
        expect(getRefundPercentage(72)).toBe(100);
      });
    });

    describe('Partial refund scenarios (4-24 hours)', () => {
      it('should return 50% for 23 hours before', () => {
        expect(getRefundPercentage(23)).toBe(REFUND_PERCENTAGES.PARTIAL);
        expect(getRefundPercentage(23)).toBe(50);
      });

      it('should return 50% for 12 hours before', () => {
        expect(getRefundPercentage(12)).toBe(50);
      });

      it('should return 50% for 8 hours before', () => {
        expect(getRefundPercentage(8)).toBe(50);
      });

      it('should return 50% for exactly 4 hours before', () => {
        expect(getRefundPercentage(4)).toBe(REFUND_PERCENTAGES.PARTIAL);
        expect(getRefundPercentage(4)).toBe(50);
      });

      it('should return 50% for 4.1 hours before', () => {
        expect(getRefundPercentage(4.1)).toBe(50);
      });
    });

    describe('No refund scenarios (< 4 hours)', () => {
      it('should return 0% for 3 hours before', () => {
        expect(getRefundPercentage(3)).toBe(REFUND_PERCENTAGES.NONE);
        expect(getRefundPercentage(3)).toBe(0);
      });

      it('should return 0% for 2 hours before', () => {
        expect(getRefundPercentage(2)).toBe(0);
      });

      it('should return 0% for 1 hour before', () => {
        expect(getRefundPercentage(1)).toBe(0);
      });

      it('should return 0% for 0.5 hours before', () => {
        expect(getRefundPercentage(0.5)).toBe(0);
      });

      it('should return 0% for exactly 0 hours', () => {
        expect(getRefundPercentage(0)).toBe(0);
      });

      it('should return 0% for negative hours (past time)', () => {
        expect(getRefundPercentage(-1)).toBe(0);
        expect(getRefundPercentage(-5)).toBe(0);
      });
    });

    describe('Boundary conditions', () => {
      it('should have correct threshold values', () => {
        expect(CANCELLATION_THRESHOLDS.FULL_REFUND).toBe(24);
        expect(CANCELLATION_THRESHOLDS.PARTIAL_REFUND).toBe(4);
        expect(CANCELLATION_THRESHOLDS.NO_REFUND).toBe(0);
      });

      it('should transition correctly at 24-hour boundary', () => {
        expect(getRefundPercentage(24.0)).toBe(100);
        expect(getRefundPercentage(23.99)).toBe(50);
      });

      it('should transition correctly at 4-hour boundary', () => {
        expect(getRefundPercentage(4.0)).toBe(50);
        expect(getRefundPercentage(3.99)).toBe(0);
      });
    });
  });

  describe('calculateCustomerRefund', () => {
    describe('Full refund scenarios', () => {
      it('should calculate 100% refund for cancellation 48h before', () => {
        const quoteAmount = 10000n; // $100.00
        const futureTime = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(10000n); // Full refund
        expect(result.refundPercentage).toBe(100);
        expect(result.hoursUntilStart).toBeCloseTo(48, 0);
      });

      it('should calculate 100% refund for cancellation exactly 24h before', () => {
        const quoteAmount = 5000n; // $50.00
        const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(5000n);
        expect(result.refundPercentage).toBe(100);
      });
    });

    describe('Partial refund scenarios', () => {
      it('should calculate 50% refund for cancellation 12h before', () => {
        const quoteAmount = 10000n; // $100.00
        const futureTime = new Date(Date.now() + 12 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(5000n); // $50.00
        expect(result.refundPercentage).toBe(50);
        expect(result.hoursUntilStart).toBeCloseTo(12, 0);
      });

      it('should calculate 50% refund for cancellation 8h before', () => {
        const quoteAmount = 20000n; // $200.00
        const futureTime = new Date(Date.now() + 8 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(10000n); // $100.00
        expect(result.refundPercentage).toBe(50);
      });

      it('should calculate 50% refund for cancellation exactly 4h before', () => {
        const quoteAmount = 15000n; // $150.00
        const futureTime = new Date(Date.now() + 4 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(7500n); // $75.00
        expect(result.refundPercentage).toBe(50);
      });
    });

    describe('No refund scenarios', () => {
      it('should calculate 0% refund for cancellation 2h before', () => {
        const quoteAmount = 10000n; // $100.00
        const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(0n);
        expect(result.refundPercentage).toBe(0);
        expect(result.hoursUntilStart).toBeCloseTo(2, 0);
      });

      it('should calculate 0% refund for cancellation 1h before', () => {
        const quoteAmount = 5000n; // $50.00
        const futureTime = new Date(Date.now() + 1 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(0n);
        expect(result.refundPercentage).toBe(0);
      });
    });

    describe('BigInt calculations', () => {
      it('should handle large amounts correctly', () => {
        const quoteAmount = 1000000n; // $10,000.00
        const futureTime = new Date(Date.now() + 12 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(500000n); // $5,000.00
        expect(result.refundPercentage).toBe(50);
      });

      it('should maintain precision with odd amounts', () => {
        const quoteAmount = 12345n; // $123.45
        const futureTime = new Date(Date.now() + 12 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(6172n); // $61.72 (truncated)
        expect(result.refundPercentage).toBe(50);
      });

      it('should handle zero amount', () => {
        const quoteAmount = 0n;
        const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result.refundAmountCents).toBe(0n);
        expect(result.refundPercentage).toBe(100);
      });
    });

    describe('Return value structure', () => {
      it('should return object with all required fields', () => {
        const quoteAmount = 10000n;
        const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const result = calculateCustomerRefund(quoteAmount, futureTime);

        expect(result).toHaveProperty('refundAmountCents');
        expect(result).toHaveProperty('refundPercentage');
        expect(result).toHaveProperty('hoursUntilStart');
        expect(typeof result.refundAmountCents).toBe('bigint');
        expect(typeof result.refundPercentage).toBe('number');
        expect(typeof result.hoursUntilStart).toBe('number');
      });
    });
  });

  describe('calculateStylistCancellationRefund', () => {
    it('should always return full refund (100%)', () => {
      const quoteAmount = 10000n; // $100.00
      const refund = calculateStylistCancellationRefund(quoteAmount);
      expect(refund).toBe(10000n);
    });

    it('should return full refund for various amounts', () => {
      expect(calculateStylistCancellationRefund(5000n)).toBe(5000n);
      expect(calculateStylistCancellationRefund(15000n)).toBe(15000n);
      expect(calculateStylistCancellationRefund(50000n)).toBe(50000n);
      expect(calculateStylistCancellationRefund(100000n)).toBe(100000n);
    });

    it('should handle zero amount', () => {
      expect(calculateStylistCancellationRefund(0n)).toBe(0n);
    });

    it('should handle large amounts', () => {
      const quoteAmount = 1000000n; // $10,000.00
      expect(calculateStylistCancellationRefund(quoteAmount)).toBe(1000000n);
    });
  });

  describe('canCancelBooking', () => {
    describe('Cancellable statuses', () => {
      it('should allow cancellation for PENDING_STYLIST_APPROVAL', () => {
        expect(canCancelBooking(BookingStatus.PENDING_STYLIST_APPROVAL)).toBe(
          true
        );
      });

      it('should allow cancellation for PENDING_CUSTOMER_PAYMENT', () => {
        expect(canCancelBooking(BookingStatus.PENDING_CUSTOMER_PAYMENT)).toBe(
          true
        );
      });

      it('should allow cancellation for CONFIRMED', () => {
        expect(canCancelBooking(BookingStatus.CONFIRMED)).toBe(true);
      });

      it('should allow cancellation for IN_PROGRESS', () => {
        expect(canCancelBooking(BookingStatus.IN_PROGRESS)).toBe(true);
      });
    });

    describe('Non-cancellable statuses', () => {
      it('should not allow cancellation for SETTLED', () => {
        expect(canCancelBooking(BookingStatus.SETTLED)).toBe(false);
      });

      it('should not allow cancellation for CANCELLED', () => {
        expect(canCancelBooking(BookingStatus.CANCELLED)).toBe(false);
      });

      it('should not allow cancellation for DECLINED', () => {
        expect(canCancelBooking(BookingStatus.DECLINED)).toBe(false);
      });

      it('should not allow cancellation for COMPLETED', () => {
        expect(canCancelBooking(BookingStatus.COMPLETED)).toBe(false);
      });

      it('should not allow cancellation for AWAITING_CUSTOMER_CONFIRMATION', () => {
        expect(
          canCancelBooking(BookingStatus.AWAITING_CUSTOMER_CONFIRMATION)
        ).toBe(false);
      });

      it('should not allow cancellation for DISPUTED', () => {
        expect(canCancelBooking(BookingStatus.DISPUTED)).toBe(false);
      });
    });
  });

  describe('calculateStylistCompensation', () => {
    it('should give stylist 0% if customer gets 100% refund (48h before)', () => {
      const quoteAmount = 10000n; // $100.00
      const futureTime = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const compensation = calculateStylistCompensation(quoteAmount, futureTime);

      expect(compensation).toBe(0n);
    });

    it('should give stylist 50% if customer gets 50% refund (12h before)', () => {
      const quoteAmount = 10000n; // $100.00
      const futureTime = new Date(Date.now() + 12 * 60 * 60 * 1000);

      const compensation = calculateStylistCompensation(quoteAmount, futureTime);

      expect(compensation).toBe(5000n); // $50.00
    });

    it('should give stylist 100% if customer gets 0% refund (2h before)', () => {
      const quoteAmount = 10000n; // $100.00
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const compensation = calculateStylistCompensation(quoteAmount, futureTime);

      expect(compensation).toBe(10000n); // $100.00
    });

    describe('Math verification: compensation + refund = total', () => {
      it('should sum correctly for 48h before (100% + 0%)', () => {
        const quoteAmount = 10000n;
        const futureTime = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const refund = calculateCustomerRefund(quoteAmount, futureTime);
        const compensation = calculateStylistCompensation(
          quoteAmount,
          futureTime
        );

        expect(refund.refundAmountCents + compensation).toBe(quoteAmount);
      });

      it('should sum correctly for 12h before (50% + 50%)', () => {
        const quoteAmount = 10000n;
        const futureTime = new Date(Date.now() + 12 * 60 * 60 * 1000);

        const refund = calculateCustomerRefund(quoteAmount, futureTime);
        const compensation = calculateStylistCompensation(
          quoteAmount,
          futureTime
        );

        expect(refund.refundAmountCents + compensation).toBe(quoteAmount);
      });

      it('should sum correctly for 2h before (0% + 100%)', () => {
        const quoteAmount = 10000n;
        const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

        const refund = calculateCustomerRefund(quoteAmount, futureTime);
        const compensation = calculateStylistCompensation(
          quoteAmount,
          futureTime
        );

        expect(refund.refundAmountCents + compensation).toBe(quoteAmount);
      });

      it('should sum correctly for odd amounts', () => {
        const quoteAmount = 12345n;
        const futureTime = new Date(Date.now() + 12 * 60 * 60 * 1000);

        const refund = calculateCustomerRefund(quoteAmount, futureTime);
        const compensation = calculateStylistCompensation(
          quoteAmount,
          futureTime
        );

        // Due to truncation, sum might be 1 cent less
        const sum = refund.refundAmountCents + compensation;
        expect(sum).toBeGreaterThanOrEqual(quoteAmount - 1n);
        expect(sum).toBeLessThanOrEqual(quoteAmount);
      });
    });
  });

  describe('Integration: Full cancellation flow', () => {
    it('should handle customer cancellation 48h before correctly', () => {
      const quoteAmount = 15000n; // $150.00
      const futureTime = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // Check if cancellation is allowed
      expect(canCancelBooking(BookingStatus.CONFIRMED)).toBe(true);

      // Calculate customer refund
      const refund = calculateCustomerRefund(quoteAmount, futureTime);
      expect(refund.refundAmountCents).toBe(15000n); // Full refund
      expect(refund.refundPercentage).toBe(100);

      // Calculate stylist compensation
      const compensation = calculateStylistCompensation(quoteAmount, futureTime);
      expect(compensation).toBe(0n); // No compensation
    });

    it('should handle customer cancellation 10h before correctly', () => {
      const quoteAmount = 20000n; // $200.00
      const futureTime = new Date(Date.now() + 10 * 60 * 60 * 1000);

      expect(canCancelBooking(BookingStatus.CONFIRMED)).toBe(true);

      const refund = calculateCustomerRefund(quoteAmount, futureTime);
      expect(refund.refundAmountCents).toBe(10000n); // 50% refund
      expect(refund.refundPercentage).toBe(50);

      const compensation = calculateStylistCompensation(quoteAmount, futureTime);
      expect(compensation).toBe(10000n); // 50% compensation
    });

    it('should handle customer cancellation 1h before correctly', () => {
      const quoteAmount = 10000n; // $100.00
      const futureTime = new Date(Date.now() + 1 * 60 * 60 * 1000);

      expect(canCancelBooking(BookingStatus.CONFIRMED)).toBe(true);

      const refund = calculateCustomerRefund(quoteAmount, futureTime);
      expect(refund.refundAmountCents).toBe(0n); // No refund
      expect(refund.refundPercentage).toBe(0);

      const compensation = calculateStylistCompensation(quoteAmount, futureTime);
      expect(compensation).toBe(10000n); // Full compensation
    });

    it('should handle stylist cancellation correctly (always full refund)', () => {
      const quoteAmount = 12000n; // $120.00

      // Stylist can cancel from certain statuses
      expect(canCancelBooking(BookingStatus.CONFIRMED)).toBe(true);

      // Customer gets full refund
      const refund = calculateStylistCancellationRefund(quoteAmount);
      expect(refund).toBe(12000n); // Full refund
    });
  });
});
