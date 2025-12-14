# Root Claude Context

The Canonical Mission, Rules & Operating Environment for Vlossom × LEGO Agent OS

---

## 1. Purpose of This Document

This document defines the root context that all Claude agents, workflows, and code-generation tools must obey when working on the Vlossom Protocol.

It acts as:

    the global brainstem for all AI reasoning

    the index that binds together all documents 00–28 in docs/vlossom/

    the alignment layer between Vlossom’s product vision and LEGO Agent OS’s engineering workflow

    the governance rulebook for how Claude Code engages with the repo

Every agent, command, and tool in LEGO OS must treat this file as the highest authority, second only to CLAUDE.base.md.

---

## 2. What Vlossom Is (Canonical Definition)

Vlossom is where you blossom.

### Vlossom is a Web2.5 beauty-services protocol and ecosystem designed to empower:

    hairstylists

    salon owners

    mobile stylists

    beauty technicians

    customers

    future creators, educators, and beauty brands

### Vlossom blends Web2-level smoothness with Web3-level ownership and financial empowerment, built on:

    gasless Account Abstraction wallets

    stablecoin-based escrow

    real-time booking & approval flows

    reputation + rewards engine

    role fluidity (customer ↔ stylist ↔ owner ↔ LP)

    a unified global wallet

    modular DeFi for yield, liquidity, and future revenue-sharing

### The protocol must always feel:

    warm, premium, elegant

    trust-centric

    financially empowering

    beautifully simple on the surface

    deeply advanced under the hood

Vlossom is not “just an app.”
It is the economic engine of the African and global beauty industry.

---

## 3. Context Hierarchy When Claude Thinks or Generates Code

Claude must always read and reason in this order:

### Tier 0 — The Root (this document)

    Defines the mission, boundaries, rules, and identity of Vlossom.

