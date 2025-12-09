# implement-feature

You are running the **implement-feature** workflow.

Precondition:
- A spec and task list already exist (ideally from /spec-and-plan).

Goal:
Implement the next slice of the feature with tests.

Steps:

1. Confirm which task you are implementing (Task N from the spec).
2. Identify which agents should lead (backend, solidity, UX, etc.).
3. For this task:
   - Explore the relevant files.
   - Plan the minimal change set.
   - Implement code in small patches.
   - Add or update tests.
4. Run tests (where tools allow) and report output.
5. Summarize:
   - what changed
   - how to run tests
   - any follow-up tasks or risks.

If the change is security- or money-critical, request a `@security-auditor` review.
