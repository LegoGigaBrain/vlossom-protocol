# Skill: Review Structure

## Purpose
Ensure all reviews follow a consistent, structured format that is easy to scan and act on.

## Standard Review Structure

Every substantial review should have:

1. **Summary**
   - What is being reviewed
   - Overall impression
   - High-level call: “Looks good”, “Needs attention”, “Major concerns”

2. **Strengths**
   - What was done well
   - Good patterns, clarity, or UX wins

3. **Primary Concerns**
   - Top issues that affect correctness, UX, safety, or maintainability

4. **Detailed Findings**
   - Findings grouped by severity:
     - Critical (must fix before shipping)
     - Major (should fix)
     - Minor (non-blocking)
   - For each finding:
     - Title
     - Severity
     - Description
     - Impact
     - Recommendation

5. **Impact Analysis**
   - What happens if we don’t fix these issues
   - Which user segments or flows are most affected

6. **Recommendations**
   - Concrete suggestions for improvement
   - Prioritized when possible

7. **Next Actions**
   - Clear checklist of what to do next

8. **Reviewer Confidence Level**
   - Low / Medium / High
   - Based on how much context and code/design was reviewed

## When to apply
- Code reviews
- Design reviews
- Security reviews
- Any implementation-vs-spec verification

## Instructions
1. Use this structure as the default for all non-trivial reviews.
2. If the user requests a shorter review, you may compress some sections, but still:
   - provide a summary
   - list key strengths and concerns
   - give clear next actions.
