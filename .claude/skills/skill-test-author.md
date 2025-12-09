# Skill: Test Author

## Purpose
Design robust tests before and during implementation.

## Responsibilities

- Identify:
  - happy-path scenarios
  - edge cases
  - failure / revert scenarios
- Plan:
  - unit vs integration tests
  - boundary / property-based tests where useful
- Ensure:
  - all critical behaviours are covered
  - important invariants are tested

## When to apply

- When planning a feature implementation
- When reviewing code to check for test gaps
- Before refactors, to define regression coverage

## Instructions

1. Start from the feature spec and verification checklist.
2. List test cases grouped by domain area (backend, frontend, contracts, infra).
3. For each test case:
   - define input setup
   - expected outcome
   - relevant edge conditions.
4. Highlight untestable behaviour – this often signals a design issue.
