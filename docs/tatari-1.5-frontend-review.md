# Tatari 1.5 Frontend Brief — Reviewer Paste Pack

Product shape for 1.5 (intern JD, see `compute-platform.md` in this folder): asset-light aggregator over RunPod / Vast.ai / colo, one branded console, match + monitor so jobs do not drop, white-label including domain. Frontend owns the console layer, not the DCs.

## Short review (paste this at the end of the Google Doc)

The vision is clear and the stack is a good fit: one Next.js app, shared design system, tenant colors as CSS variables, marketing vs console split.

Three things I need aligned before we implement, then a plan we can actually run.

### Questions

1. **Live pricing:** Can we call the marketplace “done” in the first build when it is wired to a real API shape (mock or staging), or does it need a live WebSocket to production-like stock before the phase closes?
2. **Tenant on the server:** Marketing pages are Server Components, so they cannot use `useTenant()`. Can we use `getTenant()` on the server and `useTenant()` only in client widgets, with the provider filled once from the root layout?
3. **White-label in v1:** For the first ship, is success theming (logo + colors on the same app), or do we also need partner CNAME, domain verification, and the admin screens in the same milestone?

### Suggestions

- Keep tenant tokens from day one; put CNAME/admin in the next milestone. That still avoids a painful retrofit, without making the first console wait on DNS and partner tooling.
- One GPU table component for public pricing and the console, with a visible “live” vs “indicative” state. Same UI, different data freshness — so the two pages cannot drift.
- Quote / become-a-provider posts to a server route, not to Notion from the browser. And keep the console chrome on the server, with only availability/job status as live client islands — that matches the performance bar we set in §1.

### Implementation plan

**Phase 0 — Align (a few days)**  
Answer the three questions. Freeze the URL list (one sitemap). Agree the tenant CSS variables. Share a stub API (OpenAPI or JSON types) for catalog + leads, even if the backend is fake.

**Phase 1 — Foundation**  
Design system (Radix/shadcn + Tailwind tokens as CSS variables). Marketing layout + console layout. `getTenant` / `TenantProvider`. Storybook (or equivalent) with default brand and one mock partner theme.

**Phase 2 — Public surface + grid**  
Home, pricing, quote, become-a-provider. Forms → `POST /api/leads`. Marketplace table on mock/staging data that matches the future live messages. Qualification filter in the URL. Label the grid live vs indicative.

**Phase 3 — Console**  
Auth shell, dashboard, keys, job list. Launch flow as a simple state machine (submit → provision → running / failed). Attach WebSocket when the contract is ready; until then keep the same UI on the stub.

**Phase 4 — White-label product + harden**  
Partner branding admin, CNAME if we said yes in Q3. Playwright on quote, provider, select-instance, theme switch. Performance checks on marketing pages.

**Rule:** If the matching engine is late, we do not stop Phase 1–2. We stay on the stub with the real schema.

I am good to start Phase 1 as soon as the three questions have an owner and an answer.

---

## Full comment pack (optional)

Use this in Google Docs:

- Leave inline comments (copy the quoted question onto the matching paragraph).
- Paste Appendix A–D at the end of the doc as your written response.

Voice: technical product engineer / frontend tech lead. Destination product, not current mining ops.

### How to comment in Google Docs

- Select the sentence the comment is about → Comment → paste one block.
- One issue per comment. Do not paste a whole section into one bubble.
- If a heading has several comments, add them as separate comments on consecutive sentences.

## Inline comments (by document section)

### 1. Executive Summary & Technical Vision

**On: “the console layer that sits on top of the matching engine”**

Confirming scope: this brief is frontend-only. Can we add one line that launch, live stock, and billing are blocked on a published API contract, and that frontend DoD for those flows is UI-complete against mocks until that contract exists?

**On: “Developer-first, zero-bloat” / “bare-metal speed aesthetic”**

Agree on the aesthetic. Can we state that we will not ship decorative terminal animations, and that any CLI snippet on marketing must be copied from real flags or labeled “example”?

**On: “Composable, tenant-aware from day one”**

