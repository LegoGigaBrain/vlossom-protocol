# 28 — Agentic Workflow Guide for Claude Code

How Vlossom Uses LEGO Agent OS as Its AI Engineering Org

---

## 1. Purpose of This Document

This document defines how Vlossom is built and maintained using LEGO Agent OS inside Claude Code:

    How the LEGO OS layers (Standards → Product → Specs) map onto our 00–29 Vlossom docs.

    How agents, commands, and skills are used to implement and evolve Vlossom (protocol, backend, frontend, UX, docs).

    How engineers (you + AI) should actually work day-to-day: from idea → spec → code → review → deploy → docs.

This file is the bridge between:

    The Vlossom Product Codex (docs 00–29), and

    The LEGO Agent OS that turns Claude Code into a senior engineering team.

When you open Vlossom in Claude Code, this is the “how to drive the car” manual.

---

## 2. Core Principles

We keep the same design philosophy as the rest of the Vlossom docs:

### Spec-driven, not prompt-chaos

Every meaningful change should be backed by:

    a spec in docs/specs/... and/or

    an entry in 00–29.

### Layered context, never overloaded

LEGO OS enforces a reading order for agents:

    CLAUDE.base.md (OS rules)

    CLAUDE.project.md (Vlossom intent)

    docs/project/{mission, roadmap, tech-stack, changelog}.md

    Folder-level CLAUDE.md

    Relevant standards (standards/*)

    Feature specs (docs/specs/<feature>/*)

    Code

### Agents behave like senior specialists

    No “junior AI dev” energy.

    Each agent has a clear mission and standards it must obey.

### Commands orchestrate complex work

We don’t manually micromanage each agent; we run:

    /spec-and-plan, /smart-contract-review, /pragmatic-code-review, /design-review, /write-docs, /context-sync, etc.

### Docs are part of the product, not an afterthought

LEGO’s docs workflow (/write-docs, /gitbook-docs) is used to maintain 00–29 and any future guides.

---

## 3. How LEGO OS Maps to Vlossom Docs (00–29)

LEGO OS has 3 layers: Standards → Product → Specs.

For Vlossom, that becomes:

### 3.1 Layer 1 — Standards (HOW We Build)

Source (LEGO OS):

    standards/global/* – naming, code style, testing principles

    standards/backend/* – APIs, data modelling

    standards/frontend/* – React, design system, accessibility

    standards/security/* – secure coding, threat models

    standards/docs/* – documentation & context file standards

    .claude/skills/* – review voice, design principles, audit checklists, etc.

Vlossom-specific expectation:

    All code & docs created for Vlossom must obey these standards by default.

    If Vlossom has a specific override (e.g., design tokens in Doc 16, special DeFi constraints in Docs 11–12), that override is documented in:

    CLAUDE.project.md

    folder-level CLAUDE.md (e.g., contracts/CLAUDE.md, apps/web/CLAUDE.md)

    or the relevant doc (e.g., Doc 11).

### 3.2 Layer 2 — Product (WHAT Vlossom Is)

Source (LEGO OS core):

    docs/project/mission.md

    docs/project/roadmap.md

    docs/project/tech-stack.md

    docs/project/changelog.md (generated via /product-plan and /context-sync).

Vlossom mapping:

    00–04 feed the mission & roadmap:

        00 — Raw Brief

        01 — Product Vision

        02 — Platform Actors

        03 — Product Scope

        04 — Services & Categories

    05–14 input the tech-stack & architecture sections:

        System, DB, booking, reputation, rewards, pricing, DeFi, pools, contracts, backend, frontend.

    15–22 refine UX, risk, admin, DevOps.

    24–26 add brand, future vision, open questions.

How to keep in sync

    When any of 00–29 change materially, run /product-plan or /context-sync to keep:

        docs/project/mission.md aligned with Docs 00–03 + 24.

        docs/project/roadmap.md aligned with Doc 25.

        docs/project/tech-stack.md aligned with Docs 05, 11–14, 23.

        docs/project/changelog.md updated with shipped milestones.

### 3.3 Layer 3 — Specs (WHAT We Build Next)

Source (LEGO OS):

    spec-templates/feature-spec.template.md

    spec-templates/tasks-breakdown.template.md

    spec-templates/verification-checklist.template.md

    Generated via /spec-and-plan.

Vlossom mapping:

    For each major feature inferred from docs 07–22 (e.g. “Global Wallet”, “Booking Escrow”, “LP DeFi Tab”, “Property Module”, “Stylist Schedule Engine”), we create:

        docs/specs/<feature-slug>/

        feature-spec.md

        tasks-breakdown.md

    verification-checklist.md

These specs reference the relevant foundational docs (07–22) but express a ship-able, implementation-ready version.

---

## 4. Project Structure & Context Files for Vlossom

We embed LEGO OS into the Vlossom repo using the standard folder layout:

vlossom-project/
  .claude/
    agents/
    skills/
    commands/
    standards/
    reviews/
  docs/
    vlossom/
      00 — Raw Brief
      01 — Product Vision
      02 — Platform Actors
      03 — Product Scope
      04 — Services & Categories
      ...  
    project/
      mission.md
      roadmap.md
      tech-stack.md
      changelog.md
    vlossom-specs/   (optional alias for docs/specs)
    lego-os/
      (the LEGO OS handbook)
    specs/
      global-wallet/
      booking-escrow/
      property-owner-module/
      stylist-schedule-engine/
      ...
  contracts/
    CLAUDE.md
    (Solidity contracts)
  apps/web/
    CLAUDE.md
    (Next.js frontend)
  services/api/
    CLAUDE.md
    (backend)
  CLAUDE.base.md
  CLAUDE.project.md

### 4.1 CLAUDE.base.md

Contains LEGO OS global rules, unchanged across projects. Agents read this first.

### 4.2 CLAUDE.project.md (Vlossom)

Contains:

    Short Vlossom mission (“Vlossom is where you blossom.” and what that means for product & UX).

    Links to 00–29 as the Product Codex.

Links to:

    docs/project/mission.md

    docs/project/roadmap.md

    docs/project/tech-stack.md

This is the entry point that tells LEGO OS: “You are now working on Vlossom; here’s the canon.”

### 4.3 Folder-Level CLAUDE Files

Examples:

    contracts/CLAUDE.md

        Explains our smart contract architecture (Doc 13) + gasless AA assumptions.

        Points to relevant specs (e.g., docs/specs/booking-escrow/*).

    apps/web/CLAUDE.md

        Summarizes Frontend UX (Doc 15), UI system (Doc 16), wireframes (Doc 27).

        Clarifies tech stack (Next.js, Tailwind, etc.).

    services/api/CLAUDE.md

        Summarizes backend architecture & APIs (Doc 14).

        These keep local context tight and readable.

---

## 5. Agents Used for Vlossom

We mostly rely on LEGO OS core agents:

    backend-engineer — APIs, booking orchestration, wallet services.

    frontend-engineer — Vlossom app UI (Home/Bookings/Wallet/Profile/Notifications).

    senior-architect — aligns code with Docs 05, 11–14, 23.

    solidity-protocol-engineer — booking, escrow, liquidity, AA wallet contracts.

    security-reviewer — threat models, gasless flows, escrow, P2P, LP.

    design-reviewer — checks UI against Doc 16 + brand direction.

    ux-product-strategist — ensures flows match Docs 15, 17–19, 24.

    docs-writer — maintains docs 00–29 & specs.

    context-steward — keeps CLAUDE files and project docs updated.

Doc 28’s job is to define how they collaborate for Vlossom-specific tasks.

---

## 6. Commands & Workflows for Vlossom

Here’s how we actually use LEGO OS commands inside the Vlossom repo.

### 6.1 Setup & Alignment

When you first load the Vlossom repo in Claude Code:

    Ensure .claude/, docs/, and CLAUDE files are present.

    Run /context-sync to:

        Check for missing CLAUDE files.

        Check that docs/vlossom-product/* reflect the latest 00–29 decisions.

If needed, run /product-plan to generate/update:

    docs/project/mission.md (from Docs 00–04 + 24)

    docs/project/roadmap.md (from Doc 25)

    docs/project/tech-stack.md (from Docs 05, 11–14, 23)

    docs/project/changelog.md

### 6.2 Feature Lifecycle Workflow

For any new feature or major change, follow this pattern:

#### Step 1 — Spec & Plan

    Run /spec-and-plan:

        Input:

            Which feature we’re focusing on (e.g., “Global Wallet Hub P2P QR Flow”).

            Pointers to relevant docs (e.g., 10, 11, 13, 15).

    Output:

        docs/specs/global-wallet/feature-spec.md

        docs/specs/global-wallet/tasks-breakdown.md

        docs/specs/global-wallet/verification-checklist.md

This ties LEGO OS’s spec layer to Vlossom’s product codex.

#### Step 2 — Architecture Review (if needed)

If the feature impacts architecture:

    Run /architecture-review with:

        Relevant sections of Docs 05, 11–14, 23.

        The new feature spec.

    Agents involved:

        senior-architect

        backend-engineer

        security-reviewer

        docs-writer

Goal: ensure the design respects existing boundaries and scaling assumptions.

#### Step 3 — Implementation

Depending on feature domain:

    Smart contracts → contracts/

        Work with solidity-protocol-engineer.

        Use specs + Doc 13 as reference.

    Backend → services/api/

        Work with backend-engineer.

        Use Docs 05, 06, 07, 14.

    Frontend → apps/web/

        Work with frontend-engineer.

        Use Docs 15, 16, 17, 19, 27.

You can ask Claude directly in “coding mode”, but always ground it in the spec folder + relevant CLAUDE.md.

#### Step 4 — Reviews

Use LEGO OS review commands:

    /smart-contract-review for any contract changes tied to Docs 11–13.

    /pragmatic-code-review for backend/frontend logic.

    /design-review + /ux-review for flows that touch Docs 15, 17–19, 24.

    /security-review for anything touching auth, payments, escrow, P2P, DeFi.

These commands activate the right mix of agents (solidity-protocol-engineer, security-reviewer, design-reviewer, etc.) automatically.

#### Step 5 — Verification Against Spec

    Run /verify-implementation (from LEGO OS manual) with:

        docs/specs/<feature>/verification-checklist.md

    Goal:

        Check the implemented code + tests match the spec.

#### Step 6 — Documentation

Use /write-docs and /gitbook-docs to:

    Update relevant Vlossom docs (e.g., 15, 17, 21) if behaviour changed.

    Generate or update implementation notes inside docs/specs/<feature>/.

    Keep docs/project/changelog.md in sync.

#### Step 7 — Context Sync

    Run /context-sync again so:

        CLAUDE files reference new specs / components

        Mission/roadmap/tech-stack/changelog are coherent

---

## 7. Using LEGO OS for Specific Vlossom Domains

### 7.1 Smart Contracts (Docs 11–13)

For any protocol work:

    Load:

        contracts/CLAUDE.md

        Docs 11, 12, 13

        Relevant spec folder (e.g., docs/specs/booking-escrow/*).

    Use:

        /spec-review (if spec feels shaky).

        /smart-contract-review for audits with:

            solidity-protocol-engineer

        security-reviewer

        (optionally) DeFi risk engineer if you add that agent later.

    After implementation:

        /verify-implementation + /security-review for gasless & escrow invariants.

### 7.2 Backend & APIs (Doc 14)

For booking orchestration, AA wallet services, on/off-ramp adapters, etc.:

    Primary agent: backend-engineer.

    Support: senior-architect, security-reviewer.

    Commands:

        /architecture-review for new services or boundaries.

        /pragmatic-code-review for PR-level checks.

Always align with:

    Docs 05–07, 10, 14, 20, 21, 23.

### 7.3 Frontend, UX & Design System (Docs 15–17, 19, 24, 27)

For implementing flows like:

    Global Wallet Hub

    Notifications tab

    Property owner dashboards

    Stylist schedule UX

Use:

    Agents:

        frontend-engineer

        design-reviewer

        ux-product-strategist

    Commands:

        /design-review

        /ux-review

        /pragmatic-code-review (for code)

Reference:

    Doc 15 — Frontend UX Flows

    Doc 16 — UI Components & Design System

    Doc 17 — Property Module

    Doc 19 — Travel & Cross-Border Bookings

    Doc 24 — Brand Narrative & Lore

    Doc 27 — UX Flows & Wireframes

### 7.4 Documentation & Knowledge (Docs 00–29)

Use:

    docs-writer + context-steward

    /write-docs + /gitbook-docs + /context-sync

Goal:

    Keep the 00–29 canon always in sync with actual implementation.

    Keep GitBook / public docs aligned with these internal docs when you’re ready.

---

## 8. Day-to-Day Working Pattern (For You & Claude)

When you sit down to work on Vlossom in Claude Code, the loop should feel like:

Explore

    Skim CLAUDE.project.md, relevant CLAUDE.md, and the feature spec.

    Ask agents to summarise for you if needed.

Plan

    Run /spec-and-plan or /spec-review to tighten the feature shape.

Execute

    Implement in small, coherent increments.

    Use agents (backend/solidity/frontend) as pair-programmers.

Review

    Use /pragmatic-code-review, /smart-contract-review, /design-review, /ux-review, /security-review as appropriate.

Verify

    Run /verify-implementation against the feature’s verification checklist.

Document

    Update docs with /write-docs.

    If this impacts public docs, use /gitbook-docs to scaffold GitBook pages later.

Sync

    Run /context-sync periodically to keep CLAUDE files and project docs fresh.

This loop keeps Vlossom coherent, safe, and brand-aligned as it grows.

---

## 9. Summary

Document 28 establishes that:

    LEGO Agent OS is the default operating system for building Vlossom.

    Docs 00–29 are the Product Codex, feeding into LEGO’s project & spec layers.

    Agents (backend, frontend, architect, solidity, security, UX, docs, context) collaborate through commands like /spec-and-plan, /smart-contract-review, /design-review, /write-docs, /context-sync.

    Every feature follows a spec → implement → review → verify → document → sync pipeline.

    From here, Document 29 — Root Claude Context — will pin all of this into a single, compact file that tells Claude:

        “You are now inside Vlossom Protocol, powered by LEGO Agent OS. Here’s who we are, what we’re building, and how you must work.”





















































































