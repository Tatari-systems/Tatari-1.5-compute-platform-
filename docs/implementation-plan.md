# Tatari 1.5 / Compute Platform — Implementation Plan

## Summary

We are building the frontend (+ light backend glue) for a GPU-as-a-Service marketplace console. Users pick a GPU, choose a region, launch a job or Jupyter notebook. The platform aggregates supply from providers (RunPod, Vast.ai, colo). The same app runs under partner brands — full white-label: theming, custom domain (CNAME), and partner self-serve admin.

Answered questions:

- **White-label scope:** Full. Theming (logo + colors) + CNAME + domain verification + partner admin pages. All in scope.
- **Design references:** RunPod (console UX, container launch), Lambda Labs (clean, trustworthy feel). Crusoe for pricing story ("cheap energy → cheap compute"). Vast.ai for separating cheap/risky vs reliable tiers visually.
- **Pricing grid data:** Build on mock data with the real schema (same fields, format, WS behavior). Swap to real live stock before Phase 2 closes. Building on mock data first is expected and fine.

## Design direction

Study these products, in order of priority:

| Product | What to take from it |
| --- | --- |
| RunPod | Console UX: dashboard, GPU launch, job status. Container-based "Pods" model. Self-serve flow. |
| Lambda Labs | Clean, simple, trustworthy look. Flat pricing, no-BS feel. Good for serious customers. |
| Crusoe | Pricing narrative: "cheap energy = cheap compute." Published price list (not "contact sales"). Energy source as a selling point. Closest business-model comparable. |
| Vast.ai | How to visually separate cheap/risky vs reliable/guaranteed tiers. Marketplace feel. |
| CoreWeave | Enterprise look. Mostly a contrast — we want self-serve, not "talk to sales." |
| Nebius | "Serious infra" aesthetic. Less relevant for our self-serve UX. |

Our angle vs Crusoe: Same model (cheap power → cheaper GPUs), but we aggregate across providers rather than owning the DCs. The console should explain that clearly — price advantage from power economics, not from cutting reliability.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + CSS custom properties for tenant tokens |
| Components | shadcn/ui (Radix primitives) |
| State (server) | React Server Components, Server Actions |
| State (client) | React Query (async / cache), Zustand (local UI) |
| Forms | React Hook Form + Zod |
| Auth | NextAuth (or Auth.js) — provider TBD |
| Real-time | WebSocket client (mock feed first, live feed before Phase 2 close) |
| Testing | Vitest (unit), Playwright (e2e) |
| CI | GitHub Actions |

## Work streams

Three parallel streams so multiple engineers move without blocking each other. They share the design system and types.

### Stream A — Design System & Marketing (frontend-heavy)

Owner: Dev A (strong on UI/CSS, component craft)

