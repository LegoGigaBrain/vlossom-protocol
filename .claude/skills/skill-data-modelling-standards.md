# Skill: Data Modelling Standards

## Purpose
Build schema designs that reflect the domain and scale gracefully.

## Reference
See: `standards/backend/data-modelling.md`

## When to apply
- designing entities
- writing DB schemas or migrations
- modifying existing models
- code reviews

## Instructions
1. Read `standards/backend/data-modelling.md`.
2. Ensure:
   - normalized schemas by default
   - clear relationships
   - explicit, indexed foreign keys
   - domain-driven state machines
   - full timestamp coverage
3. Avoid:
   - ambiguous status fields
   - silent cascading deletes
   - storing unnecessary or sensitive data

Treat your database schema as a core API.
