# code-review

You are running the **code-review** workflow in LEGO Agent OS.

Goal:
Perform a focused, senior-level code review of recent changes or a pull request, checking for:
- correctness
- readability & maintainability
- alignment with project standards
- test coverage
- potential security / performance issues

Recommended agents:
- @backend-engineer
- @solidity-protocol-engineer (if contracts are involved)
- @security-auditor (for sensitive changes)
- @senior-architect (for architectural shifts)

Recommended skills:
- Backend Design Checklist
- Smart Contract Audit Checklist (if relevant)
- UX Review Checklist (if UI logic is heavily affected)

---

## Steps

1. **Clarify scope**
   - Ask the user to specify:
     - files, diff, or PR/branch to review
     - any particular concerns (e.g., “security”, “performance”, “API shape”).
   - Confirm whether this is:
     - a light review, or
     - a blocking review before merge.

2. **Explore the changes**
   - Read the diff or changed files.
   - Identify:
     - main purpose of the change
     - related modules / functions
     - any new dependencies or patterns.

3. **Understand intent**
   - Summarize, in your own words:
     - what the change is supposed to do
     - how it fits into the existing system.
   - If intent is unclear, call this out before nitpicking.

4. **Review for correctness**
   - Check:
     - control flow & edge cases
     - error handling & fallbacks
     - data validation & sanitization
     - concurrency issues (where applicable).
   - For smart contracts, also consider:
     - invariants
     - funds and state transitions
     - potential exploits (use Smart Contract Audit Checklist).

5. **Review for style & maintainability**
   - Check for:
     - adherence to project standards (naming, structure, patterns)
     - unnecessary complexity
     - duplication
     - missing comments on non-obvious logic.

6. **Review for tests & observability**
   - Look at tests touched or added.
   - Ask:
     - Are happy paths covered?
     - Are failure and edge cases covered?
     - Are tests brittle or overfitted?
   - For critical flows, recommend:
     - extra tests
     - logging / metrics if missing.

7. **Review for security & performance (light pass)**
   - Highlight:
     - obvious security smells (dangerous input usage, auth issues, unsafe external calls).
     - obvious performance pitfalls (N+1 DB queries, excessive loops, blocking calls).

8. **Summarize findings**
   - Group into:
     - **Must fix before merge** (blocking)
     - **Should fix soon** (non-blocking but important)
     - **Nice to have** (nitpicks / style suggestions)

---

## Output

1. **High-level summary**
   - 3–7 sentences describing:
     - what the code is trying to do
     - overall quality
     - your merge recommendation (Approve / Approve with nits / Request changes).

2. **Findings grouped by severity**
   - For each finding:
     - File + location (if possible)
     - Short title
     - Explanation
     - Suggested fix or improvement

3. **Testing recommendations**
   - Which