Suggest splitting this: tenant-aware tokens (CSS variables) from commit one vs white-label product (CNAME, partner admin, CSP) in Phase 1.5. Retrofitting colors is expensive; retrofitting a domain admin is a later product. OK to keep tokens early without shipping admin in sprints 1–2?

**On: “a single Next.js codebase that serves marketing, live marketplace, and white-label console”**

This is three surfaces. For v1, can we name a thin slice: marketing + marketplace UI + default brand, with white-label admin explicitly Phase 3? Same repo, smaller first ship.

**On: “WebSocket-backed… true current stock, not a cached snapshot”**

Live stock as a product requirement makes sense. Implementation question: who terminates the socket (Next BFF vs matching engine), and what do we render when the stream is down — last snapshot + “stale” badge, or empty?

### 2. Competitive Design & UX Teardown

**On: “Dark-mode as the default across marketing and console”**

Works if tenant brand tokens include surface + text for dark, not only primary hex. Partner brand books are usually light-mode blues. Can the schema require dark-surface pairs so we do not paint a navy logo on black and fail contrast?

**On: “Bento-grid… reserve full-width for the pricing/availability table”**

Agree. Ask: is the public `/pricing` table and the console marketplace the same component with different freshness (snapshot vs live)? If not, they will drift.

**On: “Only show terminal output that is real or realistic”**

Same bar should apply to the pricing grid: if staging is on `gpu-catalog.ts` fallback, the UI must say Indicative / not live. Otherwise we violate this principle on the most important surface.

**On: “the pricing grid must be WebSocket-backed”**

Hard requirement is fine for the authenticated console. For the public marketing page, SSR + short poll or SSE is simpler and still honest. Can we split: marketing = signed snapshot; console = live stream?

**On: “qualification gate (2–3 questions) that pre-filters the grid”**

Good. Please specify persistence: URL query (`?workload=&gpu=&when=`), session, or none? Deep links from sales/docs should reopen the same filtered grid.

**On: “hot lead fast path (SSH key → console → launch)” vs “qualification-gated quote”**

Please name the exact 2–3 questions and the routing rules (what is hot vs quote vs unfit) so frontend can implement without waiting on a later BD doc.

**On: “Two audiences, one shell”**

One component library: yes. One client layout wrapping marketing: no — marketing should stay RSC. Comment only: we should not force the marketing tree through the console shell.

**On: “White-label as a first-class citizen, not a fork”**

Single deployment + tenant theming: agree. Feature parity “by construction” still needs a flag matrix (`enabledGpuTypes`, quote on/off). Can we keep branding separate from feature flags in the data contract?

### 3. Frontend Architecture & Directory Structure

**On: `providers/page.tsx` and `become-a-provider/page.tsx`**

Duplicate routes. Which URL is canonical? I would keep `/become-a-provider` as the form and `/providers` as the landing, or merge them. Please pick one in this brief.

**On: `(console)/layout.tsx` — “Client Component boundary… live WebSocket”**

If the whole console layout is a client island, we will miss our own CWV targets. Propose: server shell (sidebar chrome, tenant CSS already on `<html>`), client leaves only for availability + job ticker. Same rule you already have for marketing.

**On: “initial tenant config is still fetched server-side and streamed in”**

Good. This conflicts with §7 “never prop-drill, always `useTenant()`”. RSC cannot call `useTenant()`. See appendix for the split: `getTenant()` server / `useTenant()` client.

**On: `app/api/` only webhooks and og**

Quote and become-a-provider must POST to a server route or Server Action (Notion/CRM token cannot live in the browser). Please add `api/leads/` (or Server Actions) to this tree.

**On: `docs/[[...slug]]`**

What is the content source — MDX in-repo, CMS, or generated from OpenAPI? If unspecified, Phase 2 DoD ships an empty docs app.

**On: `config/tenants/` vs “fetched at runtime in prod”**

Please state: fixtures on disk for local/Storybook only; prod resolves by Host at request time. A checked-in tenant folder will get baked into builds.

**On: missing `middleware.ts`**

