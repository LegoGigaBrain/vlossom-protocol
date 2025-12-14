// Input Validation Schemas using Zod
// Reference: standards/backend/api-design.md

import { z } from "zod";

/**
 * Validation for creating a new booking
 */
export const createBookingSchema = z.object({
  customerId: z.string().uuid(),
  stylistId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledStartTime: z.coerce.date(),
  locationType: z.enum(["STYLIST_BASE", "CUSTOMER_HOME"]),
  locationAddress: z.string().min(1),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
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

/**
 * Validation for stylist search (F4.4: Enhanced search & filter)
 */
export const searchStylistsSchema = z.object({
  // Existing parameters
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  serviceCategory: z.string().optional(),
  radius: z.coerce.number().positive().optional(), // km
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),

  // F4.4: New search parameters
  query: z.string().optional(), // Full-text search on name/bio
  minPrice: z.coerce.number().int().min(0).optional(), // Min service price (cents)
  maxPrice: z.coerce.number().int().positive().optional(), // Max service price (cents)
  operatingMode: z.enum(["FIXED", "MOBILE", "HYBRID"]).optional(),
  sortBy: z.enum(["price_asc", "price_desc", "distance", "newest"]).optional(),
  availability: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // ISO date - filter by available on date
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
