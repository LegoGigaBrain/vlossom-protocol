# Skill: Backend API Standards

## Purpose
Ensure all APIs are predictable, consistent, and easy to consume.

## Reference
See: `standards/backend/api-design.md`

## When to apply
- designing backend endpoints
- creating or modifying controllers/services
- code reviews

## Instructions
1. Read `standards/backend/api-design.md`.
2. Enforce:
   - clear REST patterns
   - standard error shapes
   - correct status codes
   - strong validation
   - consistent pagination
3. Maintain:
   - explicit auth + permission checks
   - idempotency where relevant
   - backward-compatible API evolution

APIs are a public interface — treat them with precision.
