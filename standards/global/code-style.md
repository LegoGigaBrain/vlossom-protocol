
# Global Code Style Standards

Write code that is **boring**, **predictable**, and **elegant**.

## 1. Languages & Tooling
- Prefer **TypeScript** over JavaScript.
- Use:
  - Prettier for formatting
  - ESLint with TypeScript rules for linting
- For Solidity:
  - Use a consistent pragma version
  - Format with Foundry / Solhint rules

## 2. Structure & Functions
- Keep functions small (< ~40–50 lines).
- Each function does **one thing well**.
- Prefer early returns over deep nesting.

```ts
if (!user) return null;

Extract duplicated logic into helpers.

3. Comments & Documentation

Comment intent (why), not implementation (what).

Use JSDoc / TSDoc / NatSpec for public APIs/contracts.

Inline comments only for:

non-obvious business rules,

complex edge cases.

4. Error Handling

Use a small set of named errors, not arbitrary strings.

Never swallow errors.

Wrap database/external calls with contextual logs.

try {
  await repo.save(entity);
} catch (err) {
  logger.error({ err, entity }, "Failed to save");
  throw new PersistenceError("Could not save entity");
}

5. Async Code

Use async/await.

Do not leave floating promises.

Use Promise.all() for parallel independent work.

6. Defensive Coding

Validate at boundaries: API handlers, external integrations.

Avoid implicit type conversions.

Check external services return valid shapes.

7. Performance Standards

Prioritize clarity; optimize when profiling indicates need.

Watch out for:

N+1 queries

unnecessary loops

over-fetching data

8. Avoid Code Smells

“God files” with multiple responsibilities.

Hidden mutable globals.

Repeated business logic across files.

Feature-flag logic spread everywhere randomly.

Keep code simple, explicit, and readable by a new engineer joining tomorrow.