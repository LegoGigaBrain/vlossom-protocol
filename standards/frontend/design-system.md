# Frontend Design System Standards

Even in code-only contexts, we follow **design system thinking** for consistency.

## 1. Tokens

- Define and reuse design tokens:
  - colours
  - spacing
  - typography scale
  - border radius
  - shadows.

Example (conceptual):

- Spacing: `4, 8, 12, 16, 24, 32`
- Radius: `4, 8, 16`
- Font sizes: `sm, base, lg, xl, 2xl`

## 2. Components as building blocks

- Build and reuse primitives:
  - `Button`, `Input`, `Card`, `Modal`, `Tooltip`, `Badge`.
- Avoid one-off bespoke buttons/inputs when a shared one exists.

## 3. Layout principles

- Use a consistent grid / spacing system.
- Keep layout responsive:
  - mobile-first
  - avoid horizontal scroll when possible.

## 4. States

All interactive elements should define:

- default state
- hover / focus
- active / pressed
- disabled / loading.

## 5. Copy & microcopy

- Keep labels and CTAs:
  - short
  - action-oriented
  - unambiguous.
- Error messages should explain:
  - what went wrong
  - what the user can do next.

## 6. Theming & brand

- Centralize brand colours and typography.
- Do not hard-code colours and fonts across the codebase; use tokens or variables.

## 7. Documentation

- When adding new shared components:
  - document props and intended usage.
  - add examples (Storybook or MDX if available).

The design system is a **shared language** between product, design, and engineering. Honour it.
# Frontend Design System Standards

Even in code-only contexts, we follow **design system thinking** for consistency.

## 1. Tokens

- Define and reuse design tokens:
  - colours
  - spacing
  - typography scale
  - border radius
  - shadows.

Example (conceptual):

- Spacing: `4, 8, 12, 16, 24, 32`
- Radius: `4, 8, 16`
- Font sizes: `sm, base, lg, xl, 2xl`

## 2. Components as building blocks

- Build and reuse primitives:
  - `Button`, `Input`, `Card`, `Modal`, `Tooltip`, `Badge`.
- Avoid one-off bespoke buttons/inputs when a shared one exists.

## 3. Layout principles

- Use a consistent grid / spacing system.
- Keep layout responsive:
  - mobile-first
  - avoid horizontal scroll when possible.

## 4. States

All interactive elements should define:

- default state
- hover / focus
- active / pressed
- disabled / loading.

## 5. Copy & microcopy

- Keep labels and CTAs:
  - short
  - action-oriented
  - unambiguous.
- Error messages should explain:
  - what went wrong
  - what the user can do next.

## 6. Theming & brand

- Centralize brand colours and typography.
- Do not hard-code colours and fonts across the codebase; use tokens or variables.

## 7. Documentation

- When adding new shared components:
  - document props and intended usage.
  - add examples (Storybook or MDX if available).

The design system is a **shared language** between product, design, and engineering. Honour it.
