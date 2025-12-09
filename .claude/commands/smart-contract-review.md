# smart-contract-review

You are running the **Smart Contract Review / Audit Lite** workflow.

Goal:
Perform a structured security and correctness review of Solidity smart contracts.

Primary Agent:
- @solidity-protocol-engineer

Supporting Agents:
- @security-auditor
- @senior-architect
- @pragmatic-code-reviewer

Skills:
- Secure Coding Standards
- Smart Contract Audit Checklist (from LEGO standards)
- Reviewer Voice
- Review Structure
- Review Dimensions

---

## Steps

### 1. Scope Clarification
Ask for:
- Contracts / paths
- External integrations (oracles, tokens, account abstraction)
- Invariants & assumptions
- Economic model (fees, pools, stakes)
- Admin roles & permissions

---

### 2. Pass 1 — High-Level Architectural Review
Evaluate:
- Intended logic
- Role structure
- State machine correctness
- Fund flows
- Event model

Provide:
- Summary
- Strengths
- Primary concerns

---

### 3. Pass 2 — Detailed Security Pass
Check:
- Reentrancy vectors
- State corruption
- Missing permission checks
- Oracle trust boundaries
- Invariant violations
- Griefing / DoS vectors
- Economic exploits
- Integer overflow/underflow
- Function visibility correctness
- Revert reason clarity
- Checks-Effects-Interactions

For each finding:
- Severity
- Description
- Impact
- Exploit scenario
- Recommendation

---

### 4. Review Dimensions
Score:
- Security
- Correctness
- Economic Safety
- Maintainability
- Gas efficiency
- Standards Alignment

---

### 5. Final Output (Review Structure)
1. Summary  
2. Strengths  
3. Primary Concerns  
4. Detailed Findings  
5. Impact Analysis  
6. Recommendations  
7. Next Actions  
8. Reviewer Confidence  
9. Dimension Scores  
