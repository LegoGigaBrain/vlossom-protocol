# design-review

You are running the **design-review** workflow in LEGO Agent OS.

Goal:
Perform a structured, senior-level design review of one or more UX flows, UI screens, or frontend implementations, using:
- S-Tier Design Principles
- React & Design System Standards
- Review Voice, Structure, and Dimensions.

Recommended agents:
- @design-reviewer (primary)
- @ux-product-strategist (for flows and product context)
- @backend-engineer (optional, for API-driven constraints)
- @security-auditor (optional, for auth / payment / sensitive flows)

Recommended skills:
- S-Tier Design Principles
- React Components Standards
- Design System Standards
- Reviewer Voice
- Review Structure
- Review Dimensions

---

## Steps

### 1. Clarify Scope

Ask the user:

- What are we reviewing?
  - Screens? (attach image paths, Figma descriptions, or component files)
  - Flows? (describe steps, routes, or user journeys)
- What is the primary user goal?
- Is this:
  - MVP-level (good enough to validate), OR
  - production-level (needs high polish)?

Summarize the scope and constraints before proceeding.

---

### 2. Gather Context

- Load any relevant:
  - frontend components
  - design system documentation
  - product mission/roadmap
  - specs (if available)
- Confirm:
  - assumptions about target users
  - key use cases this design must support.

---

### 3. Pass 1 – High-Level Review

Using @design-reviewer:

1. Evaluate overall:
   - clarity of purpose per screen
   - flow coherence
   - whether primary tasks are easy to find and complete
2. Identify:
   - 3–5 top-level strengths
   - 3–5 top-level concerns
3. Output:
   - a short **Summary**
   - **Strengths** (at high level)
   - **Primary Concerns** (at high level)
   - initial **Recommendation** (e.g., “good enough for MVP with fixes”, “needs more iteration”).

---

### 4. Pass 2 – Detailed Review

Using @design-reviewer (and @ux-product-strategist if needed):

1. Go screen-by-screen or flow-by-flow.
2. Apply:
   - S-Tier Design Principles checklist
   - React & Design System standards
3. For each significant issue, provide:
   - **Title** (e.g., “Hierarchy unclear in bookings list”)
   - **Severity**: Critical / Major / Minor
   - **Description**: what’s wrong
   - **Impact**: on user experience / comprehension / errors
   - **Recommendation**: concrete change(s)
   - If possible, tie back to:
     - a specific principle (e.g., “Clarity & focus”, “Empty state design”, “Accessibility contrast”).

---

### 5. Review Dimensions & Scoring

Using Review Dimensions:

- Score key aspects (0–10):
  - Clarity of purpose
  - Visual hierarchy
  - Task efficiency
  - Consistency with design system
  - Accessibility (estimated)
  - Responsiveness (if applicable)
  - Standards Alignment
- Add a short commentary:
  - where the design particularly shines
  - where it needs the most improvement.

---

### 6. Final Output Structure

Use the **Review Structure** skill to format the final output as:

1. **Summary**
2. **Strengths**
3. **Primary Concerns**
4. **Detailed Findings**
5. **Impact Analysis**
6. **Recommendations**
7. **Next Actions** (clear checklist)
8. **Reviewer Confidence Level**
9. **Review Dimensions Scores**

Keep the tone aligned with the **Reviewer Voice** skill.

---

## Output

You MUST produce:

- A well-structured review document using the sections above.
- Concrete, prioritized recommendations.
- Dimension scores and a clear call on whether the design is:
  - ready as-is,  
  - ready after a few targeted changes, or  
  - in need of deeper iteration.

Avoid vague feedback; be specific and actionable.
