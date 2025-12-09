# LEGO Agent OS – Overview

LEGO OS is a modular, multi-agent operating system for building software with Claude Code.

It provides:
- A clean project structure  
- World-class engineering standards  
- Multi-agent roles  
- Review workflows  
- Documentation tooling  
- Context file organization  
- Commands that orchestrate complex tasks  

LEGO OS allows you to build scalable, maintainable, high-quality projects using Claude as a senior engineering team.

---

## Why LEGO OS?

Claude Code is powerful — but without structure, context becomes chaotic.  
LEGO OS solves that by offering:

- **Separation of concerns** (agents, commands, skills)
- **Clear standards** (global, backend, frontend, design, security)
- **Layered context** (CLAUDE.base → project → folder → spec)
- **Formal review workflows** (code, design, security, architecture, UX)
- **Documentation pipeline** (write-docs, gitbook-docs)
- **Extensibility** (add new agents/skills for any future project)

LEGO OS = *“Build software like a senior engineering org, using AI.”*

---

## Core Concepts

### 🧱 1. Agents  
Each agent represents a senior role:
- backend engineer  
- frontend engineer  
- senior architect  
- security reviewer  
- design reviewer  
- docs writer  
- context steward  

They read standards and context, then act accordingly.

---

### 📜 2. Standards  
Engineering, design, security, docs —  
centralized in `standards/`  
and mirrored as `skills/` for agents to apply.

This ensures consistency across all work.

---

### 🧩 3. Commands  
Slash commands orchestrate multi-agent workflows:
- `/pragmatic-code-review`
- `/design-review`
- `/security-review`
- `/write-docs`
- `/gitbook-docs`
- `/context-sync`
- `/architecture-review`
- `/smart-contract-review`

These are reusable across *all* projects.

---

### 🗂 4. Context Files (CLAUDE Files)

To avoid bloated root context:
- `CLAUDE.base.md` holds LEGO OS rules
- `CLAUDE.project.md` holds project intentions
- folder-level `CLAUDE.md` explain their subdomains  
- `docs/project/{plan, roadmap, changelog}.md` capture evolving project knowledge

Agents read these **procedurally** in layers.

---

## What LEGO OS Enables

- High-quality engineering at scale  
- Predictable workflows  
- Senior-level code & design reviews  
- Clean documentation  
- Fast onboarding for new contributors  
- Easy reuse across multiple projects  
- GitBook-ready documentation  

It becomes your **AI-native engineering operating system**.