Host → tenant, unverified CNAME fallback, and preview-tenant host need middleware (or Vercel equivalent). Layout `resolveTenantFromHost` is not enough for caching or TLS gating. Can we add `middleware.ts` to this tree?

**On: `stores/` Zustand**

Agree if it stays UI-only (selected instance, modal). Please one sentence: no availability, jobs, or billing in Zustand — TanStack Query is source of cache.

**On: `lib/api` generated from OpenAPI**

Frontend can start with hand-written types + mocks. Generated client is a Phase 2/3 gate when the spec is published. Can we write that so we are not blocked from Phase 1?

**On: Boundary “(marketing) never imports from (console)”**

Keep. Add: `(marketing)` may import `components/marketplace` (the grid), so public pricing and console share one table.

### 4. Phase 1.5 White-Label Specification

**On: `TenantBrandingSchema` — `logoUrl` / `faviconUrl` `.url()`**

`.url()` rejects relative paths and some CDN forms. Prefer `z.string().min(1)` plus the CSP allow-list we already describe.

**On: colors only `#RRGGBB` primary/secondary/accent/surface**

For dark-default UI we need at least surface, foreground, and primary (and hover). Optional light-theme pair. Hex-only is OK for v1 if we say so; contrast check must run on computed pairs (primary on surface), not on the hex alone.

**On: `features.enabledGpuTypes` enum inside branding**

GPU SKUs should come from the catalog API, not the brand schema. Adding B200 should not require a branding Zod change. Move this to feature flags or catalog.

**On: `apiKeyScope` inside branding**

This is auth/tenancy, not paint. Suggest `TenantBranding` vs `TenantFeatures` vs `TenantAuth` (or one `TenantConfig` with three objects). Frontend branding components should not read key prefixes.

**On: `domain.cname + verified`**

Add: unverified host serves default Tatari shell or a 404, never a half-branded partner. Also: apex vs www, and TLS status separate from DNS verified if the platform distinguishes them.

**On: CSS injection in `RootLayout` + `headers().get("host")`**

On current Next, `headers()` is async. Please update the snippet. Also inject `<title>`, favicon, and theme-color from tenant on the server — CSS vars alone will FOUC the tab icon.

**On: Tailwind `colors.primary: "var(--color-primary)"`**

Confirm we use this for `bg-primary` / `text-primary` only, and keep a fixed dark shell (background, borders, muted) so a partner cannot set surface to white and blow the console. Or we fully theme light/dark — but then the brief must say which.

**On: “No component reads tenant branding via prop-drilling — always via `useTenant()`”**

This will force marketing pages to `"use client"`. Propose: server `getTenant()`, client `useTenant()`, provider hydrated once from the root layout. Passing config into `TenantProvider` is allowed.

**On: “every API request includes a `tenantId` claim”**

Frontend must not send `useTenant().tenantId` as a trusted JSON field. Session/cookie only; server validates. Please add that so the API client does not “helpfully” attach `tenantId` from context.

**On: “No cross-tenant client bundle leakage”**

Agree. Implementation: tenant config in the request RSC payload, not in `NEXT_PUBLIC_*` or a shared `tenants.json` import. Worth stating so someone does not import `config/tenants` in a client component.

**On: CSP allow-list for logo URLs**

Good. Who owns the allow-list (platform admin vs per-tenant)? Frontend can only enforce on `<img>`; CSP is a header from the server/middleware.

### 5. Coding Languages, Libraries & Protocols

**On: Next.js ^14.2 + “Partial Prerendering where stable”**

PPR on 14.2 was experimental. Either drop PPR from this brief or pin a Next major where it is actually stable. I would drop PPR as a principle and use SSR/ISR for marketing.

**On: Radix wrappers (Button, Dialog, …)**

That is shadcn/ui. I suggest we use shadcn on Radix and spend time on marketplace/tenant, not re-wrapping Button. Open to either; the brief should pick so Phase 1 DoD is unambiguous.

**On: “native WebSocket + a small reconnect wrapper”**

