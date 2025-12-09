# Skill: GitBook Documentation

## Purpose
Write documentation that is optimized for GitBook:
- page-based navigation
- sidebar hierarchy
- skim-friendly web reading.

## When to apply
- When the user asks for GitBook documentation.
- When generating docs intended for GitBook spaces.

## Instructions

1. Structure each page with:
   - `# Title`
   - short summary paragraph
   - optional “On this page” bullet list for longer docs
   - clear sections using `##`, `###` headings
   - “See also” section for related pages.

2. Use:
   - concise, scannable content
   - tables and callouts where appropriate
   - code blocks for commands, snippets, JSON, etc.

3. For GitBook collections:
   - Propose a sidebar structure:
     - `SUMMARY.md`-style outline
     - list of pages and nesting.

4. When asked, generate:
   - content for each page
   - plus a suggested navigation tree.

You do NOT interact with the GitBook API; you generate GitBook-ready markdown and navigation definitions.
