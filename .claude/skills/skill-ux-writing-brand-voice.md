# Skill: UX Writing — Brand Voice Enforcement

## Purpose
Ensure all product microcopy preserves the canonical brand voice (e.g. “Doc 24” voice),
so implementation does not default to generic SaaS language.

## Applies To
- Errors
- Empty states
- Notifications
- CTAs
- Form helper text
- Onboarding prompts
- Transactional messages (payments, bookings, approvals)
- Consent & privacy messaging

## Core Rules

### 1) Sound Like the Brand
- Use the brand’s emotional posture (calm, confident, dignified, nurturing, playful, etc.)
- Keep language consistent with the brand worldview.
- Avoid corporate, robotic, or overly technical phrasing unless required.

### 2) Always Provide a Next Step
Every message should answer:
- What happened?
- Why it happened? (only if it helps)
- What can the user do now?

### 3) Avoid User-Blame
Replace:
- “You did something wrong”
with:
- “We couldn’t complete this because…”

### 4) Reduce Anxiety
- For errors: reassure, then guide.
- For delays: explain the wait.
- For uncertainty: show what the system is doing.

### 5) Use a Consistent Naming System
Define:
- error labels
- warning labels
- success labels
- action verbs (primary CTAs)

Example:
- Primary CTA = verb-first (“Book appointment”, “Confirm booking”, “Try again”)
- Avoid vague CTAs (“Submit”, “Okay”).

### 6) Build a Microcopy Library
Store reusable templates for:
- empty state
- retry errors
- network issues
- permission denied
- payment pending
- booking pending approval
- success confirmation

## Output Structure

When producing copy, present it as:

- Surface: (where in UI)
- Trigger: (what causes it)
- Message:
  - Title (optional)
  - Body
  - Primary CTA
  - Secondary CTA (optional)
- Notes: (voice and clarity rationale)

## Quality Checklist

- Voice aligned ✅
- Clear cause/effect ✅
- Next step provided ✅
- No blame ✅
- No vague “something went wrong” ✅
- CTAs are specific ✅
- Consistent across screens ✅