Please add to this table (or a subsection): auth on upgrade, heartbeat, backoff, resume, and how messages patch TanStack Query. Otherwise `lib/ws` becomes undefined work.

**On: `openapi-typescript` / `ts-proto`**

Need a single source. If the platform is HTTP/OpenAPI, drop `ts-proto` from v1. If gRPC-web, say so. Dual generate will rot.

**On: CI “preview white-label tenant”**

How is the preview host set — `?tenant=`, Host header, or `acme.preview.tatari.systems`? Frontend needs this to write Playwright.

**On: Vercel**

Fine. Multi-tenant custom domains on Vercel need a plan (wildcard + middleware). Flag as a platform ticket, not only a React ticket.

### 6. Chronological Roadmap

**On: Phase 1 DoD — Storybook every primitive in default + mock second tenant**

Agree. This should be the only white-label DoD in Phase 1 (tokens work). Not CNAME.

**On: Phase 2 — “pricing grid reflecting live (not mocked) availability end-to-end in staging”**

This makes frontend DoD depend on a live matching-engine staging env. Propose: Phase 2 DoD = grid wired to a contract-shaped mock or recorded fixture; “live staging” moves to Phase 3 when WS exists. Otherwise Phase 2 cannot close.

**On: Phase 2 — “auto-routing submissions into CRM/Notion”**

Server-only. Please name the integration owner (frontend calls `POST /api/leads`; who implements Notion is backend/ops).

**On: Phase 2 pages list vs §3 tree**

Brief mentions Home, Providers, Clients/Buyers, Pricing, FAQ, Contact. The tree has Home, providers, pricing, docs, quote, become-a-provider. Please align the IA (one sitemap) so we do not build pages that are not in the tree.

**On: Phase 3 — “one-click Jupyter/vLLM launch modal”**

Frontend can DoD: select → confirm → POST job → show states (submitting / provisioning / running / failed) → display URL. “vLLM is serving tokens” is a backend DoD. Can we split that in this phase?

**On: Phase 4 — LCP < 1.2s, INP < 50ms, CLS < 0.05 on throttled mobile for marketing and console**

INP 50ms is far below the “good” bar (200ms). A live grid will fail and then we will game Lighthouse. Propose split budgets (see appendix). Merge-gate marketing; RUM budget for console, not Lighthouse-on-throttled-mobile.

**On: Phase 4 — security audit of multi-tenant boundary**

Frontend can own CSP, no secrets in client, no tenantId spoofing. Scheduler/billing isolation is not this brief. Please mark audit scope: frontend + BFF so we are not holding the UI for a platform audit we do not own.

### 7. Developer Acceptance Criteria

**On: “No component reads tenant branding via prop-drilling — always `useTenant()`”**

Same blocker as §4. Please replace with the server/client split so PR review does not reject correct RSC pages.

**On: “Every new API-facing function has a corresponding typed client in `lib/api`”**

Agree once OpenAPI exists. Until then, allow a `lib/api/mock.ts` with the same signatures. Otherwise Phase 1 has nothing to call.

**On: 80% unit coverage on `lib/` and `components/forms`**

Strong yes on forms + tenant CSS injection. 80% on `lib/ws` is low value. Prefer a contract test on the WS message schema.

**On: Playwright for marketplace → launch**

Needs testids + a seeded tenant + a fake job API. Please add “seeded staging tenant + mock job worker” as a dependency, not only a frontend checkbox.

**On: Contrast 4.5:1 under arbitrary tenant colors — admin rejects failing combos**

Specify pairs: primary-on-surface, accent-on-surface, badge text on availability green/red. Keyboard model for the grid (row vs card, `aria-live` on stock change) should be in this section — that is the WCAG hole, not Button.

**On: “No PR may regress the Core Web Vitals budget… failing budget blocks merge”**

Only if budgets are split (see appendix). As written, this will block legitimate console work.

**On: overall DoD — “at least one live white-label tenant in production” + “lead-capture feeding CRM per MoU already agreed with BD”**

Please link or attach that MoU/field list. If it is not in this doc, frontend cannot know tags/fields. White-label production tenant is a company DoD, not a sprint-7 frontend DoD — suggest “preview tenant on staging” for this brief.

