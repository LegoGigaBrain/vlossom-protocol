# Vlossom Protocol Documentation

Welcome to the Vlossom Protocol documentation. This guide will help you navigate our comprehensive documentation structure.

## 📚 Documentation Structure

### 🎯 Project Documentation (`/docs/project/`)

Core project documents that define Vlossom's mission, roadmap, and technical foundation:

- **[Mission](./project/mission.md)** - What we're building and why
- **[Roadmap](./project/roadmap.md)** - V0.5 → V1.0 → V2.0 development timeline
- **[Tech Stack](./project/tech-stack.md)** - Technologies, frameworks, and tools
- **[Changelog](./project/changelog.md)** - Version history and milestones

### 📋 Feature Specifications (`/docs/specs/`)

Detailed specifications for all features following the 3-file pattern:
- `feature-spec.md` - Requirements, user stories, acceptance criteria
- `tasks-breakdown.md` - Implementation tasks by area (backend, frontend, contracts, testing)
- `verification-checklist.md` - Test coverage, security checks, UX validation

**Current Specs**:
- **[Booking Flow V1](./specs/booking-flow-v1/)** (V0.5 ✅ Complete)
- **[AA Wallet](./specs/aa-wallet/)** (V0.5 ✅ Complete)
- **[Authentication](./specs/auth/)** (V1.0 🔄 In Progress - F1.2)
- **[Wallet Features](./specs/wallet/)** (V1.0 📝 Planned - F1.3, F1.4, F1.5)

📊 **[Spec Status Tracker](./specs/STATUS.md)** - Track implementation progress across all features

### 📖 Product Documentation (`/docs/vlossom/`)

29 comprehensive documents covering the entire Vlossom ecosystem:

#### Product & Vision
- [00 - App Raw Brief](./vlossom/00-vlossom-app-raw-brief.md)
- [01 - Product Vision & Market](./vlossom/01-product-vision-and-market.md)
- [02 - Platform Actors & Feature Map](./vlossom/02-platform-actors-and-feature-map.md)
- [03 - Product Scope Overview](./vlossom/03-product-scope-overview.md)
- [04 - Services & Categories](./vlossom/04-services-and-categories.md)

#### System Architecture
- [05 - System Architecture Blueprint](./vlossom/05-system-architecture-blueprint.md)
- [06 - Database Schema](./vlossom/06-database-schema.md)
- [13 - Smart Contract Architecture](./vlossom/13-smart-contract-architecture.md)
- [14 - Backend Architecture & APIs](./vlossom/14-backend-architecture-and-apis.md)
- [23 - DevOps & Infrastructure](./vlossom/23-devops-and-infrastructure.md)

#### Booking & Scheduling
- [07 - Booking & Approval Flow](./vlossom/07-booking-and-approval-flow.md)
- [18 - Stylist Schedule Simulation](./vlossom/18-stylist-schedule-simulation.md)
- [19 - Travel & Cross-Border Bookings](./vlossom/19-travel-and-cross-border-bookings.md)
- [20 - Pricing & Soft Ranges Engine](./vlossom/20-pricing-and-soft-ranges-engine.md)

#### Reputation & Rewards
- [08 - Reputation System Flow](./vlossom/08-reputation-system-flow.md)
- [09 - Rewards & Incentives Engine](./vlossom/09-rewards-and-incentives-engine.md)

#### DeFi & Liquidity
- [10 - Pricing & Fees Model](./vlossom/10-pricing-and-fees-model.md)
- [11 - DeFi & Liquidity Architecture](./vlossom/11-defi-and-liquidity-architecture.md)
- [12 - Liquidity Pool Architecture](./vlossom/12-liquidity-pool-architecture.md)

#### Frontend & UX
- [15 - Frontend UX Flows](./vlossom/15-frontend-ux-flows.md)
- [16 - UI Components & Design System](./vlossom/16-ui-components-and-design-system.md)
- [24 - Brand Narrative & Lore](./vlossom/24-brand-narrative-and-lore.md)
- [27 - UX Flows & Wireframes](./vlossom/27-ux-flows-and-wireframes.md)

#### Property Owners (V1.5+)
- [17 - Property Owner & Chair Rental Module](./vlossom/17-property-owner-and-chair-rental-module.md)

#### Admin & Moderation (V1.5+)
- [22 - Admin Panel & Moderation](./vlossom/22-admin-panel-and-moderation.md)

#### Security & Risk
- [21 - Security & Risk Register](./vlossom/21-security-and-risk-register.md)

