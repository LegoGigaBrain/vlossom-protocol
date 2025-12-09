# Skill: Smart Contract Audit Checklist

## Purpose
Reusable checklist for reviewing Solidity/EVM-style smart contracts.

## Checklist

- [ ] Understand intended behavior and core invariants.
- [ ] Verify access control and role management for every state-changing function.
- [ ] Look for reentrancy and other ordering / race-condition risks.
- [ ] Validate input ranges and assumptions (zero values, max values, empty arrays).
- [ ] Check arithmetic assumptions and precision (especially for fees and percentages).
- [ ] Check that errors and reverts are used consistently and clearly.
- [ ] Review external calls (including ERC20 / ERC721 / oracles) for failure and griefing.
- [ ] Confirm events are emitted for all important state changes.
- [ ] Ensure upgrade / migration patterns are intentional (or explicitly non-upgradeable).
- [ ] Ensure tests exist for:
  - happy paths
  - failure / revert paths
  - boundary conditions
  - at least one potential attack scenario.
