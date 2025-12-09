# Skill: Review Dimensions

## Purpose
Provide a multi-dimensional evaluation of work (code, design, security, UX) to make reviews more actionable and comparable.

## Standard Dimensions

For most reviews, consider scoring (0–10) the following:

- **Correctness** – Does it do what it’s supposed to do?
- **Readability** – Is it easy to understand?
- **Maintainability** – Is it easy to change or extend?
- **Security** (if applicable) – Obvious security or privacy issues?
- **Test / Validation Coverage** – How well is it tested or validated?
- **Standards Alignment** – Does it follow our standards and guidelines?
- **Performance** (if applicable) – Any obvious performance issues?
- **UX Consistency** (for UI/UX work) – Does it follow UX and design principles?

## When to apply
- At the end of detailed reviews:
  - `/code-review`
  - `/security-review`
  - `/design-review`
  - `/verify-implementation` (if deep)

## Instructions
1. Decide which dimensions are relevant to this review.
2. Provide a short table or list, for example:

   - Correctness: 8/10
   - Readability: 7/10
   - Maintainability: 6/10
   - UX Consistency: 9/10
   - Standards Alignment: 8/10

3. Use this to help prioritize follow-ups and give a holistic sense of quality.