---

# Appendix — Frontend Tech Lead Review

**Reviewer:** Dagim Jida (Product / Engineering)  
**Scope reviewed:** public marketing, GPU marketplace console, Phase 1.5 white-label frontend  
**Stance:** destination architecture, not a rewrite of the vision.

## A. Summary

The direction is right: one Next.js app, dark developer UI, shared design system, tenant colors as CSS variables, marketing vs console split, Zod, Query for server data, Zustand for UI only.

I would not start implementation on this brief as written. A few rules contradict each other (RSC vs `useTenant()`, live-grid DoD vs no API contract, INP 50ms vs a WebSocket console). Fix those in the brief, then Phase 1 is startable.

This review does not cover the matching engine, GPU inventory, or billing backend — only the frontend this document owns, plus the contracts we need from the platform.

## B. Questions (consolidated)

Please answer in comments or in a short “Decisions” subsection. Frontend is blocked on these:

1. Is this brief frontend-only DoD, or must launch/live stock work E2E before we call a phase done?
2. Where is the OpenAPI (or JSON Schema) for catalog, quotes, jobs, keys? Date we will have a v0?
3. WebSocket: URL, auth on upgrade, message schema, who owns reconnect?
4. Tenant resolution order: local, preview URL, Host, verified CNAME, fallback?
5. Do partner CNAMEs serve marketing + console or console only?
6. Canonical sitemap (one list of URLs). `/providers` vs `/become-a-provider`?
7. Are public `/pricing` and console marketplace one component? Freshness rules?
8. Qualification questions and exact routing (hot / quote / unfit)?
9. Notion/CRM: server endpoint, fields, tags. Who implements the Notion side?
10. Analytics vendor, and is tenant host a dimension?
11. Next.js major we actually pin (and drop PPR if we stay on 14.2)?
12. shadcn-on-Radix vs hand-wrapped Radix — which is Phase 1?
13. Preview white-label: how do we address the second tenant in Vercel previews?
14. Launch UI: which states are in frontend scope (see §C)?

## C. Suggestions (what I would change)

### Product / scope (still frontend)

- **Tokens early, white-label product later.** CSS variables + Storybook second theme in Phase 1. CNAME, admin, CSP, production partner domain in Phase 3.
- **One marketplace package.** Same GPU table on marketing and console. Marketing may be a labeled snapshot; console is live.
- **Honest live.** If the stream is mock or stale, the grid says so. Same standard as “no fake terminal.”
- **Launch is a state machine, not a modal title:** idle → submitting → provisioning → running | failed | quota. E2E maps to those states. “vLLM serving” is backend.
- Do not hardcode GPU SKUs in the branding schema. Catalog API owns SKUs.

### Architecture

- `getTenant()` on the server; `useTenant()` on the client; hydrate `TenantProvider` once from the root layout.
- Add `middleware.ts` for host → tenant and unverified-domain behavior.
- Split config: `TenantBranding | TenantFeatures | catalog`. No `apiKeyScope` in branding.
- Prod tenant config runtime by host, never `NEXT_PUBLIC` and never imported `tenants/*.ts` from client components. Disk fixtures for Storybook/local only.
- Server Actions or `POST /api/leads` for quote/provider. No CRM secrets in the browser.
- Console: server layout; client leaves for WS/availability/job row.
- Realtime: snapshot or SSE on public pricing; WebSocket on console when the contract exists. Spec messages before `lib/ws`.
- Drop PPR as a requirement. SSR/ISR for marketing.
- Prefer shadcn/ui on Radix for primitives.
- `lib/api`: same function signatures from day one; mock implementation until OpenAPI generate is on.

### Quality bars

- **CWV split:** Marketing — LCP < 2.0s (1.2s aspirational), INP < 200ms, CLS < 0.05. Console — LCP < 2.5s, INP < 200ms; do not merge-block on Lighthouse for the live grid. Use RUM later.
- **Coverage:** 80% on forms + tenant injection. Contract tests for WS schema, not 80% on the socket wrapper.
- **a11y:** contrast pairs in admin; keyboard + `aria-live` on the grid.

