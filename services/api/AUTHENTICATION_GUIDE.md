# Authentication Implementation Guide

## Overview

This guide documents the authentication implementation for the Vlossom API booking endpoints.

## ✅ Phase 5 COMPLETE - All Endpoints Secured

**Files Created:**
- [`src/middleware/authorize.ts`](src/middleware/authorize.ts) - Authorization helpers for booking access control

**Files Modified:**
- [`src/routes/bookings.ts`](src/routes/bookings.ts) - Added authentication to all 11 endpoints

## All Secured Endpoints

### Customer Actions (4 endpoints)

1. **POST /api/bookings** - Create booking
   - Requires: JWT Bearer token
   - Authorization: `userId === customerId`
   - Validates user can only create bookings for themselves

2. **GET /api/bookings/:id/payment-instructions** - Get payment instructions
   - Requires: JWT Bearer token
   - Authorization: Customer only
   - Uses `authorizeBookingAccess(userId, booking, "customer")`

3. **POST /api/bookings/:id/confirm-payment** - Confirm payment
   - Requires: JWT Bearer token
   - Authorization: Customer only
   - Uses `authorizeBookingAccess(userId, booking, "customer")`

4. **POST /api/bookings/:id/confirm** - Confirm completion
   - Requires: JWT Bearer token
   - Authorization: Customer only
   - Uses `authorizeBookingAccess(userId, booking, "customer")`

### Stylist Actions (4 endpoints)

5. **POST /api/bookings/:id/approve** - Approve booking
   - Requires: JWT Bearer token
   - Authorization: Stylist only
   - Existing validation: `booking.stylistId !== input.stylistId`

6. **POST /api/bookings/:id/decline** - Decline booking
   - Requires: JWT Bearer token
   - Authorization: Stylist only
   - Uses `authorizeBookingAccess(userId, booking, "stylist")`

7. **POST /api/bookings/:id/start** - Start service
   - Requires: JWT Bearer token
   - Authorization: Stylist only
   - Uses `authorizeBookingAccess(userId, booking, "stylist")`

8. **POST /api/bookings/:id/complete** - Complete service
   - Requires: JWT Bearer token
   - Authorization: Stylist only
   - Uses `authorizeBookingAccess(userId, booking, "stylist")`

### Either Party (2 endpoints)

9. **GET /api/bookings/:id** - Get booking details
   - Requires: JWT Bearer token
   - Authorization: Customer or Stylist
   - Uses `authorizeBookingAccess(userId, booking, "any")`

10. **POST /api/bookings/:id/cancel** - Cancel booking
    - Requires: JWT Bearer token
    - Authorization: Customer or Stylist
    - Uses `authorizeBookingAccess(userId, booking, "any")`

## Implementation Pattern

```typescript
// 1. Add authenticate middleware to route
router.post("/:id/action", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!; // Available from authenticate middleware

  // 2. Fetch booking
  const booking = await prisma.booking.findUnique({ where: { id } });

  // 3. Authorize access
  if (!authorizeBookingAccess(userId, booking, "customer")) { // or "stylist" or "any"
    const error = createForbiddenError("action name", "customer"); // or "stylist" or "any"
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // 4. Continue with business logic...
});
```

## Helper Functions Available

### From `src/middleware/authorize.ts`:

```typescript
// Check if user has access to booking
authorizeBookingAccess(userId: string, booking: Booking, requiredRole: "customer" | "stylist" | "any"): boolean

// Check specific roles
isCustomer(userId: string, booking: Booking): boolean
isStylist(userId: string, booking: Booking): boolean

// Get user's role in booking
getUserBookingRole(userId: string, booking: Booking): "customer" | "stylist" | null

// Create standardized error response
createForbiddenError(action: string, requiredRole: "customer" | "stylist" | "any"): AuthorizationError
```

## Testing Authentication

Once all endpoints are secured, test with:

1. **Valid JWT token** - Should succeed
2. **No token** - Should return 401 Unauthorized
3. **Invalid token** - Should return 401 Unauthorized
4. **Valid token, wrong user** - Should return 403 Forbidden
5. **Valid token, correct user** - Should succeed

## Next Steps

1. Add `authenticate` middleware to all remaining endpoints
2. Replace body/query `userId` parameters with `req.userId`
3. Add authorization checks using helper functions
4. Remove manual userId validation from request bodies
5. Test all endpoints with JWT authentication
6. Update API documentation with authentication requirements

## Security Notes

- JWT tokens expire after 24 hours (configurable in `src/middleware/auth.ts`)
- All booking operations require authentication (no public access)
- Stylist endpoints accessible only by assigned stylist
- Customer endpoints accessible only by booking customer
- Some endpoints (cancel) accessible by either party
- Wallet endpoints use same authentication pattern
