# Skill: Solidity Style & Security

## Purpose
Define Solidity coding patterns and security practices to follow (and avoid).

## Preferred Patterns

- Checks-Effects-Interactions (CEI)
- Minimal external calls, always guarded by checks
- Explicit visibility and mutability (no defaults)
- Clear, descriptive events for state-changing actions
- Simple inheritance; prefer composition and libraries

## Avoid

- Deep or complex inheritance hierarchies
- Unchecked low-level calls
- Opaque modifiers that hide complex logic
- Storing redundant state that can be derived
- Implicit assumptions about external contracts and tokens

## Security Checklist

- Access control:
  - All sensitive functions require explicit auth.
- Reentrancy:
  - External calls come last; use reentrancy guards when needed.
- Invariants:
  - Document key invariants; ensure they hold across state changes.
- Error handling:
  - Use `require`/`revert` with meaningful messages or custom errors.
- Value & token handling:
  - Carefully handle `msg.value` and token transfers.
  - Consider fee-on-transfer or non-standard ERC20 behaviours.

## When to apply

- During contract design and implementation
- During self-review before audits
- During code review and security review workflows
