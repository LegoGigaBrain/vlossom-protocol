# Context Files (CLAUDE Files)

CLAUDE files and core project docs give agents a layered understanding of your project.

---

## Purpose

- Avoid context overload.
- Keep global OS rules separate from project rules.
- Maintain folder-level clarity.
- Make onboarding easy.
- Ensure agents read context in the correct order.

---

## Types of Context

### 1. Global OS Context

`CLAUDE.base.md`  
Defines:
- OS rules
- agent behaviour
- global standards
- review philosophy

---

### 2. Project Context

`CLAUDE.project.md`  
Defines:
- project mission at a high level
- domain vocabulary
- constraints
- pointers to core project docs:
  - `docs/project/mission.md`
  - `docs/project/roadmap.md`
  - `docs/project/tech-stack.md`
  - `docs/project/changelog.md`

---

### 3. Folder-Level Context

`path/to/folder/CLAUDE.md`  
Defines:
- purpose of that folder
- key files & entrypoints
- local conventions
- dependencies (imports, services)
- footguns / gotchas

Short, precise, and linked to deeper docs.

---

### 4. Project Meta-Docs (Product-Level)
docs/project/
mission.md ← from mission.template.md
roadmap.md ← from roadmap.template.md
tech-stack.md ← from tech-stack.template.md
changelog.md ← from changelog.template.md


Generated/updated via `/product-plan`.  
These capture:
- what we’re building
- for whom
- when (roadmap)
- with what stack
- how it has changed over time.

---

### 5. Feature Specs

For each feature:
docs/specs/<feature>/
feature-spec.md
tasks-breakdown.md
verification-checklist.md


Generated/updated via `/spec-and-plan`, using:

- `spec-templates/feature-spec.template.md`
- `spec-templates/tasks-breakdown.template.md`
- `spec-templates/verification-checklist.template.md`

These drive:
- spec review
- implementation planning
- verification / QA.

---

## Procedural Reading Order

Agents read context in layers:

1. `CLAUDE.base.md` — OS-level rules  
2. `CLAUDE.project.md` — project-level intentions  
3. `docs/project/mission.md`  
4. `docs/project/roadmap.md`  
5. `docs/project/tech-stack.md`  
6. `docs/project/changelog.md`  
7. folder-level `CLAUDE.md`  
8. feature specs under `docs/specs/<feature>/`  
9. code  

This produces a stacked hierarchical understanding.

---

## When /context-sync Gets Involved

- On new or evolving projects:
  - `/context-sync` (via `context-steward`) checks:
    - whether these docs exist
    - whether there are obvious gaps (e.g., code for features with no specs)
  - If missing:
    - it suggests or triggers `/product-plan` and `/spec-and-plan`.
- Over time:
  - it helps split large `CLAUDE.md` files
  - moves narrative into proper docs
  - keeps context clean and layered.


