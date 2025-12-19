// Input Validation Schemas using Zod
// Reference: standards/backend/api-design.md
//
// SECURITY AUDIT (V1.9.0):
// - M-6: Booking API authorization (customerId from JWT)
// - L-2: Display name sanitization

import { z } from "zod";

// Geographic coordinate validation (WGS84)
const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

/**
 * L-2: Display name sanitization schema
 * Prevents XSS and injection attacks in display names
 * Allows: letters, numbers, spaces, hyphens, apostrophes, periods
 */
export const displayNameSchema = z.string()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be 100 characters or less')
  .regex(
    /^[a-zA-Z0-9\s\-'.]+$/,
    'Display name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods'
  )
  .transform(s => s.trim());

export type DisplayName = z.infer<typeof displayNameSchema>;

/**
 * Validation for creating a new booking
 *
 * SECURITY AUDIT (V1.9.0) - M-6: Booking API Authorization
 * customerId is derived from JWT token, not from request body.
 * This prevents users from creating bookings on behalf of other users.
 */
export const createBookingSchema = z.object({
  // M-6: customerId removed - derived from JWT token
  stylistId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledStartTime: z.coerce.date(),
  locationType: z.enum(["STYLIST_BASE", "CUSTOMER_HOME"]),
  locationAddress: z.string().min(1),
  locationLat: latitudeSchema.optional(),
  locationLng: longitudeSchema.optional(),
  notes: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Validation for stylist approval
 */
export const approveBookingSchema = z.object({
  stylistId: z.string().uuid(),
  notes: z.string().optional(),
});

export type ApproveBookingInput = z.infer<typeof approveBookingSchema>;

/**
 * Validation for stylist decline
 */
export const declineBookingSchema = z.object({
  stylistId: z.string().uuid(),
  reason: z.string().min(1), // Reason is required for decline
});

export type DeclineBookingInput = z.infer<typeof declineBookingSchema>;

/**
 * Validation for marking service started
 */
export const startServiceSchema = z.object({
  stylistId: z.string().uuid(),
  actualStartTime: z.coerce.date().optional(), // Defaults to now if not provided
});

export type StartServiceInput = z.infer<typeof startServiceSchema>;

/**
 * Validation for marking service completed
 */
export const completeServiceSchema = z.object({
  stylistId: z.string().uuid(),
  actualEndTime: z.coerce.date().optional(), // Defaults to now if not provided
  notes: z.string().optional(),
});

export type CompleteServiceInput = z.infer<typeof completeServiceSchema>;

/**
 * Validation for customer confirmation
 */
export const confirmServiceSchema = z.object({
  customerId: z.string().uuid(),
  rating: z.number().min(1).max(5).optional(), // Phase 2
  review: z.string().optional(), // Phase 2
});

export type ConfirmServiceInput = z.infer<typeof confirmServiceSchema>;

/**
 * Validation for cancellation
 */
export const cancelBookingSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// ============================================================================
// VALID ENUM VALUES FOR QUERY SANITIZATION
// ============================================================================

/**
 * Valid service categories (matches Prisma enum)
 * H-3: Input sanitization for dynamic queries
 */
export const VALID_SERVICE_CATEGORIES = [
  "Hair",
  "Nails",
  "Makeup",
  "Lashes",
  "Facials",
] as const;
export type ServiceCategory = (typeof VALID_SERVICE_CATEGORIES)[number];

/**
 * Valid stylist operating modes (matches Prisma enum)
 */
export const VALID_OPERATING_MODES = ["FIXED", "MOBILE", "HYBRID"] as const;
export type OperatingMode = (typeof VALID_OPERATING_MODES)[number];

/**
 * Valid property categories (matches Prisma enum)
 */
export const VALID_PROPERTY_CATEGORIES = [
  "LUXURY",
  "BOUTIQUE",
  "STANDARD",
  "HOME_BASED",
] as const;
export type PropertyCategory = (typeof VALID_PROPERTY_CATEGORIES)[number];

/**
 * Valid rental modes (matches Prisma enum)
 */
export const VALID_RENTAL_MODES = [
  "PER_BOOKING",
  "PER_HOUR",
  "PER_DAY",
  "PER_WEEK",
  "PER_MONTH",
] as const;
export type RentalMode = (typeof VALID_RENTAL_MODES)[number];

/**
 * Valid chair rental request statuses
 */
export const VALID_RENTAL_STATUSES = [
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;
export type RentalStatus = (typeof VALID_RENTAL_STATUSES)[number];

/**
 * Validation for stylist search (F4.4: Enhanced search & filter)
 * H-3: serviceCategory uses strict enum validation
 */
export const searchStylistsSchema = z.object({
  // Existing parameters with coordinate validation
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  // H-3: Strict enum validation instead of arbitrary string
  serviceCategory: z.enum(VALID_SERVICE_CATEGORIES).optional(),
  radius: z.coerce.number().positive().optional(), // km
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),

  // F4.4: New search parameters
  query: z.string().max(100).optional(), // Full-text search on name/bio (limited length)
  minPrice: z.coerce.number().int().min(0).optional(), // Min service price (cents)
  maxPrice: z.coerce.number().int().positive().optional(), // Max service price (cents)
  operatingMode: z.enum(VALID_OPERATING_MODES).optional(),
  sortBy: z.enum(["price_asc", "price_desc", "distance", "newest"]).optional(),
  availability: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // ISO date - filter by available on date
});

/**
 * Validation for property search (H-3: Input sanitization)
 */
export const searchPropertiesSchema = z.object({
  city: z.string().max(100).optional(),
  category: z.enum(VALID_PROPERTY_CATEGORIES).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().max(500).optional(), // Max 500km
});

export type SearchPropertiesInput = z.infer<typeof searchPropertiesSchema>;

/**
 * Validation for rental request filters (H-3: Input sanitization)
 */
export const rentalFilterSchema = z.object({
  status: z.enum(VALID_RENTAL_STATUSES).optional(),
});

export type SearchStylistsInput = z.infer<typeof searchStylistsSchema>;

/**
 * Validation for creating stylist service
 */
export const createStylistServiceSchema = z.object({
  stylistId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  priceAmountCents: z.number().int().positive(),
  estimatedDurationMin: z.number().int().positive(),
});

export type CreateStylistServiceInput = z.infer<
  typeof createStylistServiceSchema
>;

// ============================================================================
// WALLET VALIDATION SCHEMAS (AA Wallet SDK - Task 2)
// ============================================================================

/**
 * Ethereum address validation (0x + 40 hex chars)
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

/**
 * Validation for creating a wallet (internal)
 */
export const createWalletSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;

/**
 * Validation for P2P transfer
 */
export const transferSchema = z.object({
  toAddress: ethereumAddressSchema,
  amount: z.string().regex(/^\d+$/, "Amount must be a numeric string (smallest unit)"),
  memo: z.string().max(256).optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;

/**
 * Validation for creating a payment request
 */
export const createPaymentRequestSchema = z.object({
  amount: z.string().regex(/^\d+$/, "Amount must be a numeric string (smallest unit)"),
  memo: z.string().max(256).optional(),
  expiresInMinutes: z.number().int().positive().max(1440).default(30), // Max 24 hours
});

export type CreatePaymentRequestInput = z.infer<typeof createPaymentRequestSchema>;

/**
 * Validation for payment request ID
 */
export const paymentRequestIdSchema = z.object({
  id: z.string().uuid(),
});

export type PaymentRequestIdInput = z.infer<typeof paymentRequestIdSchema>;

/**
 * Validation for fulfilling a payment request
 */
export const fulfillPaymentRequestSchema = z.object({
  // No additional fields needed - payer is from auth token
});

export type FulfillPaymentRequestInput = z.infer<typeof fulfillPaymentRequestSchema>;

/**
 * Validation for transaction history query
 */
export const transactionHistorySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type TransactionHistoryInput = z.infer<typeof transactionHistorySchema>;
