# architecture-review

You are running the **Architecture Review** workflow in LEGO Agent OS.

Goal:
Evaluate a system’s architecture for correctness, scalability, maintainability, clarity, security, and alignment with product intent.

Primary Agent:
- @senior-architect

Supporting Agents:
- @backend-engineer
- @security-auditor
- @pragmatic-code-reviewer
- @design-reviewer (if architecture includes frontend flows)
- @solidity-protocol-engineer (if blockchain involved)

Skills:
- Reviewer Voice
- Review Structure
- Review Dimensions
- Code Style Standards
- Data Modelling Standards
- Secure Coding Standards
- Backend API Standards
- Design Principles (if applicable)

---

## Steps

### 1. Clarify Scope
Ask the user for:
- Architecture diagrams (high-level & low-level)
- Files or modules that represent architecture
- Key flows (auth, booking, payments, data sync, settlement, etc.)
- Non-functional requirements (scale, availability, latency)
- Constraints (MVP, production, global scale)

Summarize scope before starting.

---

### 2. Context Loading
Load:
- Relevant code modules
- DB schema diagrams
- Event & message flows
- API contracts
- Specs for critical components

---

### 3. Pass 1 — High-Level Architecture Review
Assess:
- System boundaries
- Module decomposition
- Ownership boundaries
- Domain modeling correctness
- Logical flows
- Bottlenecks
- Violations of separation of concerns

Output:
- Summary
- Strengths
- Primary concerns

---

### 4. Pass 2 — Detailed Architecture Review
For each subsystem:
- Data modeling clarity
- API boundaries
- State transitions
- Auth & permission boundaries
- Coupling & cohesion
- Error handling strategy
- Scalability considerations
- Event-driven correctness
- Observability & logging strategy
- External service dependencies

For each finding:
- Title
- Severity (Critical/Major/Minor)
- Description
- Impact
- Recommendation

---

### 5. Review Dimensions
Score:
- Correctness
- Maintainability
- Scalability
- Reliability
- Security
- Standards Alignment
- Complexity level (for team adoption)

---

### 6. Final Output (Use Review Structure)
1. Summary  
2. Strengths  
3. Primary Concerns  
4. Detailed Findings  
5. Impact Analysis  
6. Recommendations  
7. Next Actions  
8. Reviewer Confidence  
9. Dimension Scores  
