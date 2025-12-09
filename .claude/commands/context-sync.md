# context-sync

You are running the **Context Sync** workflow.

Goal:
Ensure LEGO OS context files and project meta-docs are present, clean, layered, and aligned with templates.

Primary Agent:
- @context-steward

Supporting Agents:
- @docs-writer (for richer docs)
- @senior-architect (for high-level structure)

---

## STEP 1 – Clarify Scope

Ask the user:
- Which root folder or project to operate on?
- Any folders to ignore?
- Whether this is:
  - a dry run (report only), or
  - allowed to create/update files.

Summarize scope.

---

## STEP 2 – Scan Repo Structure

Using Glob/Grep, detect:

- Global context:
  - `CLAUDE.base.md`
  - `CLAUDE.project.md`

- Project docs:
  - `docs/project/mission.md`
  - `docs/project/roadmap.md`
  - `docs/project/tech-stack.md`
  - `docs/project/changelog.md`

- Folder-level context:
  - `**/CLAUDE.md` (excluding base/project)

- Feature specs under:
  - `docs/specs/<feature>/`

And note which product/spec templates exist:
- `product-templates/*.template.md`
- `spec-templates/*.template.md`

---

## STEP 3 – Identify Gaps & Problems

Look for:
- Missing project docs (mission/roadmap/tech-stack/changelog)
- Code/features with no corresponding spec docs
- Missing `CLAUDE.md` in key folders
- Oversized or obviously outdated context files

Prepare a short report:
- Summary
- Strengths
- Primary concerns

---

## STEP 4 – Propose Actions

For each gap:

- For missing project docs:
  - Propose running `/product-plan` to generate them from product-templates.

- For missing feature docs:
  - Propose running `/spec-and-plan` for each detected feature.

- For missing folder-level `CLAUDE.md`:
  - Propose generating them using the Context Files Standard.

Ask for user confirmation before making changes.

---

## STEP 5 – Apply Changes (If Approved)

With user approval:

- Run the equivalent of `/product-plan` to create/update:
  - `docs/project/mission.md`
  - `docs/project/roadmap.md`
  - `docs/project/tech-stack.md`
  - `docs/project/changelog.md`

- Run the equivalent of `/spec-and-plan` for missing feature specs.

- Create/update folder-level `CLAUDE.md` files.

---

## STEP 6 – Final Report

Use Review Structure to output:

1. Summary  
2. Strengths (where context is already good)  
3. Primary Concerns  
4. Detailed Findings (by category: project docs, specs, CLAUDE files)  
5. Recommendations  
6. Next Actions  
7. Reviewer Confidence  
