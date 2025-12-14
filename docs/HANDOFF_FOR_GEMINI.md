# HANDOFF_FOR_GEMINI — Vlossom Protocol (Frontend Build)

## 0) Role
You are Gemini acting as: **Frontend product designer + implementer**.

Your job:
- Build the **best-looking** frontend web app that follows the **Vlossom brand** and **UX flow rules**
- Output code that can be dropped into this repo and run immediately
- Do not invent backends; mock where needed, but keep contracts clean

Claude will integrate/merge and connect to real services afterward.

---

## 1) Repo Context (Monorepo)
This is a monorepo. Key folders include:
- `apps/` (apps live here)
- `packages/` (shared packages/components)
- `services/` (backend services)
- `contracts/` (smart contracts)
- `docs/`, `standards/`, `spec-templates/`, `product-templates/`, `infra/`

✅ Your target is **ONLY**:
- `apps/web` (create if it doesn’t exist)
Optionally (if truly needed):
- `packages/ui` (shared UI components)
- `packages/config` (tailwind/theme tokens)

❌ Do NOT modify:
- `contracts/`
- `services/`
- `infra/`
- repo root config unless absolutely required for the web app to run

---

## 2) Output Requirements
### Deliverables
1) A complete frontend app at: `apps/web`
2) A component library strategy:
   - Either local components under `apps/web/src/components`
   - Or a shared package at `packages/ui` (only if needed)
3) A clean design system:
   - tokens: spacing, radius, typography scale, shadows, colors
4) UX-complete states:
   - Loading state
   - Empty state
   - Error state
   - Success state

### Code Quality
- TypeScript-first
- Accessible (keyboard nav, focus styles, semantic HTML, aria where needed)
- Mobile-first responsive
- No “demo-only” hacks that prevent later integration

---

## 3) Tech Assumptions (Choose sensible defaults)
If not specified elsewhere in repo:
- Next.js (App Router) OR Vite + React (choose one and justify in README)
- TailwindCSS for styling
- pnpm-compatible scripts (must work inside turbo monorepo)

Provide clear run commands for:
- install
- dev
- build
- lint (if included)

---

## 4) Product Goal (What this frontend must communicate)
Vlossom Protocol is not “just DeFi.” It’s **belief mechanics + dignity + growth**.
The UI should feel:
- **Calm**
- **Restful**
- **Dignified**
- **Growth-oriented**
Tone: confident, warm, minimal, premium.

Tagline that should appear somewhere in the experience:
> “Vlossom is where you blossom.”

---

## 5) IA / Pages (Minimum set to implement)
Build the following routes/pages:

### Public / Marketing
- `/` Home
- `/protocol` What it is / how it works (simple explainer)
- `/docs` Documentation hub (can be static placeholder + sections)
- `/app` Entry point to the actual dApp shell
- `/brand` (optional) brand / tone / visual rules page for internal reference

### App Shell (dApp UI)
Under `/app` include:
- Dashboard overview
- Primary action screen (create / participate / stake / etc.) — keep flexible, don’t hardcode domain logic
- Activity feed (events list; can be mocked)
- Profile / wallet area (mock wallet state if no integration yet)
- Settings

If the protocol concept isn’t fully defined yet, implement these as structured placeholders with strong UX and clear copy.

---

## 6) UX Flow Rules
Every core interaction must include:
- A clear primary CTA
- Step-by-step progression (if multi-step)
- Validation errors that explain how to fix the issue
- A graceful “not connected” state
- “No data yet” empty states that encourage the next action

### Microcopy style
- Short
- Human
- No tech jargon unless necessary
- Use dignity language (no shaming, no harsh error tone)

Examples:
- Error: “Something didn’t land. Try again.”
- Empty: “No activity yet. Your first signal starts here.”
- Loading: “Preparing your space…”

---

## 7) Visual System (Design Principles)
### Layout
- Big whitespace
- Strong typographic hierarchy
- Grid-based sections
- Premium feel (subtle shadows, rounded corners, soft borders)

### Motion (Optional)
- Subtle transitions only (no chaotic motion)
- If using Framer Motion, keep it light

### Components to include
- Button system (primary/secondary/ghost/destructive)
- Input fields + validation states
- Cards
- Tabs
- Toast notifications
- Modal/dialog
- Empty state component
- Skeleton loader component
- Navigation (desktop + mobile)

---

## 8) Data / API Strategy (Do not overreach)
You may mock data with:
- local JSON fixtures
- a simple `mockApi.ts` module

But structure it so Claude can later swap to real services:
- Put types/interfaces in a `types/` folder
- Centralize API calls in `lib/api/`

For errors, use a consistent error shape:
- `code`
- `message`
- `details?`

---

## 9) Final Output Format (MANDATORY)
When you finish, output:

### A) File Tree
Show the full file tree for `apps/web` (and any `packages/*` you created).

### B) Setup
