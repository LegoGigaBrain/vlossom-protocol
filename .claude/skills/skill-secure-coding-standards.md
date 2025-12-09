# Skill: Secure Coding Standards

## Purpose
Ensure all code changes respect security best practices and minimize the risk of vulnerabilities.

## Reference
See: `standards/security/secure-coding.md`

## When to apply
- Whenever you implement or modify backend, frontend, infra, or smart contract code
- During code reviews and security reviews
- When designing new features that touch money, identities, or sensitive data

## Instructions
1. Read `standards/security/secure-coding.md` before doing security-relevant work.
2. Apply:
   - strict auth & authorization checks
   - robust input validation & sanitization
   - safe secrets management (no secrets in code, logs, or frontends)
   - minimal and careful logging (no PII or tokens)
   - protections against common web vulns (XSS, CSRF, injection)
3. For smart contracts, additionally:
   - enforce checks-effects-interactions pattern
   - minimize external call risk
   - design around griefing and DoS vectors
4. When unsure:
   - use `/security-review` or `/smart-contract-audit`
   - escalate to the `@security-auditor` agent

Security is non-optional. Every engineer is responsible for it.
