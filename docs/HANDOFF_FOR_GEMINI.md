# HANDOFF_FOR_GEMINI — Vlossom Protocol (Frontend Build)

 

## 0) Role

 

You are Gemini acting as: **Frontend Product Designer + Implementer**.

 

Your job:

- Build the **best-looking** frontend web app that follows the **Vlossom brand** and **UX flow rules**

- Express the **Symbolic UI Language** — every visual element must correspond to a system state

- Output code that can be dropped into this repo and run immediately

- Do not invent backends; mock where needed, but keep contracts clean

 

Claude will integrate/merge and connect to real services afterward.

 

---

 

## 1) Repo Context (Monorepo)

 

This is a monorepo. Key folders include:

- `apps/` (apps live here)

- `packages/` (shared packages/components)

- `services/` (backend services — already implemented)

- `contracts/` (smart contracts)

- `docs/`, `standards/`, `spec-templates/`, `product-templates/`, `infra/`

- `design/` (brand assets, tokens, icons)

 

**Your target is ONLY:**

- `apps/web` (create if it doesn't exist)

 

Optionally (if truly needed):

- `packages/ui` (shared UI components)

- `packages/config` (tailwind/theme tokens)

 

**Do NOT modify:**

- `contracts/`

- `services/`

- `infra/`

- repo root config unless absolutely required for the web app to run

 

---

 

## 2) Brand Assets Location

 

**Use these assets — do not recreate them:**

 

```

/design

  /tokens

    vlossom-light.json          # Light mode brand theme (USE THIS)

    vlossom-dark.json           # Dark mode brand theme (USE THIS)

  /brand

    /logos                      # Brand logos and lockups (USE THESE)

    /identity                   # Brand identity sheets

  /icons                        # System icons (USE THIS STYLE)

```

 

**Color tokens are already defined.** Import from `design/tokens/vlossom-light.json`:

- Primary: `#311E6B` (deep purple)

- Primary Soft: `#ADA5C4` (muted purple)

- Secondary: `#EFE3D0` (cream)

- Accent: `#FF510D` (orange) — **USE SPARINGLY, SEE RULES BELOW**

- Tertiary: `#A9D326` (green)

- Black: `#161616`

- White: `#FFFFFF`

 

---

 

## 3) The Vlossom Symbolic UI Language (CRITICAL)

 

**This is not just styling. This is a meaning system.**

 

### 3.1 The Flower as Living Symbol

 

The Vlossom flower is not a logo — it's a **carrier of meaning**.

 

**Flower Iconography Tiers:**

 

| Tier | Name | Usage | Visual Weight |

|------|------|-------|---------------|

| **1** | Core Mark | Nav icons, favicons, status indicators, app chrome | Minimal line, single stroke |

| **2** | Narrative Flower | Landing pages, onboarding, "you are growing" states, campaigns | Layered lines, illustrated detail |

| **3** | Botanical Fragments | Micro-icons, progress indicators, dividers, badges | Petals, stems, center dots as isolated elements |

 

**The flower icon in `/design/brand/logos` is the source. Derive all variations from this linework style.**

 

### 3.2 Symbolic Meaning System

 

Every visual element must map to user state, system state, or ritual state:

 

| Symbol | Meaning | Usage |

|--------|---------|-------|

| **Petals** | Stages of growth | Profile progress, learning milestones, hair health stages |

| **Stem** | Support system | Platform connection, training progress, stylist relationship |

| **Center** | Community / Core health | Social presence, hair health score, "heart" of the system |

| **Closed flower** | Rest state | Recovery periods, pause states, calm moments |

| **Open flower** | Active growth | Completed rituals, achievements, active sessions |

 

### 3.3 Accent Color Governance (Orange #FF510D)

 

**Orange is sacred. It must be earned.**

 

**Orange appears ONLY when:**

- Growth is acknowledged

- A ritual is completed

- A transition is happening

- A celebration moment occurs

 

**NEVER use orange for:**

- Errors (use muted red)

- Warnings (use amber/yellow)

- System stress states

- Generic CTAs

 

**Max surface area per screen:** 5–8%

 

This keeps orange emotionally powerful, not decorative.

 

---

 

## 4) Product Goal

 

Vlossom Protocol is not "just DeFi" or "just a booking app."

 

It is: **A belief-driven care orchestration system.**

 

The UI should feel:

- **Calm** — rest is a feature, not absence

- **Restful** — space to breathe

- **Dignified** — professional, never casual

- **Growth-oriented** — progress feels natural, not pressured

 

**Brand philosophy:** "Growth from rest, not pressure."

 

**Tagline that should appear somewhere:**

> "Vlossom is where you blossom."

 

---

 

## 5) Navigation Architecture (5-Tab Mobile-First)

 

| Tab | Purpose | Primary Surface |

|-----|---------|-----------------|

| **Home** | Discovery + booking | Full-screen map with overlays |

| **Search** | Intentional exploration | Feed + search bar |

| **Wallet** (center) | Financial hub | Balance, DeFi, rewards |

| **Notifications** | Awareness + action | Inbox style |

| **Profile** | Identity + dashboards | Role-based tabs |

 

### Profile Tab Structure

 

**Header (always visible):**

- Avatar, @username, bio

- Followers / Following

- Verification badges

- Connected socials

 

**Role Tabs (dynamic):**

```

| Overview | Stylist* | Salon* |

```

- Overview → always present (schedule, hair health, bookings)

- Stylist → appears if user is a stylist (business dashboard)

- Salon → appears if user owns a salon (property dashboard)

 

---

 

## 6) Pages to Implement

 

### Public / Marketing

- `/` Home (hero + value prop)

- `/protocol` How it works

- `/docs` Documentation hub

- `/app` Entry to dApp

 

### App Shell (dApp)

- `/app` Dashboard overview

- `/app/home` Map-first discovery

- `/app/search` Feed + search

- `/app/wallet` Financial hub

- `/app/notifications` Inbox

- `/app/profile` Identity + role dashboards

- `/app/profile/hair-health` Hair health intelligence

- `/app/schedule` Calendar (rhythm strip + month garden)

- `/app/booking/[id]` Booking detail + session progress

 

---

 

## 7) Key UX Components (From Doc 15 + 16)

 

### Calendar System (Signature Brand Moment)

 

**Three expressions that expand/contract:**

 

| View | Purpose | Feel |

|------|---------|------|

| **Rhythm Strip** | Daily carousel, mobile-first | Glanceable, calm |

| **Month Garden** | Full month, pattern visibility | Organic, not rigid |

| **Day Flow** | Single day timeline + ritual steps | Detailed, professional |

 

**Calendar must feel unmistakably Vlossom:**

- Soft day capsules (never sharp boxes)

- Care load colors (calm → dense)

- Rest indicators visible

- Motion that unfolds, breathes, settles

 

### Map Component (Home Tab)

 

**Pins:**

- Stylists: color-coded by mode (fixed/mobile-salon/mobile-home)

- Salons: icon shape by tier (budget/mid/premium)

 

**Booking happens via overlay — never leave the map.**

 

### Hair Health Surfaces

 

**Hair Health Snapshot:**

- Hair type badge

- Porosity indicator

- Moisture status (with gentle prompts)

- Current routine phase

 

**Must feel like a wellness companion, not a dashboard.**

 

---

 

## 8) UX State Requirements

 

**Every screen must include:**

- Loading state (skeleton, calm)

- Empty state (encouraging, not sad)

- Error state (friendly, actionable)

- Success state (celebratory but dignified)

 

**Copy tone:**

- Short, human, no jargon

- Dignity language (no shaming)

- Growth framing (not performance)

 

**Examples:**

- Error: "Something didn't land. Try again."

- Empty: "No activity yet. Your first signal starts here."

- Loading: "Preparing your space…"

- Success: "You're growing beautifully."

 

---

 

## 9) Typography System

 

**Two voices, strict separation:**

 

| Voice | Usage | Feel |

|-------|-------|------|

| **UI Sans** (Inter) | Navigation, labels, inputs, system text | Friendly, calm, legible |

| **Editorial** (Playfair Display) | Landing pages, onboarding, philosophy moments | Soulful, garden-like |

 

**Rules:**

- Never use editorial font in dense UI

- Line height always > 1.4 for body

- No all-caps for primary actions

- Numbers use tabular numerals

 

---

 

## 10) Motion Philosophy

 

**Motion should reassure, not excite.**

 

| Principle | Rule |

|-----------|------|

| **State-driven** | Motion only on state change |

| **No loops** | No looping animations |

| **Slow duration** | Slightly slower than default UI kits |

| **Gentle easing** | Never snappy, always gentle |

| **Earned, not constant** | Animation is a reward, not wallpaper |

 

**Transition language:**

- Unfold (not snap)

- Breathe (not bounce)

- Settle (not slam)

 

---

 

## 11) What Vlossom is NOT

 

Do NOT build:

- Trader dashboard (no charts, no TVL displays)

- Gamified DeFi (no leaderboards, no point counters)

- Cyberpunk aesthetic (no neon, no dark hacker vibes)

- Generic booking app (no Calendly clone)

- Hyper-stimulating UI (no dopamine hooks)

 

---

 

## 12) Aesthetic Reference Pack

 

**Extract principles, not pixels. Brand values override reference cues.**

 

| Reference | Borrow | Avoid | Apply To |

|-----------|--------|-------|----------|

| **Hyper Foundation** | Editorial typography, whitespace, calm hierarchy | Literal layout cloning | Protocol pages, docs |

| **Wealthsimple** | Calm financial UI, soft CTA hierarchy | Playful illustrations | Dashboard, wallet |

| **Linear** | Disciplined layout, subtle motion | Productivity metaphors | App shell, nav, lists |

| **Headspace** | Ritual framing, progress-as-growth | Cartoonish visuals | Onboarding, education |

| **Stripe Press** | Editorial layout, long-form readability | Dense UI grids | Docs, explainers |

 

---

 

## 13) Output Requirements

 

### Deliverables

1. Complete frontend at: `apps/web`

2. Component library using Doc 16 atomic/molecule/organism taxonomy

3. Design tokens imported from `design/tokens/*.json`

4. UX-complete states for every screen

 

### Code Quality

- TypeScript-first

- Accessible (keyboard nav, focus styles, semantic HTML)

- Mobile-first responsive

- No "demo-only" hacks

 

---

 

## 14) Final Output Format (MANDATORY)

 

### A) File Tree

Show full file tree for `apps/web` (and any `packages/*` created).

 

### B) Setup Instructions

- Install commands

- Env vars required

- Dev/build commands

 

### C) "What I Built" Manifest

- Pages built

- Components included

- States covered

- Symbolic elements used

 

### D) Integration Notes for Claude

- Where mock data lives

- What endpoints/types are assumed

- Where wallet integration should wire

- Which Doc 15 flows each screen implements

 

### E) Iconography Report

- Which flower tier used where

- How symbolic meaning system was applied

- Accent color usage audit

 

---

 

## 15) Key Documents to Reference

 

Before building, read these in order:

 

1. `docs/vlossom/24-brand-narrative-and-lore.md` — Brand philosophy

2. `docs/vlossom/15-frontend-ux-flows.md` — UX flows and states

3. `docs/vlossom/16-ui-components-and-design-system.md` — Component specs

4. `docs/vlossom/27-ux-flows-and-wireframes.md` — Wireframes

5. `docs/STYLE_BLUEPRINT.md` — Visual system rules

6. `design/tokens/vlossom-light.json` — Color/spacing tokens

 

---

 

## 16) The Single Most Important Rule

 

> **Every visual element must correspond to a system state, user state, or ritual state. Decorative visuals without semantic meaning are not allowed.**

 

This is what makes Vlossom feel alive, not decorated.

 

---

 

*This handoff document was prepared for the Claude × Gemini workflow.*

*Claude remains the architectural enforcer. Gemini builds the visual experience.*