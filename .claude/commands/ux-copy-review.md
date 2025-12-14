# ux-copy-review

You are running the **UX Copy Review** workflow.

Goal:
Ensure every microcopy surface in the specified scope matches the canonical brand voice (Doc 24 voice),
and is clear, consistent, and implementation-ready.

Primary Agent:
- @ux-writer

Supporting Agents:
- @ux-product-strategist (for flow context and UX logic)
- @design-reviewer (for hierarchy, UI placement, and micro-interaction context)

Skills:
- UX Writing — Brand Voice Enforcement

---

## STEP 1 — Clarify Scope

Ask the user:

- What are we reviewing?
  - a set of strings?
  - a folder of components?
  - screenshots of UI states?
  - specific flows (onboarding, booking, payment, etc.)?
- Where is the brand voice reference located?
  - e.g. Doc 24 file path, or a linked doc.

Summarize scope and assumptions.

---

## STEP 2 — Inventory Microcopy Surfaces

Create an inventory of:
- CTA labels
- error messages
- empty states
- helper text
- confirmations
- notifications
- payment states
- edge-case states

Output inventory as a structured list.

---

## STEP 3 — Diagnose Voice Drift

For each surface:
- does it match voice?
- is it generic SaaS?
- is it unclear?
- does it lack a next step?

Tag issues:
- Voice mismatch
- Clarity issue
- Inconsistent term/CTA
- Missing next action
- Over-technical / Over-verbose

---

## STEP 4 — Rewrite Set (Implementation Ready)

For each item:
- Provide final recommended copy using the Skill format:
  - Title (optional)
  - Body
  - Primary CTA
  - Secondary CTA (optional)
- Ensure consistency of terminology and CTA verbs across the system.

---

## STEP 5 — Extract Patterns into a Microcopy Library

Create reusable templates for:
- Network error
- Retry flow
- Permission denied
- Empty state (new user)
- Payment pending / confirming
- Booking pending approval
- Booking confirmed
- Cancellation and refund states

These patterns should be reused in future implementations.

---

## STEP 6 — Output Final

Deliver:
1) Updated copy set
2) Microcopy library templates
3) A short “Voice Rules for Engineers” section
