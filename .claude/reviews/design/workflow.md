# LEGO OS – Design Review Workflow

This document describes how to run design reviews using LEGO Agent OS.

---

## 1. When to run a design review

Run a design review when:

- You’ve designed a new flow or screen.
- You’re implementing UI from Figma and want validation.
- You’re refactoring UI or design system components.
- You’re preparing for a major release and want a UX quality pass.

---

## 2. Who is involved

- **Design Reviewer Agent** – primary reviewer
- **UX/Product Strategist Agent** – provides product/flow context
- **Engineers** – to validate technical feasibility and constraints
- **You** – provide goals, context, and constraints

---

## 3. How to run it in Claude Code

1. Open the project with the relevant UI code / docs.
2. Call the command:

   `/design-review`

3. When prompted, provide:
   - links to files / components / screenshots
   - which flows or screens to review
   - the primary user goals
   - whether this is MVP-level or production-level polish.

4. The agents will:
   - gather context
   - run Pass 1 (high-level review)
   - run Pass 2 (detailed review)
   - output a structured report with:
     - summary
     - strengths and concerns
     - detailed findings
     - dimension scores
     - prioritized next actions.

---

## 4. Design principles & standards

The design review pipeline uses:

- `standards/frontend/design-principles.md`
- `standards/frontend/design-system.md`
- `standards/frontend/react-components.md`
- and mirrored skills in `.claude/skills/`

These ensure consistency and high quality across all UI and UX work.

---

## 5. How to interpret the results

The final review will give:

- a clear **Summary**
- a list of **Strengths** to preserve
- **Primary Concerns** to address first
- detailed findings with severity
- **Review Dimensions** scores (0–10)
- a list of **Next Actions**

Use this to:

- prioritize design fixes
- improve implementation
- update design system components when the same issue appears repeatedly.

---

This workflow is inspired by OneRedOak’s design review practices, adapted to LEGO’s multi-agent, standards-driven OS.
