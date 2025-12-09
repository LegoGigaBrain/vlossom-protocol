# Context Files Standard (CLAUDE Files)

We use `CLAUDE.*` files and core project docs to give Claude Code structured, layered context.

---

## 1. Types of context files

### Global OS file

- `CLAUDE.base.md`
- Defines global LEGO OS rules, standards, and agent behaviours.

### Project-level file

- `CLAUDE.project.md` (or project-specific equivalent)
- Describes:
  - project mission at a high level
  - domain concepts
  - key constraints
  - links to core project docs:
    - `docs/project/mission.md`
    - `docs/project/roadmap.md`
    - `docs/project/tech-stack.md`
    - `docs/project/changelog.md`

### Folder-level files

- `path/to/folder/CLAUDE.md`
- Describe:
  - purpose of that folder
  - key files and entrypoints
  - local conventions and patterns
  - how this folder relates to the rest of the project
  - any gotchas

---

## 2. Core Project Docs (Generated from Product Templates)

We treat these as the canonical “project brain” documents:

- `docs/project/mission.md`
  - Generated/updated from `product-templates/mission.template.md`
  - Captures:
    - product mission
    - target users
    - value proposition
    - differentiation
    - long-term vision

- `docs/project/roadmap.md`
  - Generated/updated from `product-templates/roadmap.template.md`
  - Captures:
    - current stage
    - near / mid / long-term priorities
    - phased milestones

- `docs/project/tech-stack.md`
  - Generated/updated from `product-templates/tech-stack.template.md`
  - Captures:
    - frontend stack
    - backend stack
    - smart contract / web3 stack (if any)
    - infra & DevOps

- `docs/project/changelog.md`
  - Generated/bootstrapped from `product-templates/changelog.template.md`
  - Then maintained over time to track meaningful changes.

These docs are created/updated via the `/product-plan` workflow, not edited manually from scratch.

---

## 3. Procedural Reading Order for Project Context

When performing work in a project, agents should read context in this order:

1. **Global OS context**
   - `CLAUDE.base.md`

2. **Project context**
   - `CLAUDE.project.md`

3. **Project docs (product-level)**
   - `docs/project/mission.md`
   - `docs/project/roadmap.md`
   - `docs/project/tech-stack.md`
   - `docs/project/changelog.md`

4. **Local folder context**
   - `path/to/folder/CLAUDE.md`

5. **Feature specs**
   - Under `docs/specs/<feature>/`:
     - `feature-spec.md`
     - `tasks-breakdown.md`
     - `verification-checklist.md`
   - These are generated/updated via `/spec-and-plan` using `spec-templates/*.template.md`.

6. **Code**

This creates a stacked, layered view from global → project → folder → feature → code.

---

## 4. When to add a folder-level `CLAUDE.md`

Add `CLAUDE.md` to a folder when:

- It contains domain logic or important abstractions.
- It has reusable code or multiple submodules.
- It uses local conventions that differ from the rest of the repo.
- It’s easy to misunderstand without explanation.

Keep folder-level context short and link to deeper docs where needed.

---

## 5. Context Maintenance

- Use `/product-plan` to create and evolve `docs/project/*` docs.
- Use `/spec-and-plan` to create and evolve feature specs.
- Use `/context-sync` (via `context-steward`) to:
  - detect missing or obviously stale context
  - suggest or trigger the above workflows
  - keep root `CLAUDE.base.md` lean by moving project-specific details into:
    - `CLAUDE.project.md`
    - `docs/project/*`
    - folder-level `CLAUDE.md`.
