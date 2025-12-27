# CLAUDE_FRONTEND_BUILD_SPEC
**Project:** Vlossom Protocol Frontend (apps/web)  
**Owner intent:** Award‑level, mobile‑first ritual experience; desktop deepens understanding without becoming a dashboard.  
**Status:** Implementation spec for Claude Code / VS Code agent runs.

---

## 0. Canonical Sources (Read First)
Treat these as binding. If anything conflicts, prefer this order.

1) `docs/HANDOFF_FOR_GEMINI.md`  
2) `docs/STYLE_BLUEPRINT.md`  
3) `docs/vlossom/15-frontend-ux-flows.md`  
4) `docs/vlossom/16-ui-components-and-design-system.md`  
5) Hair Health Intelligence documentation (within `docs/vlossom/*`)

---

## 1. Non‑Negotiable Design Doctrine (Creative Law)
### 1.1 Mobile‑First Canon, Desktop Deepening
- **Mobile is canonical** for daily ritual actions (check‑in, schedule, reflect).
- **Desktop is deeper interpretation**: more context, more editorial, more explanation.
- Desktop **must not** introduce new metaphors, competitive UI, or “control panel” vibes.
- Desktop **may** reveal parallel narrative panels, annotations, and richer cross‑links.

### 1.2 Motion as Information (Never Decorative)
Motion exists only to:
- communicate state change
- confirm alignment
- allow the system to “settle”

Approved motion verbs (only):
- **Unfold** (reveal from center/outward, or top‑edge reveal within a card)
- **Breathe** (subtle fade/scale/glow to indicate readiness/completion)
- **Settle** (gentle expansion/softening to signal stability)

Forbidden motion:
- looping animations
- parallax hero banners
- slide‑in from screen edges as primary transition
- pop‑in “delight” effects
- confetti/sparkles/celebrations

Timing:
- Meaningful transitions: **400–600ms**, expo/quintic easing (calm).
- Micro feedback (press/focus): **120–200ms**, still calm.

### 1.3 Progression Without Pressure
Progress exists but **never performs**.
- XP is **never** the primary signal; treat it as private experience.
- Badges are **readiness markers**, not trophies.
- Reputation is **trust memory**, not rank.
- No leaderboards, streaks, medals, trophies, “grind/win/optimize” language.

Visual expression:
- Growth shown through **states** (maturity/bloom phases), not % meters as hero.
- Completion is “The Breath” (subtle settle), not ✓ checkmarks or hype.

### 1.4 Data as Narrative (Context Before Numbers)
Rule: **Narrative precedes numbers.**
- Editorial/serif narrative block explains “why” and “what it means”.
- Mono/sans data follows as evidence.
- No standalone dashboards; any metrics must be contextual and calm.

### 1.5 Accent Governance (Orange is Sacred)
- Orange is used **only** for earned growth / completion / transition moments.
- Never use orange for errors/warnings.
- Keep orange surface area **< 8%** per screen.

---

## 2. Reference Principles (Extract, Don’t Copy)
These are principle references only. **Do not copy layouts or components.**
- Hyperliquid Foundation (hyperfoundation.org): transitions that connect to information; state changes made legible.
- Wealthsimple: calm financial clarity and trust.
- Linear: disciplined system UI and hierarchy.
- Headspace: ritual onboarding, emotional gentleness.
- Stripe Press: editorial readability, confidence through typography.

Implementation translation:
- Use motion to clarify state, not to decorate.
- Use whitespace and typography to create sanctuary.
- Make intelligence feel like a guided consultation, not analytics.

---

## 3. Icon Strategy (Current Decision)
### 3.1 Use Iconify + Phosphor (for now)
- Use **Iconify** with **Phosphor** line icons for fast integration.
- No filled icons.
- Centralize icons behind a wrapper component for later custom replacement.

### 3.2 Wrapper Requirement (Non‑negotiable)
Create:
- `apps/web/src/ui/icons/VlossomIcon.tsx`

Wrapper responsibilities:
- single place to set size, weight/stroke, color, and accessibility defaults
- guarantees consistent icon weight across app
- makes future swap to custom SVG set a drop‑in change

Example interface (adapt as needed):
```ts
type VlossomIconName =
  | "home" | "calendar" | "search" | "wallet" | "profile" | "notifications"
  | "intelligence" | "chevron" | "close" | "info" | "warning";

type VlossomIconProps = {
  name: VlossomIconName;
  size?: number;
  weight?: "thin" | "light" | "regular";
  className?: string;
  "aria-label"?: string;
};
```