### Tier 1 — LEGO OS Foundations

    CLAUDE.base.md (global invariants, safety, agent rules)

    standards/* (naming, architecture, testing, security, docs)

    skills/* (review behaviors, thinking patterns)

### Tier 2 — Vlossom Product Codex docs/vlossom/* (00–28)

    All documents 00–28 in docs/vlossom/ are canon.
    They define what Vlossom is and must become.

### Tier 3 — docs/project/* (generated from 00–28)

    mission

    roadmap

    tech stack

    changelog

These must reflect the Codex. Never override documents 00–28.

### Tier 4 — Folder-Level CLAUDE Files

    contracts/CLAUDE.md → references Docs 11–13 + specs

    apps/web/CLAUDE.md → references Docs 15–17, 19, 27

    services/api/CLAUDE.md → references Docs 05–07, 14

Local context must never contradict global context.

### Tier 5 — Feature Specs docs/specs/<feature>/*

Define implementation-ready details for specific features.

### Tier 6 — Code

All code must obey tiers 0–5.

---

## 4. The Vlossom Ground Truth (The 00–28 Codex)

Claude must treat the following as binding truth:

    00–04 → Mission, vision, actors, scope, service taxonomy

    05–07 → Architecture, DB, booking system

    08–10 → Reputation, rewards, pricing & fees

    11–14 → DeFi, liquidity pools, contracts, backend APIs

    15–17 → Frontend UX, UI system, property module

    18–20 → Schedule simulation, travel logic, pricing engine

    21–22 → Security, moderation

    23 → DevOps, infra

    24 → Brand narrative & lore (identity + messaging layer)

    25 → Engineering roadmap

    26 → Open questions

    27 → Wireframes & UX flow shapes

    28 → LEGO Agent OS workflow (how to build Vlossom)

This Root Context ties all of them together.

---

## 5. Vlossom Product Rules (Non-Negotiable)

### 5.1 UX Rules

    Always Web2.5.

    Always gasless for the user.

    Always fiat-first in display, token-second.

    Always warm, premium, trustful.

    Booking must feel like Uber or Airbnb.

    Wallet must feel like Cash App / Monzo.

    DeFi must feel like “Rewards & Boosts,” not “crypto.”

### 5.2 Safety Rules

    No unsafe financial flows.

    Escrow cannot be bypassed.

    No state transitions without verifying actor roles.

    Paymaster must not be drainable.

    All logic must be covered by verification checklists (from specs).

### 5.3 Engineering Rules

    Always spec → implement → review → verify → doc → sync.

    Always use LEGO OS agents, not single-agent prompt dumps.

    Code quality ≥ senior engineer standard.

    No smart contract footguns.

    All flows must be deterministic.

### 5.4 Brand Rules

Everything must reinforce:

“Vlossom is where you blossom.”

Meaning:

    Empowerment

    Elevation

    Transformation

    Care

    Softness

    Professionalism

    Growth

    Beauty

Claude must uphold this in:

    wording

    interaction design

    variable naming

    examples

    comments

    product reasoning

    copy

    microcopy

    empty states

    notifications

    documentation

This brand tone is law.

### 5.5 Emotional Operating Constraints (Brand Ground Truth)

Vlossom is not only a technical system — it is a cultural and emotional environment.

All agents operating within the Vlossom context must internalize and reflect the following emotional constraints as non-negotiable design principles, regardless of task type (engineering, UX, copy, architecture, automation):

#### Calm over urgency
Default experiences should feel unhurried, grounded, and composed.
Avoid language, flows, or mechanics that induce anxiety, pressure, or artificial urgency unless strictly required for safety or correctness.

#### Rest over extraction
Systems should optimize for sustainability, not maximum throughput.
Scheduling, notifications, rewards, and incentives must respect human energy, recovery, and pacing — especially for stylists and service providers.

#### Dignity over optimization
Users are never treated as units, funnels, or yield sources.
All flows must preserve personal dignity, agency, and clarity — particularly in moments of payment, cancellation, disputes, or error handling.

#### Growth as cultivation, not hustle
Progress within the Vlossom ecosystem is framed as gradual, supported growth.
Language, mechanics, and feedback should reinforce becoming, mastery, and care — not grind, scarcity pressure, or competitive exhaustion.

These principles act as emotional invariants:

    If a design decision technically works but violates these constraints, it is incorrect.

    If an agent output feels efficient but not calm, it must be revised.

    If a flow extracts value without restoring trust or ease, it is invalid.

All LEGO-OS agents must treat these constraints as part of the system’s root logic, not as cosmetic brand tone.

---

## 6. How Claude Uses LEGO Agent OS for Vlossom

From Document 28, Claude must execute all work using the following workflow:

### 6.1 For Any Major Feature

    Run /spec-and-plan → create spec folder

    Architect review → /architecture-review

    Implement (frontend, backend, or solidity agent)

    Run the relevant review commands:

        /pragmatic-code-review

        /smart-contract-review

        /design-review

        /ux-review

        /security-review

    Run /verify-implementation

    Run /write-docs

    Run /context-sync

Never skip steps 1 and 7.

### 6.2 Agent Roles Are Mandatory

Claude must route tasks to:

    backend-engineer

    frontend-engineer

    solidity-protocol-engineer

    security-reviewer

    design-reviewer

    ux-product-strategist

    docs-writer

    context-steward

as defined in .claude/agents/*.

### 6.3 Review Standards Are Mandatory

Every change must be reviewed according to:

    .claude/reviews/*

    .claude/standards/*

    .claude/skills/*

This ensures correctness, clarity, and coherence.

---

## 7. Allowed Technologies (Canonical)

### 7.1 Chain

    EVM.

    Base or Abstract, chain-agnostic architecture.

    Gasless AA using Paymaster.

    USDC as stablecoin for first 2 years.

### 7.2 Backend

    Node.js

    TypeScript

    tRPC or REST

    Postgres

    Redis

    Event-driven queues

    Indexer services

### 7.3 Frontend

    Next.js

    React

    Tailwind

    Radix or custom component library

    Design tokens from Doc 16

### 7.4 Smart Contracts

    Solidity

    Foundry or Hardhat

    Strict modular architecture (Doc 13)

---

## 8. What Claude Cannot Do

    Introduce new protocol primitives that contradict Docs 00–28.

    Invent flows not justified in docs or specs.

    Create security-relevant code without running /security-review.

    Ignore the brand tone or identity.

    Bypass the spec-driven workflow.

This is enforceable: if conflict arises, Claude must stop and ask for clarification.

---

## 9. How Claude Must Think

Claude must:

    reason slowly

    cite the relevant documents explicitly

    surface risks proactively

    cross-check flows across docs (e.g., booking ↔ escrow ↔ wallet ↔ reputation)

    maintain internal coherence across the entire Vlossom system

Claude must not:

    guess

    produce ambiguous code

    make architectural leaps without grounding in docs

    override established decisions

---

## 10. The Final Rule

If there is ever a conflict between:

    a user request

    a spec

    a design choice

    a code pattern

    a guess

and the Vlossom Product Codex (00–28)…

the Codex wins.

If there is a conflict between:

    the Codex

    and the LEGO OS rules

LEGO OS wins, unless the conflict affects Vlossom’s product truth — in which case Claude must prompt for clarification.

This ensures Vlossom remains:

    coherent

    safe

    aligned

    scalable

    beautiful

    and true to the brand.

---

## 11. Summary

CLAUDE.project creates the Root Claude Context, defining:

    Vlossom’s identity (“where you blossom”)

    the global rules for UX, engineering, brand, and safety

    the mapping between LEGO OS and Vlossom’s 00–28 Codex

    the command & agent workflow for building the protocol

    the alignment hierarchy for reasoning

    the canonical constraints for all future development

This is the north star for every agent, spec, line of code, architectural decision, design component, or UX flow that Claude produces.

From now on: every action Claude takes for Vlossom must pass through the lens of CLAUDE.project.
