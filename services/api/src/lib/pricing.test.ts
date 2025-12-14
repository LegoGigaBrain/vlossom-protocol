import {
  calculatePlatformFee,
  calculateStylistPayout,
  calculateBookingPricing,
  validatePricing,
  PLATFORM_FEE_PERCENTAGE,
  type BookingPricing,
} from './pricing';

describe('Pricing Module', () => {
  describe('calculatePlatformFee', () => {
    it('should calculate 10% platform fee correctly for $100', () => {
      const serviceAmount = 10000n; // $100.00
      const fee = calculatePlatformFee(serviceAmount);
      expect(fee).toBe(1000n); // $10.00
    });

    it('should calculate 10% platform fee correctly for $50', () => {
      const serviceAmount = 5000n; // $50.00
      const fee = calculatePlatformFee(serviceAmount);
      expect(fee).toBe(500n); // $5.00
    });

    it('should calculate 10% platform fee correctly for $500', () => {
      const serviceAmount = 50000n; // $500.00
      const fee = calculatePlatformFee(serviceAmount);
      expect(fee).toBe(5000n); // $50.00
    });

    it('should calculate 10% platform fee correctly for $1000', () => {
      const serviceAmount = 100000n; // $1000.00
      const fee = calculatePlatformFee(serviceAmount);
      expect(fee).toBe(10000n); // $100.00
    });

    it('should handle zero amount', () => {
      expect(calculatePlatformFee(0n)).toBe(0n);
    });

    it('should handle 1 cent', () => {
      const fee = calculatePlatformFee(1n);
      expect(fee).toBe(0n); // 10% of 1 cent rounds down to 0
    });

    it('should handle 10 cents (minimum to get 1 cent fee)', () => {
      const fee = calculatePlatformFee(10n);
      expect(fee).toBe(1n); // 10% of 10 cents = 1 cent
    });

    it('should handle 9 cents (rounds down)', () => {
      const fee = calculatePlatformFee(9n);
      expect(fee).toBe(0n); // 10% of 9 cents = 0.9 cents, rounds down to 0
    });

    it('should handle large amounts correctly', () => {
      const serviceAmount = 1000000000n; // $10,000,000.00
      const fee = calculatePlatformFee(serviceAmount);
      expect(fee).toBe(100000000n); // $1,000,000.00
    });

    it('should maintain BigInt precision (no floating point errors)', () => {
      const serviceAmount = 12345n; // $123.45
      const fee = calculatePlatformFee(serviceAmount);
      expect(fee).toBe(1234n); // $12.34 (truncated, not rounded)
    });

    it('should use correct percentage constant', () => {
      expect(PLATFORM_FEE_PERCENTAGE).toBe(10);
    });
  });

  describe('calculateStylistPayout', () => {
    it('should calculate payout as service amount minus platform fee for $100', () => {
      const serviceAmount = 10000n; // $100.00
      const payout = calculateStylistPayout(serviceAmount);
      expect(payout).toBe(9000n); // $90.00
    });

    it('should calculate payout as service amount minus platform fee for $50', () => {
      const serviceAmount = 5000n; // $50.00
      const payout = calculateStylistPayout(serviceAmount);
      expect(payout).toBe(4500n); // $45.00
    });

    it('should calculate payout as service amount minus platform fee for $500', () => {
      const serviceAmount = 50000n; // $500.00
      const payout = calculateStylistPayout(serviceAmount);
      expect(payout).toBe(45000n); // $450.00
    });

    it('should calculate payout as service amount minus platform fee for $1000', () => {
      const serviceAmount = 100000n; // $1000.00
      const payout = calculateStylistPayout(serviceAmount);
      expect(payout).toBe(90000n); // $900.00
    });

    it('should be consistent with calculatePlatformFee', () => {
      const serviceAmount = 12345n; // $123.45
      const fee = calculatePlatformFee(serviceAmount);
      const payout = calculateStylistPayout(serviceAmount);

      expect(fee + payout).toBe(serviceAmount);
    });

    it('should handle zero amount', () => {
      expect(calculateStylistPayout(0n)).toBe(0n);
    });

    it('should handle 1 cent (full amount to stylist)', () => {
      const payout = calculateStylistPayout(1n);
      expect(payout).toBe(1n); // Fee is 0, so stylist gets all
    });

    it('should handle large amounts correctly', () => {
      const serviceAmount = 1000000000n; // $10,000,000.00
      const payout = calculateStylistPayout(serviceAmount);
      expect(payout).toBe(900000000n); // $9,000,000.00
    });
  });

  describe('calculateBookingPricing', () => {
    it('should calculate complete pricing breakdown without property payout', () => {
      const serviceAmount = 10000n; // $100.00
      const pricing = calculateBookingPricing(serviceAmount);

      expect(pricing.quoteAmountCents).toBe(10000n);
      expect(pricing.platformFeeCents).toBe(1000n);
      expect(pricing.stylistPayoutCents).toBe(9000n);
      expect(pricing.propertyPayoutCents).toBe(0n);
    });

    it('should calculate complete pricing breakdown with property payout', () => {
      const serviceAmount = 10000n; // $100.00
      const propertyPayout = 500n; // $5.00
      const pricing = calculateBookingPricing(serviceAmount, propertyPayout);

      expect(pricing.quoteAmountCents).toBe(10000n);
      expect(pricing.platformFeeCents).toBe(1000n);
      expect(pricing.stylistPayoutCents).toBe(9000n);
      expect(pricing.propertyPayoutCents).toBe(500n);
    });

    it('should default property payout to 0 if not provided', () => {
      const pricing = calculateBookingPricing(5000n);
      expect(pricing.propertyPayoutCents).toBe(0n);
    });

    it('should handle zero service amount', () => {
      const pricing = calculateBookingPricing(0n);

      expect(pricing.quoteAmountCents).toBe(0n);
      expect(pricing.platformFeeCents).toBe(0n);
      expect(pricing.stylistPayoutCents).toBe(0n);
      expect(pricing.propertyPayoutCents).toBe(0n);
    });

    it('should calculate all components correctly for various amounts', () => {
      const amounts = [1000n, 5000n, 10000n, 50000n, 100000n];

      amounts.forEach((amount) => {
        const pricing = calculateBookingPricing(amount);
        const expectedFee = (amount * 10n) / 100n;
        const expectedPayout = amount - expectedFee;

        expect(pricing.quoteAmountCents).toBe(amount);
        expect(pricing.platformFeeCents).toBe(expectedFee);
        expect(pricing.stylistPayoutCents).toBe(expectedPayout);
      });
    });

    it('should maintain BigInt precision across all calculations', () => {
      const serviceAmount = 12345n; // $123.45
      const pricing = calculateBookingPricing(serviceAmount);

      expect(pricing.platformFeeCents).toBe(1234n); // $12.34
      expect(pricing.stylistPayoutCents).toBe(11111n); // $111.11
      expect(pricing.platformFeeCents + pricing.stylistPayoutCents).toBe(
        serviceAmount
      );
    });
  });

  describe('validatePricing', () => {
    it('should return true for valid pricing without property payout', () => {
      const pricing: BookingPricing = {
        quoteAmountCents: 10000n,
        platformFeeCents: 1000n,
        stylistPayoutCents: 9000n,
        propertyPayoutCents: 0n,
      };

      expect(validatePricing(pricing)).toBe(true);
    });

    it('should return true for valid pricing with property payout', () => {
      const pricing: BookingPricing = {
        quoteAmountCents: 10000n,
        platformFeeCents: 1000n,
        stylistPayoutCents: 9000n, // Property payout is separate, doesn't reduce stylist payout
        propertyPayoutCents: 500n,
      };

      expect(validatePricing(pricing)).toBe(true);
    });

    it('should return false when components do not sum to quote amount', () => {
      const pricing: BookingPricing = {
        quoteAmountCents: 10000n,
        platformFeeCents: 1000n,
        stylistPayoutCents: 8000n, // Wrong amount
        propertyPayoutCents: 0n,
      };

      expect(validatePricing(pricing)).toBe(false);
    });

    it('should return false when total exceeds quote amount', () => {
      const pricing: BookingPricing = {
        quoteAmountCents: 10000n,
        platformFeeCents: 1000n,
        stylistPayoutCents: 10000n, // Too much
        propertyPayoutCents: 0n,
      };

      expect(validatePricing(pricing)).toBe(false);
    });

    it('should return false when total is less than quote amount', () => {
      const pricing: BookingPricing = {
        quoteAmountCents: 10000n,
        platformFeeCents: 1000n,
        stylistPayoutCents: 8000n, // Too little
        propertyPayoutCents: 0n,
      };

      expect(validatePricing(pricing)).toBe(false);
    });

    it('should validate pricing generated by calculateBookingPricing', () => {
      const serviceAmount = 12345n;
      const pricing = calculateBookingPricing(serviceAmount);

      expect(validatePricing(pricing)).toBe(true);
    });

    it('should validate pricing with property payout generated by calculateBookingPricing', () => {
      const serviceAmount = 12345n;
      const propertyPayout = 500n;
      const pricing = calculateBookingPricing(serviceAmount, propertyPayout);

      // Note: With property payout, validation should still pass
      // because property payout is a separate amount, not part of the split
      expect(validatePricing(pricing)).toBe(true);
    });

    it('should handle zero amounts', () => {
      const pricing: BookingPricing = {
        quoteAmountCents: 0n,
        platformFeeCents: 0n,
        stylistPayoutCents: 0n,
        propertyPayoutCents: 0n,
      };

      expect(validatePricing(pricing)).toBe(true);
    });
  });

  describe('Integration: Full pricing flow', () => {
    it('should calculate correct pricing for typical booking ($75)', () => {
      const serviceAmount = 7500n; // $75.00

      // Calculate pricing
      const pricing = calculateBookingPricing(serviceAmount);

      // Verify components
      expect(pricing.quoteAmountCents).toBe(7500n); // $75.00
      expect(pricing.platformFeeCents).toBe(750n); // $7.50
      expect(pricing.stylistPayoutCents).toBe(6750n); // $67.50
      expect(pricing.propertyPayoutCents).toBe(0n);

      // Validate
      expect(validatePricing(pricing)).toBe(true);

      // Verify using individual functions
      expect(calculatePlatformFee(serviceAmount)).toBe(pricing.platformFeeCents);
      expect(calculateStylistPayout(serviceAmount)).toBe(
        pricing.stylistPayoutCents
      );
    });

    it('should calculate correct pricing for high-value booking ($300)', () => {
      const serviceAmount = 30000n; // $300.00

      const pricing = calculateBookingPricing(serviceAmount);

      expect(pricing.quoteAmountCents).toBe(30000n);
      expect(pricing.platformFeeCents).toBe(3000n); // $30.00
      expect(pricing.stylistPayoutCents).toBe(27000n); // $270.00
      expect(validatePricing(pricing)).toBe(true);
    });

    it('should calculate correct pricing with property fee ($100 service + $10 property)', () => {
      const serviceAmount = 10000n; // $100.00
      const propertyPayout = 1000n; // $10.00

      const pricing = calculateBookingPricing(serviceAmount, propertyPayout);

      expect(pricing.quoteAmountCents).toBe(10000n);
      expect(pricing.platformFeeCents).toBe(1000n); // $10.00
      expect(pricing.stylistPayoutCents).toBe(9000n); // $90.00
      expect(pricing.propertyPayoutCents).toBe(1000n); // $10.00
      expect(validatePricing(pricing)).toBe(true);
    });
  });
});