Rules:
- Icon usage in UI must go through the wrapper (no direct Iconify calls in screens).
- Keep the mapping table in one file.

---

## 4. Implementation Scope (Phase 3 Vertical Slice)
Build **exactly** this first; do not expand scope until it’s coherent.

### 4.1 Screens (Mobile‑First + Desktop Deepening)
1) **Home** — Hero Moment: *The Settle*  
2) **Onboarding** — Hero Moment: *The Unfold*  
3) **Calendar** — month + day; ritual scheduling; calm empty states  
4) **Intelligence** — narrative + evidence; no dashboard vibe  
5) **Profile** — progression without pressure; trust memory

### 4.2 Hero Moments (Implementation Guidance)
Home: *The Settle*
- emblem/anchor appears, then UI boundaries “settle” into place (no edge slides)
- content fades in gently

Onboarding: *The Unfold*
- steps feel like turning botanical pages
- no percentage progress bars; no “You’re done!” hype

---

## 5. UX State Coverage (Hard Requirement)
Every screen must implement:
- Loading
- Empty
- Error (calm + actionable)
- Success/Settled (dignified; no hype)

Empty state tone: “quiet intent,” not “nothing here.”

---

## 6. Tokens, Theming, Typography
### 6.1 Tokens
Use:
- `design/tokens/vlossom-light.json`
- `design/tokens/vlossom-dark.json`

If a mapping layer is needed, create it explicitly (do not hardcode random hex values).

### 6.2 Typography Rules
- Serif/editorial for narrative guidance.
- Sans for UI.
- Mono for system labels/data evidence.
- Maintain clear separation: narrative first, evidence second.

---

## 7. Accessibility Minimum Bar
- Keyboard navigation works for key flows.
- Visible focus states.
- Icons have accessible labels where needed.
- Motion respects user preferences where possible (reduced motion support recommended).

---

## 8. Repo & File Boundaries (Strict)
- Output lives in `apps/web` only.
- Optional additions: `packages/ui` or `packages/config` only if strictly necessary.
- Do not modify `contracts/`, `services/`, `infra/`, or repo root config unless essential to run `apps/web`.

---

## 9. Deliverables Required From Claude
When completing a build pass, output:
1) Final file tree for `apps/web` (and any added packages)
2) Run instructions
3) Environment variables (if any)
4) “What I built” manifest
5) Integration notes (assumed endpoints/types, mocks)
6) Known gaps / TODOs (only if truly necessary)

---

## 10. Self‑Check Before Marking Complete (MANDATORY)
Confirm each item:

### A) Repo & Scope
- [ ] All output is contained in `apps/web` (and optional `packages/ui` or `packages/config` only if necessary)
- [ ] No edits to `contracts/`, `services/`, `infra/`, or repo root config unless essential
- [ ] TypeScript-only

### B) Tokens & Brand Assets
- [ ] UI uses tokens from `design/tokens/vlossom-light.json` and supports dark mode via `vlossom-dark.json` (or a clear mapping)
- [ ] No random untracked colors / ad-hoc theme drift

### C) Icon Strategy
- [ ] Only Iconify Phosphor line icons used (no filled icons)
- [ ] All icons go through `VlossomIcon` wrapper
- [ ] Icon weight/size consistency is enforced globally

### D) Progression Without Pressure
- [ ] XP is not a primary UI signal
- [ ] No trophies/streaks/leaderboards
- [ ] Copy avoids grind/hustle/win framing

### E) Accent Governance
- [ ] Orange used only for earned growth / completion / transition
- [ ] Orange not used for errors/warnings
- [ ] Orange surface area stays < 8% per screen

### F) UX State Coverage
- [ ] Loading/Empty/Error/Success implemented for each screen

### G) Motion
- [ ] No looping animations
- [ ] Motion is state-driven only (unfold/breathe/settle)
- [ ] Durations calm; micro feedback separated from transitions

---

## 11. Recommended Claude Run Pattern
### Pass A: Plan (no code)
- Propose file tree, routing, component inventory, icon map, motion plan, state coverage plan.

### Pass B: Implement (code)
- Implement the 5-screen slice.
- Keep mocks typed and replaceable.
- Keep icons behind wrapper.
- Return deliverables + self-check confirmation.

---

## 12. “If Unsure” Rule
If there is ambiguity between “make it beautiful” and “make it calm,” choose **calm**.
If there is ambiguity between “show more data” and “explain meaning,” choose **meaning**.
If there is ambiguity between “faster” and “more ritual,” choose **ritual**.
