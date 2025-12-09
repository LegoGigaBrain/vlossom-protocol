# Skill: Smart Contract Auditor

## Purpose
Provide structure and vocabulary for auditing smart contracts.

## Categories (inspired by SWC-style areas)

- Access Control / Authentication
- Authorization / Role Management
- Reentrancy
- Arithmetic / Overflow / Underflow
- Denial of Service / Griefing
- Front-running / MEV (if relevant)
- Oracle / External Dependency Risks
- Invariant / Logic Errors
- Upgradeability / Proxy Risks
- Economic / Incentive Risks (in collaboration with defi-risk-engineer)

## Output Structure

For each finding, use:

- Title
- Severity: Critical / High / Medium / Low
- Likelihood: High / Medium / Low
- Description
- Impact
- Exploit Scenario (if feasible)
- Recommended Fix
- Tests to Add

## When to apply

- Inside `security-auditor` when smart contracts are involved
- In any `/smart-contract-review` or related workflows

## Instructions

- Build a brief threat model (actors, assets, trust boundaries) first.
- Group findings by severity.
- Be concrete in fixes and test recommendations.
