# product-plan

You are running the **Product Plan** workflow in LEGO Agent OS.

Goal:
Use the product templates to generate or update the project’s core product documents:

- `docs/project/mission.md`
- `docs/project/roadmap.md`
- `docs/project/tech-stack.md`
- `docs/project/changelog.md`

These become the canonical “project brain” docs that other commands and agents read.

---

## Templates

This workflow expects the following templates to exist:

- `product-templates/mission.template.md`
- `product-templates/roadmap.template.md`
- `product-templates/tech-stack.template.md`
- `product-templates/changelog.template.md`

They define the **structure and prompts** for each doc.

---

## Primary Agent

- @docs-writer

Supporting Agents:
- @senior-architect  (for alignment with overall architecture)
- @backend-engineer  (for tech stack details)
- @ux-product-strategist (for user-facing mission & roadmap narrative)

Skills:
- Documentation Style
- GitBook Documentation (if target is GitBook)
- Reviewer Voice (for doc refinement)

---

## STEP 1 – Clarify Project Context

Ask the user (or infer from existing files):

- Project name
- Short one-paragraph description
- Primary target users
- Core problem being solved
- Current stage (idea / prototype / alpha / beta / production)

Read any existing:
- `CLAUDE.project.md` (if present)
- `README.md`
- any existing docs under `docs/project/`

Summarize the project in your own words before generating docs.

---

## STEP 2 – Check for Existing Project Docs

Look for:

- `docs/project/mission.md`
- `docs/project/roadmap.md`
- `docs/project/tech-stack.md`
- `docs/project/changelog.md`

Cases:

1. **Docs do not exist yet**  
   → Treat this as initial generation.

2. **Docs already exist**  
   → Treat this as an update/refinement pass:
     - keep the existing structure where meaningful
     - extend and improve content guided by the templates
     - do NOT destroy useful custom content.

---

## STEP 3 – Generate or Update `mission.md`

1. Read `product-templates/mission.template.md`
2. Use:
   - template headings & prompts
   - project context from STEP 1
   - any mission info in `CLAUDE.project.md` or README
3. Generate or update `docs/project/mission.md` with:
   - product name
   - mission (1–3 sentences)
   - target users
   - key value props
   - differentiation
   - long-term vision

Ensure the final doc is:
- concrete (Vlossom-specific, RUN-specific, etc.)
- aligned with Documentation Style standards.

---

## STEP 4 – Generate or Update `roadmap.md`

1. Read `product-templates/roadmap.template.md`
2. Use:
   - current product stage
   - known milestones / phases
   - near-term vs long-term priorities
3. Generate or update `docs/project/roadmap.md`:
   - current stage
   - Now (0–3 months)
   - Next (3–9 months)
   - Later (9+ months)
   - Non-goals

The OS should infer initial items from your project description and then refine over time.

---

## STEP 5 – Generate or Update `tech-stack.md`

1. Read `product-templates/tech-stack.template.md`
2. Use:
   - existing code / folder structure
   - known tech choices (frontend/backend/contracts/infra)
3. Generate or update `docs/project/tech-stack.md` with:
   - frontend stack
   - backend stack
   - smart contracts / web3 stack (if applicable)
   - infra & DevOps

This becomes the single source of truth for “what we’re building with”.

---

## STEP 6 – Generate or Update `changelog.md`

1. Read `product-templates/changelog.template.md`
2. If `docs/project/changelog.md` does not exist:
   - create it by:
     - copying the conventions
     - adding an initial entry like:
       - `[YYYY-MM-DD] v0.1.0 – Initial project setup`
       - with bullets describing:
         - project initialized
         - LEGO Agent OS integrated
         - initial mission/roadmap/tech-stack written
3. If `docs/project/changelog.md` exists:
   - append a new entry describing the latest significant change (e.g. “Updated roadmap for new quarter”)
   - keep older entries unchanged.

---

## STEP 7 – Output Summary

After generating/updating docs, output a summary including:

- Which docs were created:
  - mission / roadmap / tech-stack / changelog
- Which docs were updated
- A quick, human-readable TL;DR of each:
  - 1–2 line synopsis per doc

---

## Notes

- `/product-plan` may be called directly by the user, or indirectly by `/context-sync` during initial project setup.
- Once `docs/project/*.md` exist, other workflows (spec-review, architecture-review, etc.) should treat them as canonical project meta-docs.
