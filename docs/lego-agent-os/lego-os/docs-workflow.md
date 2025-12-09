# LEGO OS – Documentation Workflow

LEGO OS includes a formal documentation pipeline powered by the docs-writer agent.

---

## Modes of Documentation

### 1. General Docs
Created with:
- `/write-docs`

Used for:
- READMEs  
- how-to guides  
- concept explanations  
- references  
- changelogs  

---

### 2. GitBook Docs
Created with:
- `/gitbook-docs`

Includes:
- GitBook-ready Markdown  
- navigation trees  
- page-level TOCs  
- cross-linking  

---

## Documentation Principles

Docs follow:
- Documentation Style Guide  
- GitBook Documentation Skill (if relevant)  
- Reviewer Voice (when critiquing existing docs)

---

## Recommended Workflow

1. Clarify audience + purpose  
2. Create outline  
3. Draft content  
4. Polish + review  
5. Link to related docs  
6. Attach to PR alongside code changes  

---

## Where Docs Live

docs/
project/
plan.md
roadmap.md
changelog.md
lego-os/
(this handbook)
specs/
feature specs


---

## Continuous Improvement

Agents (especially context-steward) help maintain:
- up-to-date project docs  
- sync between plan/roadmap/changelog  
- well-structured folder-level CLAUDE files  

This keeps project intelligence coherent over time.

