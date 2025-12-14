// Pricing Calculation Logic
// Reference: docs/vlossom/10-pricing-and-fees-model.md

/**
 * Platform fee configuration
 * MVP: 10% flat fee
 */
export const PLATFORM_FEE_PERCENTAGE = 10; // 10%

/**
 * Calculate platform fee from service price
 * All amounts in cents (BigInt to avoid floating point)
 */
export function calculatePlatformFee(serviceAmountCents: bigint): bigint {
  return (serviceAmountCents * BigInt(PLATFORM_FEE_PERCENTAGE)) / BigInt(100);
}

/**
 * Calculate stylist payout (service amount - platform fee)
 */
export function calculateStylistPayout(serviceAmountCents: bigint): bigint {
  const platformFee = calculatePlatformFee(serviceAmountCents);
  return serviceAmountCents - platformFee;
}

/**
 * Calculate full booking pricing breakdown
 */
export interface BookingPricing {
  quoteAmountCents: bigint;
  platformFeeCents: bigint;
  stylistPayoutCents: bigint;
  propertyPayoutCents: bigint;
}

export function calculateBookingPricing(
  serviceAmountCents: bigint,
  propertyPayoutCents: bigint = BigInt(0)
): BookingPricing {
  const platformFee = calculatePlatformFee(serviceAmountCents);
  const stylistPayout = serviceAmountCents - platformFee;

  return {
    quoteAmountCents: serviceAmountCents,
    platformFeeCents: platformFee,
    stylistPayoutCents: stylistPayout,
    propertyPayoutCents,
  };
}

/**
 * Validate that pricing components add up correctly
 * Note: Property payout is separate from the quote amount split
 */
export function validatePricing(pricing: BookingPricing): boolean {
  const total = pricing.platformFeeCents + pricing.stylistPayoutCents;
  return total === pricing.quoteAmountCents;
}
