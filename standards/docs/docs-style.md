# Documentation Style Guide

This guide defines how we write documentation across all LEGO OS projects.

---

## 1. Core Principles

- **Clarity over cleverness** – Explain concepts so a smart newcomer can follow.
- **Concise but complete** – Avoid fluff; cover all critical details.
- **Actionable** – Documentation should help someone do something, not just understand something.
- **Consistent** – Use the same terms, structure, and patterns across docs.
- **Honest** – Call out limitations, tradeoffs, and known issues.

---

## 2. Documentation Types

We commonly use:

- **README / Overview docs**
  - What this project is
  - Who it is for
  - How to get started quickly

- **How-to Guides**
  - Step-by-step guides for concrete tasks (e.g., “Add a new booking status”).

- **Concept Docs**
  - Explain important ideas and models (e.g., “Vlossom Liquidity Pools”, “Reputation System”).

- **Reference Docs**
  - API endpoints, config options, CLI commands, event schemas.

- **Architecture Docs**
  - High-level diagrams, data flows, system boundaries, failure modes.

- **Changelogs / Release Notes**
  - What changed, why, and how to migrate.

---

## 3. Structure & Formatting

Use Markdown with:

- Clear headings (`#`, `##`, `###`)
- Short paragraphs (2–4 sentences)
- Bullet lists for key points
- Numbered lists for sequences of steps
- Code fences for examples
- Tables where helpful

Each doc should ideally start with:

1. **Title**
2. **One-paragraph summary**
3. **Who this is for**
4. **Prerequisites (if any)**
5. **Quick TL;DR or “On this page” list**

---

## 4. Language & Tone

- Use direct, friendly, professional language.
- Prefer active voice:
  - “Run this command” instead of “This command should be run”.
- Avoid unexplained acronyms.
- Define domain terms the first time you use them.
- Avoid marketing speak in technical docs.
- When describing tradeoffs, be neutral and honest.

---

## 5. Terminology & Consistency

- Use consistent names for:
  - features
  - modules
  - entities (e.g., “Booking”, “Stylist”, “Property”)
- Avoid having multiple terms for the same concept.
- Keep a **Glossary** for domain-heavy projects.

---

## 6. Examples & Snippets

- Prefer practical examples over abstract ones.
- Show real command outputs, API JSON, and code.
- Keep examples minimal but realistic.
- Mark placeholders clearly (`<YOUR_API_KEY>`, `<booking_id>`).

---

## 7. Cross-linking & Navigation

- Link related docs at the bottom (“See also”).
- Cross-link concepts, how-to guides, and references when relevant.
- Avoid duplication; if content must exist in multiple places, link instead.

---

## 8. GitBook-Specific Notes

When writing for GitBook:

- Use a clear hierarchy of pages (organized by topic).
- Each page should cover one primary concept or task.
- Use short, descriptive titles.
- Provide an “On this page” section or TOC if the doc is long.
- Ensure content reads well in a web context (skim-friendly).

---

## 9. Change Management

- Keep docs in sync with code.
- For meaningful features:
  - Update or add docs as part of the PR.
- Note breaking changes clearly with:
  - what changed
  - why
  - how to migrate.

Documentation is a first-class citizen, not an afterthought.