## D. Implementation plan (frontend)

Assumes: vision stays; we implement after the questions in §B have owners.

### Phase 0 — 2–3 days (brief + contracts)

- Freeze sitemap (URLs).
- Freeze tenant CSS variable list.
- Mock OpenAPI or JSON types for catalog + leads (even if backend is stub).
- Decision log: shadcn vs hand Radix, Next pin, WS vs snapshot for marketing.

**Exit:** this brief updated, or a one-page RFC delta attached.

### Phase 1 — Design system + shells (sprints 1–2)

- Tailwind tokens as CSS variables (dark default).
- `components/ui` (shadcn/Radix): Button, Input, Select, Dialog, Tooltip, Tabs, Badge, Table.
- Marketing layout (RSC) + console layout (server chrome).
- `getTenant` / `TenantProvider` / `useTenant`.
- Storybook (or equivalent): default theme + one mock partner theme.
- Middleware stub: host → default tenant; second host → mock tenant locally.

Do not include: CNAME admin, real WS, launch, Notion.

**DoD:** two themes render on the same Button/Table; marketing home chrome exists; no CRM.

### Phase 2 — Marketing + marketplace UI (sprints 3–4)

- Pages: Home, Pricing/How it works, FAQ, Contact, Quote, Become a provider (aligned sitemap).
- Zod forms → `POST /api/leads` (stub OK if it records payload).
- Qualification gate with URL-persisted filters.
- `components/marketplace`: SKU, VRAM, interconnect, price, availability badge, hourly/spot/reserved calculator.
- Wire grid to mock stream or polling fixture shaped like the future WS messages.
- Docs: MDX stub or drop from this phase.

**DoD:** forms submit to server; grid is one component on public + console route; badges can show live vs stale; no fake “in stock” without the fixture saying so.

### Phase 3 — Console + tenant admin (sprints 5–6)

- Auth shell, dashboard, job list/detail UI, SSH keys, API keys UI.
- Launch modal wired to job API or mock with the state machine above.
- WS client against staging if contract exists; else keep fixture + “not live” on production.
- Tenant admin: logo/colors (contrast gate), domain field UI; verification flow if platform API exists.
- Security: no `tenantId` in body; CSP headers from server; logos from allow-listed hosts.

**DoD:** one preview hostname shows partner theme with zero default-tenant secrets in client JS; launch E2E against mock/staging job API.

### Phase 4 — Harden (sprint 7)

- Playwright: quote, provider, filter → select instance, tenant theme switch, key create (happy path).
- Lighthouse CI on marketing top pages with the split budget.
- Typecheck, lint, unit on forms/tenant.
- Frontend security checklist (secrets, CSP, session tenant). Platform audit is a separate ticket.

**DoD for this brief:** CI green on frontend checks; staging preview tenant; leads hitting the server endpoint. Production partner CNAME and real GPU launches are platform DoD, tracked separately.

### Sequence rule

If OpenAPI/WS is late, do not stall Phase 1–2. Stay on mocks with the real schema. Do not invent a second grid or a second brand system while waiting.

## E. What else I recommend we add to this document

As technical product engineer, the brief is missing:

- Sitemap + user flows (one diagram): anonymous → quote; anonymous → signup → SSH → launch; partner admin → branding.
- Empty / loading / error / stale for the grid and jobs — E2E and design need these.
- Permission matrix: anonymous, user, team admin, tenant admin, Tatari super-admin.
- Dependency table: frontend phase vs matching-engine / identity / billing / DNS.
- Instrumentation: which events (page view, qualify, quote submit, deploy click) and where they go.
- Out of scope list: native apps, i18n, multi-currency display, non-NVIDIA SKUs, forked partner repos.
- Decision log at the top (date, owner, “tokens yes / admin later”, “INP 200ms”).
- OpenAPI link as a living attachment so `lib/api` does not rot.

I can turn §D into tickets once the questions in §B are answered.

End of paste pack.
