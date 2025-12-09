# S-Tier Product & Dashboard Design Principles

These principles guide all product and dashboard UI in LEGO OS projects.
Think “Stripe / Linear / Airbnb” level craft, adapted to our own brands.

---

## I. Core Design Philosophy & Strategy

- [ ] **Users First**  
      Every design decision prioritizes real user needs, workflows, and clarity.

- [ ] **Meticulous Craft**  
      Aim for precision, polish, and high quality in layout, typography, spacing, and micro-interactions.

- [ ] **Speed & Performance**  
      Design for fast load times and snappy, responsive interactions. Avoid heavy, bloated UI that slows the experience.

- [ ] **Simplicity & Clarity**  
      Remove noise. Use clear hierarchy, minimal clutter, and strong visual grouping. Every screen should answer:  
      “What is this for?” and “What should I do next?”

- [ ] **Focus & Efficiency**  
      Help users complete key tasks with minimal friction. Reduce unnecessary steps, extra clicks, and cognitive load.

- [ ] **Consistency**  
      Use a uniform design language (colors, typography, components, patterns) across the product.

- [ ] **Accessibility (WCAG AA+)**  
      Design for inclusivity:
      - sufficient color contrast  
      - keyboard navigability  
      - sensible focus states  
      - screen reader compatibility for key flows.

- [ ] **Opinionated Design & Defaults**  
      Provide strong, thoughtful defaults and recommended paths. Reduce decision fatigue with sensible pre-configured options.

---

## II. Design System Foundation (Tokens & Core Components)

- [ ] **Color System**
  - [ ] Primary brand color used sparingly and meaningfully.
  - [ ] Neutral gray scale (at least 5–7 steps) for text, backgrounds, and borders.
  - [ ] Semantic colors for:
        - Success
        - Warning
        - Error / Destructive
        - Informational
  - [ ] Dark mode or high-contrast themes considered when relevant.
  - [ ] All color combos meet WCAG AA contrast guidelines.

- [ ] **Typographic Scale**
  - [ ] Single primary font family chosen for legibility and character.
  - [ ] Clear hierarchy:
        - H1 / H2 / H3
        - Subtitle / Label
        - Body (default) / Body Small
  - [ ] Line height and spacing tuned for readability, especially for dense data.

- [ ] **Spacing & Layout Grid**
  - [ ] A simple spacing scale (e.g., 4 / 8 / 12 / 16 / 24 / 32).
  - [ ] Consistent padding and margin patterns across cards, modals, sections.
  - [ ] Grid or layout system for aligning content; avoid random, ad-hoc spacing.

- [ ] **Core Components**
  - [ ] Buttons (primary, secondary, tertiary, destructive).
  - [ ] Inputs, textareas, dropdowns, toggles.
  - [ ] Cards, lists, tables, tags/badges, chips.
  - [ ] Navigation (top bar, side nav, breadcrumbs where needed).
  - [ ] Modals / drawers / toasts for feedback.

---

## III. Layout & Information Architecture

- [ ] **Clear Page Purpose**
  - Each screen has a primary purpose and a clear focal point.
  - The layout visually answers: “What’s most important here?”

- [ ] **Hierarchy & Scannability**
  - Important content appears above the fold when possible.
  - Use typography, spacing, and color to guide the eye.

- [ ] **Grouping & Sections**
  - Group related controls and information together.
  - Avoid mixing unrelated actions in the same visual cluster.

- [ ] **Navigation & Wayfinding**
  - Users always know:
    - where they are,
    - how to go back,
    - and where to go next.
  - Use breadcrumbs, section headers, or subtle markers where helpful.

---

## IV. States: Loading, Empty, Error, Success

- [ ] **Loading States**
  - Provide skeletons, spinners, or shimmer states.
  - Avoid layout shift that confuses users.

- [ ] **Empty States**
  - Explain what the user is seeing.
  - Offer clear next steps (e.g., “Create your first booking”, “Connect a wallet”).

- [ ] **Error States**
  - Use friendly, specific language.
  - Provide clear recovery options (“Retry”, “Go back”, “Contact support”).
  - Avoid exposing raw technical errors to end users.

- [ ] **Success & Confirmation**
  - Confirm important actions clearly.
  - For destructive actions, require confirm/undo where reasonable.

---

## V. Components & Interaction Design

- [ ] **Buttons & CTAs**
  - Primary action stands out; secondary actions are visually softer.
  - Avoid multiple competing primary buttons in the same area.

- [ ] **Forms**
  - Logical grouping of fields.
  - Inline validation and clear error messages tied to specific fields.
  - Reasonable defaults and pre-filled values where possible.

- [ ] **Tables & Data Display**
  - Columns prioritized by importance.
  - Reasonable density for readability.
  - Sorting, filtering, and search where necessary.
  - Clear empty/zero-state messaging.

- [ ] **Feedback & Micro-interactions**
  - Hover, focus, active states are consistent and clear.
  - Feedback for long-running actions (e.g., saving, processing).
  - Use motion sparingly to reinforce meaning, not to distract.

---

## VI. Responsive & Adaptive Design

- [ ] **Mobile-First Thinking**
  - Critical workflows are usable on smaller screens.
  - Layout adapts gracefully to narrow viewports.

- [ ] **Breakpoints & Behavior**
  - Define breakpoints based on content, not just device sizes.
  - Hide or collapse non-essential content on small screens, but keep core tasks accessible.

---

## VII. Copy & UX Writing

- [ ] **Concise & Clear Language**
  - Use simple, direct wording.
  - Avoid jargon unless it’s domain-specific and your users expect it.

- [ ] **Actionable Labels**
  - Buttons and links describe what will happen (“Create booking”, “Save changes”).

- [ ] **Error Messages**
  - Explain what went wrong and how to fix it.
  - Avoid blame; emphasize recovery.

- [ ] **Tone & Voice**
  - Match the brand personality (professional, friendly, confident).
  - Be respectful and inclusive.

---

## VIII. Accessibility & Inclusivity (WCAG AA+)

- [ ] **Contrast & Color Use**
  - All critical text and UI states meet WCAG AA contrast.

- [ ] **Keyboard Navigation**
  - Key flows are keyboard-accessible.
  - Focus states are visible and meaningful.

- [ ] **Screen Readers**
  - Landmarks, headings, and interactive elements have appropriate labels.

- [ ] **Motion Sensitivity**
  - Avoid excessive animation.
  - Provide reduced motion options if motion is significant.

---

## IX. Opinionated Defaults & Guardrails

- [ ] **Strong Defaults**
  - Provide sensible default values, layouts, filters, and views.
  - Avoid blank slates when a user first arrives.

- [ ] **Guardrails**
  - Make it hard to do dangerous things accidentally (e.g., destructive actions).
  - Design flows that nudge users toward best practices.

---

Use this checklist when **designing new flows, reviewing screens, or building UI components**.  
If a design decision conflicts with these principles, call it out explicitly and justify the trade-off.
