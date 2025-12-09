# Secure Coding Standards

Security is everyone’s job, not just the auditor’s.

## 1. General mindset

- Assume all inputs are untrusted until validated.
- Assume secrets may leak if mishandled.
- Prefer **defense in depth**: multiple layers of checks.

## 2. Authentication & authorization

- All sensitive operations must:
  - authenticate the caller, AND
  - check explicit permissions.
- Never rely on client-side checks alone.
- Avoid “role by string” scattered through code; centralize permission logic.

## 3. Input validation & sanitization

- Validate all external inputs:
  - HTTP requests
  - message queue payloads
  - blockchain events
  - webhooks.
- Enforce:
  - type
  - length
  - allowed characters where reasonable.
- Use safe parameterized queries for DB access; never concatenate user input into SQL.

## 4. Secrets management

- Secrets (API keys, DB passwords, private keys) must:
  - never be committed to git.
  - be loaded from secure env variables or secret managers.
- Log redacted tokens, never full secrets.

## 5. Logging & privacy

- Avoid logging:
  - passwords or tokens
  - full PII unless absolutely necessary.
- Mask or truncate IDs where possible.

## 6. Web-specific concerns

- Protect against:
  - XSS: never dangerously inject HTML without sanitization.
  - CSRF: enforce CSRF tokens or use same-site cookies and appropriate methods.
  - Clickjacking: configure `X-Frame-Options` / `CSP` appropriately.

## 7. Smart contract specifics (if applicable)

- Minimize trusted external calls.
- Use checks-effects-interactions pattern.
- Be explicit about who can call which functions.
- Consider griefing and DoS vectors via gas usage.

## 8. Dependency hygiene

- Pin dependency versions where feasible.
- Regularly check for vulnerabilities (`npm audit`, `yarn audit`, etc.).
- Avoid obscure dependencies for trivial tasks.

## 9. Reviews & testing

- Use `/security-review` and `/smart-contract-audit` commands for sensitive changes.
- Add tests for:
  - authorization edge cases
  - suspected attack paths.

When making a change, ask: **“Could this be abused, and how?”**  
If you’re not sure, escalate to a security review.
