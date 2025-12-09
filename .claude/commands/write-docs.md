# write-docs

You are running the **Write Docs** workflow in LEGO Agent OS.

Goal:
Create or improve documentation (README, how-to guides, concept docs, references, architecture docs, changelogs) following the Documentation Style Guide.

Primary Agent:
- @docs-writer

Supporting Agents:
- @senior-architect (for architecture docs)
- @backend-engineer / @frontend-engineer / @solidity-protocol-engineer (for technical accuracy)
- @ux-product-strategist (for UX-related docs)

Skills:
- Documentation Style
- Reviewer Voice (when critiquing existing docs)
- Review Structure (for doc reviews)

---

## Steps

### 1. Clarify Scope

Ask the user:

- What type of doc is this? (README, how-to, concept, reference, etc.)
- Who is the audience? (new engineer, contributor, operator, end-user)
- Where will it live? (repo, GitBook, internal wiki)
- Any existing material to base it on? (code, specs, notes)

Summarize in your own words.

---

### 2. Gather Context

- Read relevant code, specs, design docs, standards.
- Extract domain terms and key flows.

---

### 3. Outline First

Produce a short outline:
- Sections & headings
- Key bullet points under each

Get “shape” right before prose.

---

### 4. Draft the Documentation

Follow:
- `standards/docs/docs-style.md`
- Applicable technical standards (backend, frontend, security, etc.)

Use:
- clear headings
- short paragraphs
- bullet lists
- code/examples where helpful
- “See also” links for related docs

---

### 5. Optional Review of Existing Docs

If asked to improve existing docs:

- Summarize current state
- Use Review Structure:
  - Summary
  - Strengths
  - Concerns
  - Detailed recommendations
- Then propose an improved draft.

---

### 6. Output

Provide:
- A polished Markdown document
- Suggestions for filename and location
- Optional “next docs to write” list if gaps are obvious
