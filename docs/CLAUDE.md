# Documentation Folder

> Purpose: Central documentation hub for Vlossom Protocol - the canonical source of truth for all project knowledge.

## Canonical References
- [Doc 00: Mission Statement](./vlossom/00-mission-statement.md)
- [Doc 24: Brand Voice](./vlossom/24-brand-voice-and-ux-copy.md)

## Directory Structure

### `docs/project/` - Core Product Docs
| File | Purpose |
|------|---------|
| `mission.md` | Product mission and vision |
| `roadmap.md` | Version roadmap and milestones |
| `tech-stack.md` | Technology architecture overview |
| `changelog.md` | Version history and release notes |

### `docs/vlossom/` - The Vlossom Codex (00-28)
The 29 canonical documents forming the "ground truth" for Vlossom:

| Range | Topic | Documents |
|-------|-------|-----------|
| 00-04 | Foundation | Mission, Vision, Actors, Scope, Services |
| 05-07 | Core System | Architecture, Database, Booking Flow |
| 08-10 | Trust & Value | Reputation, Rewards, Pricing |
| 11-14 | DeFi & Tech | Liquidity, Staking, Contracts, APIs |
| 15-17 | Frontend | UX Flows, UI System, Property Module |
| 18-20 | Operations | Scheduling, Travel, Pricing Engine |
| 21-23 | Platform | Security, Admin Panel, DevOps |
| 24-28 | Brand & UX | Voice, Roadmap, Questions, Wireframes, Workflow |

### `docs/specs/` - Feature Specifications
Organized by version/milestone:
- `v0.5/` - Initial features
- `v1.0/` - Core wallet, booking, stylist features
- `v1.5/` - Property owner, reputation system
- `milestone-4/`, `milestone-5/` - Production readiness

**Spec Templates** (in `spec-templates/`):
- `feature-spec.template.md` - Feature specification
- `tasks-breakdown.template.md` - Implementation tasks
- `verification-checklist.template.md` - Testing checklist

### `docs/security/` - Security Documentation
- Rate limiting configuration
- Security audit findings
- Threat models

### `docs/operations/` - Operational Runbooks
- Launch checklist
- Incident response
- Rollback procedures

## How to Use This Documentation

### For New Features
1. Check relevant Codex docs (00-28) for context
2. Create spec in `docs/specs/<feature>/` using templates
3. Reference Codex docs in folder-level CLAUDE.md files

### For Understanding the System
1. Start with `docs/project/mission.md` for the "why"
2. Read `docs/vlossom/05-system-architecture-blueprint.md` for the "how"
3. Check `docs/project/roadmap.md` for current status

### For Implementation
1. Find the relevant Codex doc for your feature area
2. Check existing specs in `docs/specs/`
3. Reference `docs/project/tech-stack.md` for technology decisions

## Maintenance

### Keeping Docs Current
- Update `changelog.md` with each version release
- Update `roadmap.md` when milestones change
- Create `IMPLEMENTATION_COMPLETE.md` markers when features ship

### Context Sync
Run `/context-sync` to audit documentation coverage and identify gaps.

## Local Conventions
- Codex docs (00-28) are the source of truth - code should match docs
- Feature specs follow template structure
- CLAUDE.md files reference relevant Codex docs
- Changelog follows Keep a Changelog format
