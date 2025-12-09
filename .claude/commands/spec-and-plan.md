# spec-and-plan

You are running the **Spec and Plan** workflow in LEGO Agent OS.

Goal:
For a given feature, use the spec templates to generate or update the feature’s specification documents:

Under `docs/specs/<feature>/`:

- `feature-spec.md`
- `tasks-breakdown.md`
- `verification-checklist.md`

These docs become the canonical source for implementation planning, code reviews, and verification.

---

## Templates

This workflow expects the following templates to exist:

- `spec-templates/feature-spec.template.md`
- `spec-templates/tasks-breakdown.template.md`
- `spec-templates/verification-checklist.template.md`

They define the **structure and prompts** for each spec file.

---

## Primary Agent

- @docs-writer

Supporting Agents:
- @senior-architect       (for system impact)
- @backend-engineer       (for API/data constraints)
- @frontend-engineer      (if UI is involved)
- @solidity-protocol-engineer (if smart contracts are involved)
- @ux-product-strategist  (for user flows & UX acceptance criteria)

Skills:
- Documentation Style
- Reviewer Voice (for spec refinement)
- Review Structure (if reviewing existing specs)

---

## STEP 1 – Clarify Feature Context

Ask the user:

- Feature name (short slug, e.g. `booking-flow`, `liquidity-pool-setup`)
- One-paragraph description of the feature
- Target users / personas
- Primary user stories / use cases
- Rough timeframe or priority (optional)

Read any existing:

- `docs/project/mission.md`
- `docs/project/roadmap.md`
- `docs/project/tech-stack.md`
- relevant `CLAUDE.md` files (e.g., `apps/web/CLAUDE.md`, `contracts/CLAUDE.md`)

Summarize the feature in your own words before writing specs.

---

## STEP 2 – Determine Feature Spec Folder

Compute the path:

- `docs/specs/<feature-slug>/`

Where `<feature-slug>` is a filesystem-friendly version of the feature name.

Check for existing files:

- `feature-spec.md`
- `tasks-breakdown.md`
- `verification-checklist.md`

Cases:

1. Files do not exist → treat as initial generation.
2. Files exist → treat as an update/refinement pass.

---

## STEP 3 – Generate or Update `feature-spec.md`

1. Read `spec-templates/feature-spec.template.md`.
2. Use:
   - template headings & prompts
   - feature context from STEP 1
   - project docs (mission/roadmap/tech-stack)
3. If file does not exist:
   - create `docs/specs/<feature>/feature-spec.md` using the template structure, filled with concrete details.
4. If file exists:
   - preserve any validated details the user has already refined
   - extend / restructure content guided by the template to improve clarity and completeness.

The final feature spec should clarify:

- Problem & goals
- In-scope & out-of-scope
- User stories / scenarios
- High-level UX expectations
- High-level architecture/flows
- Non-functional requirements (if any)

---

## STEP 4 – Generate or Update `tasks-breakdown.md`

1. Read `spec-templates/tasks-breakdown.template.md`.
2. Use:
   - feature spec from STEP 3
   - project tech stack
3. If file does not exist:
   - create `docs/specs/<feature>/tasks-breakdown.md` with:
     - grouped tasks by area (backend, frontend, contracts, infra, docs)
     - each task with:
       - short title
       - description
       - rough ordering or priority
4. If file exists:
   - refine tasks to align with the updated feature spec
   - ensure tasks are:
     - actionable
     - testable
     - not overly vague.

This becomes the implementation task list.

---

## STEP 5 – Generate or Update `verification-checklist.md`

1. Read `spec-templates/verification-checklist.template.md`.
2. Use:
   - acceptance criteria from feature spec
   - tasks from tasks-breakdown
3. If file does not exist:
   - create `docs/specs/<feature>/verification-checklist.md` with:
     - clear acceptance criteria
     - edge cases
     - UX validation points
     - any observability/metrics checks
4. If file exists:
   - align check items with the refined feature spec and tasks.
   - ensure that:
     - each critical behaviour has at least one verification item.

This document is used later by:

- `/spec-review`
- `/verify-implementation`
- QA or self-check flows.

---

## STEP 6 – Output Summary

After generating/updating docs, output:

- The feature slug and path:
  - `docs/specs/<feature>/`
- Which docs were created vs updated:
  - `feature-spec.md`
  - `tasks-breakdown.md`
  - `verification-checklist.md`
- A short TL;DR of each file (1–2 lines).

---

## Notes

- `/spec-and-plan` can be:
  - run directly by the user when starting a new feature
  - recommended or triggered by `/context-sync` when it detects code changes or folders that clearly represent a feature but lack spec docs.
- Once feature docs exist, other workflows should treat them as canonical:
  - `/spec-review` reads them to check completeness.
  - `/pragmatic-code-review` uses them as intent.
  - `/verify-implementation` uses `verification-checklist.md` as a checklist.
