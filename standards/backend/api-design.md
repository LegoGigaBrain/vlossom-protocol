# Backend API Design Standards

APIs must be predictable, explicit, and easy to consume.

## 1. General Rules
- Prioritize clarity.
- Maintain consistent:
  - URL structure
  - status codes
  - error format
  - payload shapes

## 2. REST Patterns
- Use nouns for resources:

GET /bookings
POST /bookings
GET /bookings/:id
PATCH /bookings/:id
DELETE /bookings/:id


- For actions, use sub-routes:

POST /bookings/:id/cancel
POST /bookings/:id/confirm


## 3. Status Codes
- `200 OK` – success  
- `201 Created` – new resource  
- `204 No Content` – success w/o body  
- `400 Bad Request` – validation failure  
- `401 Unauthorized` – not logged in  
- `403 Forbidden` – no permission  
- `404 Not Found`  
- `409 Conflict` – double booking, race conditions  
- `500 Internal Server Error`

## 4. Standard Error Shape

```json
{
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Stylist is unavailable for this time slot.",
    "details": {
      "start": "2025-01-01T09:00Z",
      "end": "2025-01-01T10:00Z"
    }
  }
}

code: machine-readable constant

message: human-readable

details: structured domain info

5. Input Validation

Validate at the boundary (zod/Yup/class-validator).

Do not trust frontend.

Reject with clear messages and field-level errors.

6. Pagination

Standard structure:
{
  "items": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 157
  }
}

7. Versioning

Use /api/v1/... when performing breaking changes.

8. Auth & Permissions

Auth must be explicit.

Authorization belongs in service layer.

Sensitive operations require explicit role checks.

9. Idempotency

Repeat calls must not cause duplicated side effects.

Support idempotency keys for payment/booking flows.

APIs are a product. Treat them with intentionality.