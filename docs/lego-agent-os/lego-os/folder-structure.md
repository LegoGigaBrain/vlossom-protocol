# LEGO OS Folder Structure

This document explains the structure of a LEGO OS–enabled project.  
Each folder has a clear purpose and a corresponding set of agents, skills, or standards.

---

## Root Structure

project-root/
.claude/
agents/
skills/
commands/
standards/
reviews/
docs/
src/ or apps/ or contracts/ (project-specific code)
CLAUDE.base.md
CLAUDE.project.md


---

## `.claude/` — Brain of the OS

### `/agents/`
Each agent is a senior-role context file:
- backend-engineer.md  
- frontend-engineer.md  
- senior-architect.md  
- design-reviewer.md  
- security-reviewer.md  
- docs-writer.md  
- context-steward.md  

Agents enforce standards and workflows.

---

### `/skills/`
Reusable rules and micro-guidelines:
- reviewer-voice  
- review-structure  
- review-dimensions  
- design-principles  
- code-style  
- naming  
- testing  
- secure coding  
- docs style  
- gitbook docs  
…etc.

Agents import these automatically.

---

### `/commands/`
Slash commands orchestrating workflows:
- pragmatic-code-review  
- design-review  
- security-review  
- architecture-review  
- ux-review  
- smart-contract-review  
- write-docs  
- gitbook-docs  
- context-sync  

These combine multiple agents and standards.

---

## `standards/` — Source of Truth for Quality

- `/global/` → naming, code style, testing principles  
- `/backend/` → API design, data modelling  
- `/frontend/` → design system, React component standards  
- `/security/` → secure coding, threat models  
- `/docs/` → documentation style & context file standards  

Agents always read these first.

---

## `reviews/` — Human-Friendly Guides

reviews/
design/
code/
security/
architecture/
ux/


Each contains:
- workflow explanations  
- templates  
- best practices  

These mirror the commands but in human-readable form.

---

## `docs/` — Project Documentation (including LEGO OS docs)

## `docs/` — Project Documentation (including LEGO OS docs)

- `docs/project/mission.md`      ← from mission.template.md  
- `docs/project/roadmap.md`      ← from roadmap.template.md  
- `docs/project/tech-stack.md`   ← from tech-stack.template.md  
- `docs/project/changelog.md`    ← from changelog.template.md  

- `docs/lego-os/` → this OS handbook  
- `docs/specs/`   → feature specifications (from spec-templates)  

---

## Project Folders (src, apps, packages, contracts)

Each important folder should have its own:

path/to/folder/CLAUDE.md


This reduces root context load and clarifies local conventions.

---

## Procedural Reading Order for Agents

1. `CLAUDE.base.md` (OS rules)  
2. `CLAUDE.project.md` (project intent)  
3. `docs/project/{plan, roadmap, changelog}`  
4. folder-level `CLAUDE.md`  
5. relevant standards  
6. specs  
7. code  

This ensures layered understanding.
