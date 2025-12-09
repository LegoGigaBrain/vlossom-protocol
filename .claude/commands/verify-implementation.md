# verify-implementation

You are running the **verify-implementation** workflow in LEGO Agent OS.

Goal:
Verify that an implementation matches an existing feature spec and its acceptance criteria.

This workflow connects:
- **specs** → in `specs/` or a provided spec document
- **code changes** → a diff, PR, or set of files
- **tests** → listed or discovered by reading the test suite

Recommended agents:
- @senior-architect
- @backend-engineer / @frontend-engineer / @solidity-protocol-engineer
- @ux-product-strategist (for user-facing features)

Recommended skills:
- Backend Design Checklist
- UX Review Checklist
- Testing standards (if defined)

---

## Steps

1. **Clarify scope**
   - Ask the user to provide:
     - the feature spec (or path to it)
     - where the implementation lives (files / PR / branch)
   - Confirm whether verification is:
     - pre-merge
     - or post-merge sanity checking.

2. **Load and summarize the spec**
   - Read the spec document (e.g. from `specs/feature-*.md`).
   - Extract:
     - feature summary
     - acceptance criteria list
     - any explicit non-goals or constraints.
   - Rewrite acceptance criteria as a numbered list.

3. **Explore the implementation**
   - Read the relevant code and tests.
   - Summarize:
     - main modules / components touched
     - how they map to parts of the spec.

4. **Map criteria → implementation**
   - For each acceptance criterion:
     - Locate where in the code it appears to be implemented.
     - Note relevant tests (unit/integration/E2E).
     - Decide whether the criterion is:
       - **Fully satisfied**
       - **Partially satisfied**
       - **Not implemented**
       - **Unclear / needs clarification**

5. **Gap analysis**
   - For any **partially** or **not** satisfied criteria:
     - Explain what’s missing.
     - Suggest concrete changes (code or tests).
   - Note any behaviour implemented that’s **outside the spec**, and whether it’s acceptable or risky.

6. **UX verification (if applicable)**
   - For user-facing features, check:
     - flows and states match the spec
     - error/empty/loading states exist where described.
   - Use UX Review Checklist where relevant.

7. **Testing verification**
   - List:
     - tests that currently exist and what they cover
     - missing tests tied to specific acceptance criteria.

---

## Output

1. **Summary**
   - 3–7 sentences answering:
     - “Does the implementation meet the spec?”
     - “Are there any critical gaps?”

2. **Criteria matrix**
   - Table or bullet list:
     - Criterion N: Status (Met / Partial / Not met / Unclear)
     - Notes and file references.

3. **Recommended follow-ups**
   - Concrete items:
     - code changes
     - test additions/updates
     - spec clarifications.

Be precise: this workflow is for closing the loop between **spec → code → tests**.
