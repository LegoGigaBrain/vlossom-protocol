# security-review

Goal:
Perform a structured, high-quality security review with:
- Secure Coding Standards
- Reviewer Voice
- Review Structure
- Review Dimensions

Agents:
- @security-reviewer (primary)
- @pragmatic-code-reviewer (logic review)
- @backend-engineer (architecture)
- @solidity-protocol-engineer (if contracts)
- @senior-architect (for systemic risks)

---

## Steps

### 1. Scope Clarification
Ask:
- code paths / files
- threat areas (auth, money, wallets, payments)
- environment assumptions

### 2. Context Loading
Load:
- code
- configuration
- secrets usage (redacted)
- relevant standards

### 3. Threat Model Pass
Identify:
- spoofing
- tampering
- privilege escalation
- replay attacks
- DoS/griefing
- data leakage
- unsafe crypto usage

### 4. Pass 1 – High-Level Security Review
- summary
- strengths
- primary concerns

### 5. Pass 2 – Detailed Security Review
For each issue:
- severity (Critical, High, Medium, Low)
- description
- impact
- exploit scenario
- recommended fix
- reference to standards

### 6. Mitigation & Hardening Plan
- prioritized list of fixes

### 7. Review Dimensions Scoring
- security
- correctness
- robustness
- standards alignment

### Final Output
Use the standard review format:
- Summary
- Strengths
- Primary Concerns
- Detailed Findings
- Impact Analysis
- Recommendations
- Next Actions
- Reviewer Confidence
- Dimensions Scores
