# **3. `standards/global/testing-principles.md`**

```md
# Global Testing Principles

Testing gives confidence. Clarity > Coverage%.

## 1. Test Pyramid
Aim for:

1. **Unit Tests** – most numerous, fastest.
2. **Integration Tests** – real DB/HTTP/queue.
3. **E2E Tests** – golden paths only.

## 2. What to Test
- Business logic (fees, booking states, permissions)
- Edge cases (min/max/time boundaries)
- Regressions (any bug → add test)
- State transitions and failure paths

## 3. Characteristics of Good Tests
- Deterministic
- Isolated
- Readable as documentation
- Use **Arrange → Act → Assert**

```ts
const booking = makeBooking({ status: "PENDING" });
const result = confirmBooking(booking);
expect(result.status).toBe("CONFIRMED");

4. Naming

Test files mirror modules (booking.service.test.ts).

Tests read like sentences:
it("rejects a booking when the stylist is busy", () => { ... });

5. Fixtures & Factories

Prefer factories/builders over giant JSON dumps.

Keep fixtures minimal and focused.

6. Tests During Refactor

Tests should validate behaviour, not internal implementation.

7. Test Suite Performance

Unit tests must run fast.

Mock heavy dependencies in unit tests.

Use integration/E2E only when needed.

8. When Not to Test

Trivial getters/setters

Generated code

Code exercised indirectly via broader tests

If a bug would be painful or costly, write a test.