#### Planning & Workflow
- [25 - Engineering Roadmap & Sprints](./vlossom/25-engineering-roadmap-and-sprints.md)
- [26 - Open Questions & Future Expansion](./vlossom/26-open-questions-and-future-expansion.md)
- [28 - Agentic Workflow Guide for Claude](./vlossom/28-agentic-workflow-guide-for-claude.md)

### 🎨 UX Documentation (`/docs/ux/`)

- **[Microcopy Library](./ux/microcopy-library.md)** - Brand-aligned UI copy, error messages, empty states
- **Brand Voice Guidelines**: See [Doc 24 - Brand Narrative](./vlossom/24-brand-narrative-and-lore.md)

### 🛠️ LEGO Agent OS (`/docs/lego-agent-os/`)

Agent-driven development workflow documentation:
- [Overview](./lego-agent-os/lego-os/overview.md)
- [Agents](./lego-agent-os/lego-os/agents.md)
- [Commands](./lego-agent-os/lego-os/commands.md)
- [Context Files](./lego-agent-os/lego-os/context-files.md)
- [Docs Workflow](./lego-agent-os/lego-os/docs-workflow.md)
- [Folder Structure](./lego-agent-os/lego-os/folder-structure.md)
- [Review Framework](./lego-agent-os/lego-os/review-framework.md)

### ⚙️ Setup Guides (`/docs/setup/`)

- **[PostgreSQL Setup](./setup/POSTGRESQL_SETUP.md)** - Database installation and configuration

---

## 🚀 Quick Start for Contributors

### 1. Understand the Product
Start with:
1. [Mission](./project/mission.md) - What we're building
2. [Roadmap](./project/roadmap.md) - Where we're going (currently at V0.5 → V1.0)
3. [Doc 01 - Product Vision](./vlossom/01-product-vision-and-market.md) - Full product context

### 2. Explore the Architecture
1. [Tech Stack](./project/tech-stack.md) - Technologies we use
2. [Doc 05 - System Architecture](./vlossom/05-system-architecture-blueprint.md) - High-level design
3. [Doc 06 - Database Schema](./vlossom/06-database-schema.md) - Data models

### 3. Pick a Feature to Implement
1. Check [Spec Status Tracker](./specs/STATUS.md) for available features
2. Read the feature spec (3-file set: feature-spec, tasks-breakdown, verification-checklist)
3. Follow the [Agentic Workflow Guide](./vlossom/28-agentic-workflow-guide-for-claude.md)

### 4. Follow Brand Guidelines
- [Doc 24 - Brand Narrative](./vlossom/24-brand-narrative-and-lore.md) - Core principle: "Growth from a place of rest, not pressure"
- [Doc 16 - UI Components](./vlossom/16-ui-components-and-design-system.md) - Design tokens and component specs
- [Microcopy Library](./ux/microcopy-library.md) - Brand-aligned UI copy

---

## 📂 Context Files (LEGO OS)

The repository uses layered context files for AI-assisted development:

- **Global**: `CLAUDE.base.md`, `CLAUDE.project.md`
- **Folder-level**: Each module has a `CLAUDE.md` (apps/web, services/api, contracts, etc.)
- **Templates**: `product-templates/` and `spec-templates/` for consistent documentation

---

## 🔄 Documentation Updates

- **Roadmap**: Updated after each milestone (V0.5 complete Dec 2025, V1.0 in progress)
- **Changelog**: Updated at version releases
- **Specs**: Created before implementation, marked complete with `IMPLEMENTATION_COMPLETE.md`
- **Product Docs**: Updated as product evolves (major changes only)

---

## 🤝 Contributing to Documentation

When adding new features:
1. Run `/spec-and-plan <feature-description>` to generate specs
2. Update [Spec Status Tracker](./specs/STATUS.md)
3. Add entry to [Changelog](./project/changelog.md) when complete
4. Update [Roadmap](./project/roadmap.md) for major milestones

---

## 📞 Need Help?

- **Product Questions**: See [Open Questions](./vlossom/26-open-questions-and-future-expansion.md)
- **Technical Questions**: Check [Tech Stack](./project/tech-stack.md) or relevant architecture doc
- **Workflow Questions**: See [Agentic Workflow Guide](./vlossom/28-agentic-workflow-guide-for-claude.md)

---

**Last Updated**: December 14, 2025
**Current Version**: V0.5 (Demo-able) → V1.0 (Launchable) in progress