| Phase | Deliverable | Depends on |
| --- | --- | --- |
| 0 | Tailwind config, CSS variables for tenant tokens, color scales, typography | — |
| 0 | shadcn/ui install + theme overrides | — |
| 1 | Core components: Button, Input, Card, Dialog, Badge, Table, Tabs, Toast | — |
| 1 | Two layouts: MarketingLayout (RSC) + ConsoleLayout (with sidebar) | — |
| 1 | getTenant() (server) + TenantProvider / useTenant() (client) | — |
| 1 | Storybook with default brand + one mock partner theme | — |
| 2 | Marketing pages: Home, Pricing, GPU Catalog, Become a Provider, About | Design system |
| 2 | Pricing story section: cheap energy → cheaper GPUs (reference Crusoe's approach) | Design system |
| 2 | Lead capture forms → POST /api/leads | API types |
| 4 | Marketing CWV audit, image optimization, meta/OG tags | Pages live |

### Stream B — Console & Job Management (full-stack)

Owner: Dev B (comfortable with API integration, state machines, real-time)

| Phase | Deliverable | Depends on |
| --- | --- | --- |
| 1 | Auth shell (sign up / sign in / protected routes) | Layout from A |
| 2 | GPU catalog table — shared component with marketing, "live" vs "indicative" badge | Design system |
| 2 | Region picker, GPU selector, filters (VRAM, price, availability) | API types |
| 2 | Mock WebSocket feed (same shape as future live feed) wired to GPU table | API types |
| 3 | Launch flow: select GPU → configure → launch (state machine: submit → provision → running → done / failed) | Auth, catalog |
| 3 | Job dashboard: list, status, duration, cost | Launch flow |
| 3 | Job detail: logs (streaming), stop/restart, cost breakdown | Jobs |
| 3 | One-click Jupyter / vLLM launch (wraps launch flow with presets) | Launch flow |
| 3 | Account settings, API keys, usage/billing summary | Auth |

### Stream C — White-Label & Platform (infra / config)

Owner: Dagim (eng lead — or split with a dev)

| Phase | Deliverable | Depends on |
| --- | --- | --- |
| 0 | Repo setup: ESLint, Prettier, Husky, CI pipeline, branch rules | — |
| 0 | API type definitions (Zod schemas) for catalog, jobs, auth, leads, tenant | — |
| 0 | Mock API server (MSW or Next.js route handlers with static data) | Types |
| 1 | Tenant config system: tenants/[slug]/config.ts → logo, colors, domain, feature flags | — |
| 1 | Middleware: resolve tenant from hostname → inject into request | Tenant config |
| 2 | Provider API integration layer (RunPod, Vast.ai adapters behind a common interface) | API types |
| 3 | CNAME / custom domain support + domain verification flow | Middleware |
| 3 | Partner admin pages: upload logo, pick colors, add/verify domain | Tenant system |
| 4 | Playwright e2e: quote flow, launch flow, theme switch, CNAME, mobile | All streams |

## Phase plan

### Phase 0 — Foundation

**Goal:** Everyone can run the app, see a themed shell, and import shared types.

- Scaffold Next.js app (App Router, TypeScript, Tailwind, shadcn/ui)
- Repo tooling: lint, format, CI, PR template
- CSS variable system for tenant theming
- API type definitions (Zod schemas for GPU catalog, job, user, tenant)
- Mock API routes returning typed fixtures
- Mock WebSocket server (same message shape as future live feed)
- Two empty layouts wired to tenant tokens
- README with setup instructions

**Exit criteria:** `pnpm dev` shows a themed shell. Mock WS sends GPU data. Types importable. CI green.

### Phase 1 — Design system + auth + tenant

**Goal:** Component library exists, auth works, tenant switching works.

- Core shadcn/ui components themed to Tatari defaults
- Storybook (or `/dev` pages) showing components in two themes
- Auth flow (sign up, sign in, session, protected routes)
- `getTenant()` server / `useTenant()` client wired from root layout
- Console sidebar + navigation skeleton
- Tenant config: logo, colors, domain, feature flags per partner

**Exit criteria:** Can sign in, see console skeleton, switch tenant theme via config.

### Phase 2 — Marketing + GPU catalog + mock-live grid

**Goal:** Public site is shippable. GPU table works on mock WS data with the real schema.

- Marketing pages: home, pricing, GPU catalog, become a provider
- Pricing story: section explaining cheap energy → cheaper GPUs (study Crusoe)
- GPU catalog table with filters (VRAM, type, region, price)
- Table wired to mock WebSocket feed — same fields and update behavior as future live
- "Live" vs "indicative" badge visible on pricing
- Reliability tiers clearly separated (study Vast.ai's approach)
- Lead/quote forms → server route
- Responsive: desktop + mobile layouts
- Provider adapter layer (common interface over RunPod, Vast.ai APIs)

**Exit criteria:** Visitor can browse GPUs, filter, submit a quote. Grid updates via WS (mock data OK at this stage). Marketing pages pass CWV. Phase 2 is not "done" until mock feed is swapped for real live stock.

### Phase 3 — Console core + white-label product

**Goal:** Authenticated user can launch a GPU job. Partners can self-serve their brand.

- Launch flow state machine (select → configure → submit → provision → running → done/failed)
- Job list + job detail (logs, cost, status)
- One-click Jupyter and vLLM presets
- Swap mock WS feed for real live stock data (completes Phase 2 exit criteria)
- Usage/billing summary, API key management
- Account settings
- CNAME / custom domain support with domain verification
- Partner admin pages: upload logo, set colors, add domain — self-serve, no eng needed

**Exit criteria:** End-to-end launch flow works. Real stock in the grid. Partner can brand and deploy on their domain.

### Phase 4 — Harden + polish

**Goal:** Product is tested, performant, and documented.

- Playwright e2e: sign up, launch job, switch theme, CNAME flow, mobile
- Performance audit on marketing pages (Lighthouse ≥ 90)
- Error, empty, and loading states polished
- Documentation: partner onboarding guide, API reference
- Security review: tenant isolation, auth, CSP per tenant

**Exit criteria:** Second brand deployed on custom domain. E2e green. CWV passing.

## How to split work across the team

### If 2 engineers (you + 1 dev)

| Person | Streams | Focus |
| --- | --- | --- |
| Dagim | C + half of B | Repo, API types, tenant system, CNAME, provider adapters, launch flow, partner admin |
| Dev 1 | A + half of B | Design system, marketing, GPU table, auth UI, job dashboard, WS client |

### If 3 engineers (you + 2 devs)

| Person | Streams | Focus |
| --- | --- | --- |
| Dagim | C | Repo, API types, tenant/middleware, CNAME, provider adapters, partner admin, CI, e2e |
| Dev A | A | Design system, marketing pages, pricing story, forms, CWV |
| Dev B | B | Auth, console, launch flow, jobs, WS integration, billing |

### If you also have the intern

Scoped, self-contained tasks with a reviewer on every PR:

- Build a specific marketing page from a design comp
- Add a filter to the GPU table
- Build the API key management page
- Build a partner admin sub-page (e.g. logo upload)
- Write Playwright tests for one flow
- Style a component in Storybook for both themes

## Task board structure

Columns: Backlog → Ready → In Progress → Review → Done

Labels by stream:

- `design-system` — shared components, tokens, Storybook
- `marketing` — public pages, pricing story, SEO, CWV
- `console` — authenticated app, dashboard, jobs
- `gpu-catalog` — GPU table, filters, pricing display, WS feed
- `launch-flow` — job creation state machine, Jupyter/vLLM
- `white-label` — tenant config, theming, CNAME, domain verification, partner admin
- `api` — type definitions, mock server, provider adapters
- `infra` — CI, linting, repo tooling, deployment
- `testing` — Playwright, Vitest, coverage

Labels by priority:

- `p0` — blocks other work
- `p1` — core feature
- `p2` — polish / nice-to-have

## What we can start now

Everything in Phase 0 and Phase 1 is unblocked. No open questions remain.

| Status | Work |
| --- | --- |
| Start now | All of Phase 0: scaffold, tooling, types, mock API, mock WS |
| Start now | Phase 1: design system, auth, tenant config, layouts |
| Start now | API type definitions — shape known from RunPod/Vast/Crusoe research |
| Needs real API keys | Provider adapters hitting real RunPod/Vast endpoints |
| Needs matching engine | Real live stock feed (but mock feed unblocks all UI work) |

## Rules

- If the matching engine or provider APIs are late, we do not stop. We build on mocks with the real schema. When the backend arrives, we swap the data source — not the UI.
- Mock feed uses the exact same message shape, field names, and update cadence as the planned live feed. No shortcuts that force a rewrite later.
- The GPU table is one shared component used on both the public pricing page and the console. "Live" vs "indicative" badge shows data freshness. The two pages cannot drift apart.
- White-label is not a Phase 4 afterthought. Tenant tokens ship in Phase 0. CNAME + partner admin ship in Phase 3. Every component respects tenant context from day one.
