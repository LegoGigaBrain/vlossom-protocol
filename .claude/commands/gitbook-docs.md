# gitbook-docs

You are running the **GitBook Docs** workflow in LEGO Agent OS.

Goal:
Design and generate GitBook-ready documentation:
- page content in Markdown
- a proposed navigation / hierarchy (SUMMARY-style)

Primary Agent:
- @docs-writer

Supporting Agents:
- @senior-architect (for architecture sections)
- @ux-product-strategist (for product and UX narrative)
- @backend-engineer / @solidity-protocol-engineer (for API/contract references)

Skills:
- Documentation Style
- GitBook Documentation
- Reviewer Voice (for polishing / critique)

---

## Steps

### 1. Clarify Scope

Ask user:
- What is this GitBook space for? (e.g., “Vlossom Protocol Developer Docs”)
- Who is it primarily for? (developers, integrators, stylists, property owners, investors)
- What must it include? (quickstart, concepts, API, FAQ, etc.)

---

### 2. Propose GitBook Structure

Define a navigation tree, for example:

- Introduction
  - What is Vlossom?
  - Core Concepts
- Getting Started
  - Quickstart
  - Environments & URLs
- For Stylists
  - Onboarding
  - Managing Bookings
- For Property Owners
  - Onboarding
  - Chair Rentals
- For Developers
  - API Overview
  - Authentication
  - Webhooks
- Smart Contracts (if applicable)
  - Contract Addresses
  - Key Functions & Events
- DeFi & Liquidity
  - Liquidity Pool Concept
  - Risks & Safeguards
- FAQ
- Glossary

Output this as a structured list that can map to GitBook sidebar pages.

---

### 3. Select a Page (or Set of Pages)

For each page to generate:

- Confirm:
  - title
  - purpose
  - audience
- Decide:
  - if it’s concept, how-to, reference, or mixed.

---

### 4. Generate GitBook-Optimized Content

For each page:

- Start with:
  - `# Title`
  - 1–2 sentence summary
  - Optional “On this page” outline (for longer docs)
- Use headings, short paragraphs, lists, and code blocks.
- Link to other relevant GitBook pages (“See also”).
- Follow:
  - `standards/docs/docs-style.md`
  - `skill-gitbook-docs` guidance.

---

### 5. Review & Polish

- Ensure terminology matches the product.
- Check for:
  - internal consistency
  - missing key topics
  - obvious confusion points.

Optionally:
- Suggest next pages to write.

---

### 6. Output

Provide:

1. **Navigation Structure**:
   - a bullet list representing GitBook sidebar / SUMMARY.md

2. **Page Content**:
   - Markdown for each requested page

3. **Notes for Implementation**:
   - filenames
   - where in navigation they should appear
   - any cross-linking suggestions
