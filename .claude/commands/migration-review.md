# migration-review

Goal:
Validate database schema migrations for safety, reversibility, performance, and correctness.

Primary Agent:
- @backend-engineer

Supporting Agents:
- @senior-architect
- @pragmatic-code-reviewer

Skills:
- Data Modelling Standards
- Reviewer Voice
- Review Structure
- Review Dimensions

---

## Steps

### 1. Scope Clarification
Ask:
- Migration file(s)
- Expected data size
- Deployment environment
- Backward compatibility concerns
- Downtime constraints

---

### 2. Pass 1 – High-Level Review
Check:
- Whether schema matches domain model
- Compatibility with existing code
- Breaking changes
- Rollback feasibility

---

### 3. Pass 2 – Detailed Review
Evaluate:
- Indexes
- Foreign key integrity
- Nullability
- Column type changes
- Large table migrations risk
- Data backfill logic
- Locking impact (writes & reads)
- Transaction safety

For each issue:
- Severity
- Description
- Impact
- Recommendation

---

### 4. Review Dimensions
Score:
- Safety
- Reversibility
- Scalability
- Standards Alignment
- Performance Impact

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
