# Booking Flow v1 - Implementation Guide

## Summary

This implementation provides a complete MVP booking flow for Vlossom Protocol, enabling customers to discover stylists, request bookings, and complete payments via on-chain escrow (escrow integration pending).

## Implementation Checklist

### Database Schema ✓
- [x] Prisma schema with all required models
- [x] Proper relationships and indexes
- [x] Enums for status, roles, and types
- [x] BigInt for monetary amounts (cents)
- [x] Audit trail via BookingStatusHistory

### Business Logic ✓
- [x] State machine with valid transitions
- [x] Pricing calculator (10% platform fee)
- [x] Cancellation policy with timing-based refunds
- [x] Input validation schemas (Zod)

### API Routes ✓

**Bookings** (`/api/bookings`)
- [x] POST `/` - Create booking
- [x] GET `/:id` - Get booking details
- [x] POST `/:id/approve` - Stylist approval
- [x] POST `/:id/decline` - Stylist decline
- [x] POST `/:id/start` - Start service
- [x] POST `/:id/complete` - Complete service
- [x] POST `/:id/confirm` - Customer confirmation
- [x] POST `/:id/cancel` - Cancel with refund

**Stylists** (`/api/stylists`)
- [x] GET `/` - Search with filters
- [x] GET `/:id` - Get profile

## Key Design Decisions

### 1. BigInt for Monetary Amounts
All prices stored as BigInt in cents to avoid floating-point precision issues:
```typescript
priceAmountCents: BigInt   // NOT Float or Decimal
```

### 2. State Machine Validation
Every status transition is validated before execution:
```typescript
validateTransition(currentStatus, targetStatus);
// Throws error if transition is invalid
```

### 3. Comprehensive Audit Trail
All status changes are logged to `BookingStatusHistory`:
```typescript
await logStatusChange(bookingId, fromStatus, toStatus, userId, reason);
```

### 4. Role-Based Access Control
Operations validate user permissions:
- Only assigned stylist can approve/decline
- Only customer can confirm completion
- Either party can cancel (with different refund logic)

### 5. Cancellation Policy
Timing-based refunds:
- 24+ hours before: 100% refund
- 4-24 hours: 50% refund
- <4 hours: 0% refund
- Stylist cancellation: Always 100% refund to customer

### 6. Location-Based Search
Haversine formula for distance calculation:
- Filters stylists by distance from customer
- Respects stylist service radius for mobile operations
- Supports fixed/hybrid operating modes

## Testing the Implementation

### 1. Setup Database
```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed test data (TODO: create seed script)
```

### 2. Start Server
```bash
pnpm dev
# Server runs on http://localhost:3002
```

### 3. Test Endpoints

**Create a booking:**
```bash
curl -X POST http://localhost:3002/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "uuid-here",
    "stylistId": "uuid-here",
    "serviceId": "uuid-here",
    "scheduledStartTime": "2025-01-15T10:00:00Z",
    "locationType": "STYLIST_BASE",
    "locationAddress": "123 Main St"
  }'
```

**Search stylists:**
```bash
curl "http://localhost:3002/api/stylists?lat=37.7749&lng=-122.4194&radius=25"
```

## Integration Points (TODO)

### Escrow Contract
Currently marked as TODO in the code:
- Lock funds on approval (`/approve` endpoint)
- Release funds on settlement (`/confirm` endpoint)
- Refund on cancellation (`/cancel` endpoint)

**Files to modify:**
- `src/routes/bookings.ts` - Add escrow calls
- `src/lib/escrow.ts` - Create escrow client (new file)

### Notifications
Currently marked as TODO:
- Stylist receives notification on new booking
- Customer receives notification on approval
- Both parties notified on status changes

**Files to modify:**
- `src/routes/bookings.ts` - Add notification calls
- `src/lib/notifications.ts` - Create notification service (new file)

### Background Jobs
Required for timeouts:
- Auto-cancel if stylist doesn't respond in 24h
- Auto-cancel if payment not received in 2h
- Auto-confirm if customer doesn't confirm in 24h

**Files to create:**
- `src/jobs/auto-cancel.ts`
- `src/jobs/auto-confirm.ts`

### Authentication Middleware
Currently no auth - need to add:
- JWT or session-based auth
- Extract userId from auth token
- Validate wallet ownership

**Files to create:**
- `src/middleware/auth.ts`

## File Structure

```
services/api/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── lib/
│   │   ├── booking-state-machine.ts  # State transitions
│   │   ├── cancellation-policy.ts    # Refund logic
│   │   ├── pricing.ts               # Fee calculations
│   │   ├── prisma.ts               # DB client
│   │   └── validation.ts           # Input schemas
│   ├── routes/
│   │   ├── bookings.ts            # Booking endpoints
│   │   └── stylists.ts            # Stylist endpoints
│   └── index.ts                  # Express app
├── .env.example                 # Environment template
├── package.json
├── README.md                    # Setup guide
└── IMPLEMENTATION.md            # This file
```

## Standards Compliance

This implementation follows:
- [x] Backend API Design Standards - REST patterns, status codes, error format
- [x] Data Modelling Standards - UUIDs, timestamps, enums, relationships
- [x] Code Style Standards - Small functions, early returns, error handling
- [x] Naming Standards - camelCase for variables, PascalCase for types

## Next Steps

1. **Database Setup**
   - Create PostgreSQL database
   - Run migrations
   - Create seed script for test data

2. **Testing**
   - Unit tests for business logic
   - Integration tests for API routes
   - E2E tests for full booking flow

3. **Escrow Integration**
   - Deploy escrow contract
   - Implement escrow client
   - Wire up payment flows

4. **Notifications**
   - Choose notification provider
   - Implement push/email/in-app
   - Add notification triggers

5. **Background Jobs**
   - Set up job scheduler (Bull, Agenda, etc.)
   - Implement timeout handlers
   - Add monitoring/alerting

6. **Authentication**
   - Implement auth middleware
   - Validate wallet signatures
   - Add rate limiting

7. **Deployment**
   - Set up CI/CD
   - Configure production database
   - Deploy to cloud provider

## References

- Feature Spec: `docs/specs/booking-flow-v1/feature-spec.md`
- Tasks Breakdown: `docs/specs/booking-flow-v1/tasks-breakdown.md`
- Database Schema: `docs/vlossom/06-database-schema.md`
- Backend Architecture: `docs/vlossom/14-backend-architecture-and-apis.md`
