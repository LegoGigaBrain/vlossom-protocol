# pragmatic-code-review

You are running the **Pragmatic Code Review** workflow.

Goal:
Deliver a senior-level, structured, dual-pass code review using:
- Reviewer Voice
- Review Structure
- Review Dimensions
- All code standards (global + backend + frontend + security)

Agents involved:
- @pragmatic-code-reviewer (primary)
- @pragmatic-code-review-subagent (analysis support)
- @security-auditor (if needed)
- @backend-engineer or @frontend-engineer (context)

---

## STEP 1 — Clarify Scope

Ask user for:
- specific files, modules, PRs, or diffs
- intent behind the changes
- any specific concerns
- whether this is blocking pre-merge review

Summarize the scope.

---

## STEP 2 — Context Loading

- Load affected code files.
- Load adjacent modules.
- Load associated tests.
- Load relevant standards.

---

## STEP 3 — Pass 1 (High-Level Review)

- Summarize purpose of changes.
- Identify:
  - Top strengths
  - Top risks
  - Missing context
  - High-level correctness concerns

Output:
- Summary
- Strengths
- Primary concerns

---

## STEP 4 — Pass 2 (Detailed Review)

For each issue:
- Title
- Severity (Critical, Major, Minor)
- Description
- Impact
- Recommendation
- Code reference or snippet

Use:
- Code Style Standards
- Naming Standards
- Backend API Standards
- Data Modelling Standards
- Secure Coding Standards

If UI, apply:
- React Component Standards
- Design System Standards

---

## STEP 5 — Testing Review

- Identify missing tests
- Recommend specific tests
- Evaluate current coverage

---

## STEP 6 — Review Dimensions Scoring

Score relevancy:
- Correctness
- Readability
- Maintainability
- Security (if relevant)
- Test Coverage
- Standards Alignment
- Performance (if relevant)

---

## STEP 7 — Next Actions

Provide prioritized, actionable steps.

---

## Final Output Structure

1. Summary  
2. Strengths  
3. Primary Concerns  
4. Detailed Findings  
5. Impact Analysis  
6. Recommendations  
7. Next Actions  
8. Reviewer Confidence  
9. Dimensions Score  
