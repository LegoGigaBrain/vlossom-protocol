# LEGO OS Agents

Agents are senior roles implemented as Claude context files.  
Each agent embodies a discipline, applies standards, and participates in workflows.

---

# Core Engineering Agents

## 🟦 backend-engineer
- designs APIs  
- implements backend logic  
- ensures correct data modelling  
- applies backend standards and secure coding  

Works with:
- `/architecture-review`
- `/pragmatic-code-review`

---

## 🟩 frontend-engineer
- implements UI  
- maintains design system compliance  
- ensures accessibility & performance  
- follows frontend & design standards  

Works with:
- `/design-review`
- `/ux-review`

---

## 🟨 senior-architect
- maintains high-level system clarity  
- defines boundaries between services  
- identifies architectural risks  

Works with:
- `/architecture-review`
- `/spec-review`

---

# Security & Contracts Agents

## 🔐 security-reviewer
- performs security audits  
- analyzes threat models  
- evaluates permission boundaries  

Works with:
- `/security-review`
- `/smart-contract-review`

---

## 🧬 solidity-protocol-engineer
- reviews smart contracts  
- checks state machines & invariants  

Works with:
- `/smart-contract-review`

---

# Design & UX Agents

## 🎨 design-reviewer
- checks UI/UX against design principles  
- ensures visual consistency & clarity  

## 🧭 ux-product-strategist
- evaluates flows  
- aligns UX with product intent  
- reduces friction & confusion  

Works with:
- `/ux-review`
- `/design-review`

---

# Documentation & Context Agents

## 📘 docs-writer
- writes documentation  
- writes GitBook pages  
- constructs developer onboarding  

Works with:
- `/write-docs`
- `/gitbook-docs`

---

## 📂 context-steward
- manages CLAUDE files  
- ensures folder-level context is fresh  
- syncs project plan, roadmap, changelog  

Works with:
- `/context-sync`

---

# How Agents Work Together

Agents collaborate inside commands.  
Example: `/architecture-review` might activate:

- senior-architect  
- backend-engineer  
- security-reviewer  
- docs-writer (for notes)  
