# Tatari Technical Agent Context

This file lives at `tatari-1.5/docs/tatari-technical-agent-context.md` in the `dev/tatari` working repo. Give it to the coding agent before Compute implementation begins. If you split Compute into its own GitHub repo, copy this file (and the sibling docs) into that repo root or `docs/`.

## 1. Purpose of this document

This is the technical source of context for Tatari Systems' software work. It explains:

- What Tatari 1.5 / Compute Platform is
- What the broader product is intended to become
- What the first narrow implementation actually includes
- Confirmed product and design decisions
- Proposed architecture and stack
- Required domain models and workflow
- Testing, security, and audit requirements
- Team responsibilities and engineering guardrails
- Decisions that still need to be confirmed

Do not treat pitch claims, draft schemas, or future features as implemented capabilities.

## 2. Working relationship

### Engineering lead

Dagim Jida is Tatari's Director of Product Development and Engineering and the engineering lead for this work.

Dagim will:

- Own technical direction and architecture decisions
- Coordinate other developers and interns
- Review important pull requests
- Resolve product-scope questions with the Tatari team
- Work directly on platform, API, tenant, and integration concerns

### How the agent should work

- Be direct and practical.
- Do not make Dagim repeat product context already captured here.
- Challenge unclear or unsafe assumptions with a short technical explanation.
- Separate confirmed requirements from recommendations.
- Do not invent backend contracts, provider capabilities, pricing formulas, SLAs, or operational facts.
- Prefer a narrow, working vertical slice over broad scaffolding.
- Before implementing a feature, identify its acceptance criteria and dependencies.
- Preserve strict scope boundaries between the narrow first workflow and the broader platform.
- Use small, reviewable pull requests grouped by logical change.
- Never expose secrets, provider credentials, internal financial data, or customer data.

## 3. Company and product context

Tatari Systems is described as a seed-stage American company with operating experience in Bitcoin mining and a planned move into aggregated cloud compute in emerging markets.

The compute product is called Tatari 1.5 / Compute Platform or Tatari 1.5 / White-Label.

### Simple product definition

Tatari 1.5 is intended to be an asset-light GPU-as-a-Service marketplace and console.

A future customer should be able to:

- Open the Tatari or partner-branded console
- Select a GPU and region
- Configure a workload
- Launch a job, Jupyter notebook, or supported preset
- Monitor status, logs, usage, and cost

Behind the interface, Tatari is expected to:

- Aggregate GPU supply from multiple providers
- Match customer requirements to eligible supply
- Consider region, price, availability, and reliability
- Monitor jobs and provider status
- Present the experience through one consistent console

Named examples of potential supply in product material include RunPod, Vast.ai, colo, and cloud providers. This does not mean integrations are currently available or complete.

### Product layers

- **Console** — dashboard, branded UI, API access
- **Matching and scheduling** — GPU eligibility, region, ranking, usage
- **Infrastructure** — power, cooling, data centers
- **Compute** — physical GPU clusters

The current software effort primarily concerns the console and light backend workflow. It does not include operating data centers.

## 4. Full destination product

The broader product vision includes:

- Public marketing website
- Public pricing or GPU availability surface
- GPU marketplace/catalog
- Authenticated customer console
- Requirement and quote flows
- GPU launch workflow
- Job lifecycle and logs
- Usage and cost reporting
- API key management
- Account settings
- Jupyter and vLLM presets
- Multi-provider integrations
- Matching and scheduling
- Full white-label support
- Partner administration

This is the destination, not the scope of the first narrow release.

## 5. Confirmed product decisions

### 5.1 White-label scope

The full white-label product includes all of the following:

- Partner logo
- Partner colors and design tokens
- Partner custom domain using CNAME, such as `compute.partnerbrand.com`
- Domain-ownership verification
- Partner admin pages
- Self-service logo upload
- Self-service color selection
- Self-service domain setup and verification

White-label means more than theming.

However, the narrow first workflow described below explicitly excludes the white-label engine. To avoid confusion, do not use “Phase 1.5” as the only identifier for both efforts.

Recommended release names:

- **Release A — Internal Quote-to-Commit Workflow**
- **Release B — White-Label GPU Marketplace Console**

### 5.2 Pricing and stock data

Mock data is acceptable during development if it uses the planned production contract:

- Same field names
- Same data types
- Same message envelope
- Same expected update behavior
- Same loading, stale, disconnected, and error states

Before the future live marketplace phase is considered complete, mock data must be replaced with real live stock data.

The narrow first workflow does not include a live pricing grid.

### 5.3 Design references

| Product | What to study |
| --- | --- |
| RunPod | Console UX, fast self-service GPU launch, job status, container-based flows |
| Lambda Labs | Clean, simple, trustworthy interface and transparent pricing |
| Crusoe | “Cheap energy → cheaper compute” positioning and published pricing |
| Vast.ai | Clear distinction between cheap/risky and reliable/guaranteed supply |
| CoreWeave | Enterprise infrastructure presentation; not the primary self-service model |
| Nebius | Serious infrastructure visual language |

The product should feel institutional, reliable, technical, and self-service—not flashy or consumer-oriented.

Tatari's visual language in current company material uses:

- Black backgrounds
- Charcoal surfaces
- White primary text
- Muted cool-gray secondary text
- Restrained medium blue accents
- Clean geometric sans-serif typography
- Clear data hierarchy
- Minimal decorative effects

## 6. Current authorized implementation: narrow workflow

### Scope statement

Build only this workflow:

```text
Requirement submission
    → persistence
    → rules-based supply matching
    → quote creation
    → internal human approval/rejection
    → commitment creation
```

There must be a human approval step before a commitment is created.

### Explicitly out of scope

- Pricing grid
- Marketplace browsing
- White-label engine
- CNAME and domain verification
- Partner admin pages
- Client-facing quote page
- Automated provider API integration, unless separately confirmed
- GPU provisioning
- Job execution
- Delivery workflow after commitment
- Billing and payment collection
- Machine-learning matching

The first release ends when an approved quote creates a commitment with:

```text
status = "pending_delivery"
```

## 7. Narrow workflow in plain language

Example customer request:

> “We need eight H100 GPUs in Europe for two weeks, within this budget, with a minimum uptime requirement.”

The product should:

1. Collect the request through a public form.
2. Validate the request in the browser.
3. Validate it again on the server.
4. Save it as a `ClientRequirement`.
5. Compare it with available `GpuSupply`.
6. Remove supply that fails hard requirements.
7. Rank remaining supply using preferences.
8. Create a proposed `Quote`.
9. Show the quote to an authenticated internal reviewer.
10. Require the reviewer to approve or reject it.
11. Create exactly one `Commitment` after approval.
12. Record every important event in `AuditLog`.

## 8. Proposed stack

The stack below is a proposal from the implementation brief. Confirm versions and infrastructure before installation.

| Area | Technology | Purpose |
| --- | --- | --- |
| Web framework | Next.js App Router | Pages, layouts, Server Components, Route Handlers, Server Actions |
| UI language | React + TypeScript strict mode | Typed frontend and server code |
| Styling | Tailwind CSS | Styling and design tokens |
| Components | shadcn/ui or approved primitive library | Accessible UI primitives |
| Runtime validation | Zod | Validate external and form data at runtime |
| Forms | React Hook Form + Zod resolver | Form state and inline validation |
| Database | PostgreSQL | Durable relational storage |
| ORM | Prisma | Typed database schema, migrations, and queries |
| Async client state | TanStack Query | Client-side fetching/caching where necessary |
| Unit tests | Vitest | Schemas, matcher, and service logic |
| Browser tests | Playwright | End-to-end workflow tests |
| CI | GitHub Actions | Lint, type-check, tests, and build |

### Stack responsibilities

#### TypeScript

Provides compile-time types. TypeScript alone does not validate network or form input at runtime.

#### Zod

Validates unknown data while the application is running. The same schema can support:

- Browser form validation
- Server-side validation
- Type inference
- API boundary validation
- Test fixtures

#### PostgreSQL

Stores requirements, supply, quotes, commitments, and audit events.

#### Prisma

Defines database models and migrations and generates a typed database client.

Keep Prisma schema in the conventional `prisma/schema.prisma` location unless the installed Prisma version is deliberately configured otherwise.

#### Server Actions and Route Handlers

- Use Server Actions for application-owned mutations triggered by the UI.
- Use Route Handlers when a stable HTTP endpoint is required for external callers, raw API testing, or integrations.
- Do not claim a `curl` request tests a Server Action unless an HTTP Route Handler actually exists for that request.

#### TanStack Query

Use it only where client-side refresh, caching, or mutation state is valuable. A read-only internal page can often load data directly in a Server Component.

## 9. Core domain models

The exact fields must be finalized before migration.

### 9.1 ClientRequirement

Represents customer demand.

Expected fields:

- `id`
- `workloadType`
- `gpuPreference`
- `quantity`
- `timeframeStart`
- `timeframeEnd`
- `region`
- `budgetMinUsd`
- `budgetMaxUsd`
- `slaNeeds`
- `mustHaves`
- `niceToHaves`
- `status`
- `createdAt`
- `updatedAt`

Required validation:

- Quantity must be positive.
- Budget minimum must be less than or equal to budget maximum.
- Start must be before end.
- Dates must use an agreed timezone convention, preferably UTC.
- Must-haves and nice-to-haves must remain separate.

### 9.2 GpuSupply

Represents known available supply.

Draft fields may include:

- `id`
- `vendorId`
- `gpuModel`
- `quantityAvailable`
- `region`
- `hourlyPriceUsd`
- `minimumUptime`
- `availableFrom`
- `availableUntil`
- `status`
- `metadata`
- `createdAt`
- `updatedAt`

This model is not final until checked against real vendor records.

Potential missing fields:

- Minimum commitment length
- Contract terms
- Vendor contact
- Currency
- Setup fees
- Egress fees
- Storage fees
- Reservation type
- Reliability tier
- Data-sovereignty constraints

### 9.3 VendorResponse

Represents a provider's manual or automated response.

Current assumption: manual/internal for the narrow release.

This is unresolved:

- Who creates it?
- Which UI or import process creates it?
- How does it become `GpuSupply`?
- Does matching use `VendorResponse` or only `GpuSupply`?

Do not build this model deeply until that relationship is confirmed.

### 9.4 Quote

Represents the system's proposed offer.

Expected fields:

- `id`
- `requirementId`
- Matched supply references
- `totalEstimatedCostUsd`
- SLA summary
- `quoteStatus`
- `createdAt`
- `updatedAt`
- Optional expiry timestamp

Do not store matched supply only in memory.

Prefer an explicit relation/join model between `Quote` and `GpuSupply` if line-item details must be preserved. A simple array of IDs loses historical pricing and SLA context.

Consider storing quote line-item snapshots so later supply changes do not rewrite an existing quote.

### 9.5 Commitment

Represents an approved commercial commitment.

Expected fields:

- `id`
- `quoteId`
- `status`
- `createdAt`
- `updatedAt`

For the narrow release:

```text
status = "pending_delivery"
```

`quoteId` should be unique to prevent duplicate commitments.

### 9.6 AuditLog

Represents an immutable lifecycle event.

Expected fields:

- `id`
- `entityType`
- `entityId`
- `action`
- `actorId`
- `beforeStatus`
- `afterStatus`
- Optional structured metadata
- `createdAt`

Index:

- `entityId`
- Prefer composite index on `entityType`, `entityId`, `createdAt`

For entity creation, choose one convention:

- `beforeStatus = null`
- or `beforeStatus = "nonexistent"`

Do not leave this ambiguous in tests.

## 10. Statuses and transitions

The brief permits string columns for v1, but status values must still be centralized.

Potential requirement states:

```text
submitted
matched
no_match
```

Potential quote states:

```text
pending_approval
approved
rejected
```

Commitment state:

```text
pending_delivery
```

Allowed flow:

```text
Requirement: created → submitted → matched
Requirement: submitted → no_match

Quote: created as pending_approval
Quote: pending_approval → approved
Quote: pending_approval → rejected

Approved Quote → exactly one pending_delivery Commitment
```

Do not scatter raw status changes across page components. Put transitions in a service layer, even while database columns remain strings.

## 11. Matching rules

Create a plain deterministic TypeScript function:

```ts
matchSupply(
  requirement: ClientRequirement,
  supply: GpuSupply[],
): MatchResult[]
```

### Matching behavior

1. Evaluate hard constraints.
2. Exclude every supply record that fails a must-have.
3. Score eligible records against nice-to-haves.
4. Sort by the simple score and documented tie-breakers.
5. Return an empty array when nothing qualifies.

### Do not build

- Machine-learning ranking
- Generic ranking infrastructure
- Complex optimization engine
- Provider-specific orchestration

### Required matcher tests

- Full match
- Hard-constraint failure
- Partial nice-to-have match
- Zero matches
- Empty must-haves
- Stable tie-breaking
- Quantity and date availability boundaries

## 12. Cost calculation

The cost formula is not yet confirmed.

A likely starting formula is:

```text
hourly GPU price × requested GPU quantity × requested duration in hours
```

Before implementation, confirm:

- Whether a quote contains one selected supply option or multiple alternatives
- Currency
- Duration rounding
- Minimum commitments
- Setup fees
- Storage and network fees
- Taxes
- Discounts or margins
- Quote expiry
- Whether SLA tiers affect price

Do not call a number “total estimated cost” without a documented formula.

Use a decimal-safe representation. Avoid floating-point arithmetic for money.

## 13. Authentication and authorization

The narrow spec requires internal-only pages and attributable approvals, so authentication is a functional requirement even though the checklist did not define it fully.

Minimum roles:

| Role | Permission |
| --- | --- |
| Public/client | Submit a requirement |
| Internal reviewer | View requirements, matches, and quotes |
| Approver/admin | Approve or reject a quote |

Requirements:

- Approval must require an authenticated user.
- `actorId` must come from the trusted session, never from form input.
- Authorization must run server-side.
- Internal pages must not rely on hidden navigation for security.
- Rejection and approval must be protected from replay and double execution.

Auth provider is not confirmed. Do not choose one without checking deployment and organization requirements.

## 14. Transaction and idempotency requirements

### Requirement creation

Create the requirement and initial audit event in one database transaction.

### Matching and quote creation

Persist:

- Requirement transition
- Quote and line items
- Audit event

in a controlled transaction where practical.

### Approval

Approval is the most important transaction:

1. Verify authenticated approver.
2. Read/lock or conditionally update pending quote.
3. Reject if quote is no longer pending.
4. Mark quote approved.
5. Create exactly one commitment.
6. Write audit entries.
7. Commit all changes together.

Required protections:

- Unique constraint on `Commitment.quoteId`
- Conditional update from `pending_approval`
- Database transaction
- Clear conflict response
- No commitment creation from UI code

Code search for `Commitment.create()` is a review aid, not the primary protection.

## 15. Suggested repository structure

Adapt to the actual scaffold and installed framework version.

```text
app/
  (marketing)/
    quote/
      page.tsx
  (console)/
    quotes/
      [requestId]/
        page.tsx
    admin/
      quotes/
        [requestId]/
          page.tsx
  api/
    requirements/
      route.ts              # only if a public HTTP endpoint is required
    match/
      route.ts              # only if matching is exposed as HTTP

components/
  forms/
    requirement-form.tsx
  quotes/
    quote-summary.tsx
    approval-controls.tsx

lib/
  api/
    requirements.ts         # Server Actions or application entry points
    quotes.ts
  auth/
    session.ts
    authorization.ts
  db/
    client.ts
  matching/
    match-supply.ts
    match-supply.test.ts
  services/
    requirement-service.ts
    matching-service.ts
    quote-service.ts
    approval-service.ts
  validation/
    marketplace.ts

prisma/
  schema.prisma
  migrations/
  seed.ts

tests/
  integration/
    quote-to-commit.test.ts
  e2e/
    quote-workflow.spec.ts
```

Avoid placing business logic directly in pages, Route Handlers, or Server Actions. Those should call service functions.

## 16. Implementation sequence

### Phase 0 — Confirm contracts

Before coding:

- Confirm requirement fields.
- Confirm supply source and fields.
- Resolve `VendorResponse` versus `GpuSupply`.
- Confirm cost formula.
- Confirm authentication and roles.
- Confirm audit creation convention.
- Confirm deployment and PostgreSQL environment.

### Phase 1 — Types and persistence

- Enable strict TypeScript.
- Add Zod schemas and inferred types.
- Add schema unit tests.
- Configure Prisma and PostgreSQL.
- Add Prisma models, indexes, and unique constraints.
- Run migration against a fresh development database.
- Add deterministic fake supply seed data.

Exit criteria:

- Invalid dates and budgets fail.
- Migration succeeds on a fresh DB.
- Seeded supply can be queried.

### Phase 2 — Requirement capture

- Build the public form.
- Use shared Zod validation in the browser.
- Revalidate on the server.
- Persist requirement and audit event transactionally.
- Return clear success and validation states.

Exit criteria:

- Invalid data never reaches PostgreSQL.
- Valid submission creates exactly one requirement and audit event.

### Phase 3 — Matching

- Implement pure rules-based matcher.
- Write required unit tests.
- Load supply from the repository/service layer.
- Persist matched or no-match result.
- Write audit transition.

Exit criteria:

- Matcher tests pass.
- Zero-match path is explicit.
- Matches are reproducible.

### Phase 4 — Quote creation and review

- Define quote line-item persistence.
- Calculate estimated cost using the approved formula.
- Create one pending quote after a successful match.
- Build internal quote review page.
- Add loading, error, and no-match states.

Exit criteria:

- Quote survives supply changes through stored snapshots or line items.
- Reviewer can see price and SLA.

### Phase 5 — Approval gate

- Protect admin route.
- Add approve/reject controls.
- Implement authorization and transactional transition.
- Capture actor from trusted session.
- Reject stale/double decisions.
- Write audit events.

Exit criteria:

- No unauthenticated approval.
- Double approval creates no duplicate records.

### Phase 6 — Commitment

- Create commitment only in approval service.
- Enforce unique quote relation.
- Set `pending_delivery`.
- Stop; do not implement provisioning.

Exit criteria:

- Exactly one commitment per approved quote.

### Phase 7 — Audit and integration

- Run a requirement through the full workflow.
- Query audit events in order.
- Assert complete lifecycle.
- Verify actor and status fields.

### Phase 8 — Scope and quality

- Run lint and type-check.
- Run unit tests.
- Run integration tests.
- Run production build.
- Review all commitment creation paths.
- Confirm excluded features were not added.
- Add a short scope-check note.

## 17. Acceptance criteria summary

The narrow release is complete when:

- Shared validation rejects invalid budgets and date ranges.
- PostgreSQL migrations work on a fresh database.
- Public requirement form displays inline errors.
- Server rejects invalid bypass attempts.
- Every valid requirement is saved once.
- Matcher correctly handles full, partial, empty-must-have, and zero-match cases.
- Zero matches create no quote.
- Successful matching creates one persisted quote.
- Internal reviewer can see matched options, SLA, and price.
- Only an authorized human can approve or reject.
- Double approval is rejected safely.
- Approval creates exactly one commitment.
- Commitment ends in `pending_delivery`.
- Audit trail reconstructs the entire workflow.
- CI passes.
- No pricing-grid, marketplace, provisioning, or white-label scope leaked into the release.

## 18. Pull request plan

Recommended logical pull requests:

1. Shared Zod schemas and schema tests
2. Prisma models, migration, and development seed
3. Requirement form and validated persistence
4. Rules-based matcher and unit tests
5. Quote persistence and internal review page
6. Authentication/authorization and approval gate
7. Commitment creation and idempotency protections
8. Full integration test, audit verification, and scope note

Do not split one atomic requirement across multiple PRs merely to match this list. Every merged PR should build and pass its relevant tests.

## 19. Team split

### Two engineers

| Owner | Focus |
| --- | --- |
| Dagim | Architecture, schemas, service boundaries, matching, approval transaction, reviews |
| Developer | Requirement form, internal quote UI, reusable components, tests |

### Three engineers

| Owner | Focus |
| --- | --- |
| Dagim | Architecture, database, auth/authorization, approval and commitment |
| Developer A | Public requirement experience and shared UI |
| Developer B | Matcher, quote workflow, audit and integration tests |

### Intern

Give an intern self-contained work with a reviewer:

- One form section
- One quote presentation component
- One empty/loading/error state
- Schema fixtures
- Matcher test cases
- One Playwright scenario

Do not assign the approval transaction, authorization boundary, or monetary calculation without close review.

## 20. Engineering rules

- Validate at every trust boundary.
- Never trust client validation alone.
- Use database transactions for multi-record lifecycle changes.
- Use database constraints for uniqueness and integrity.
- Store money safely; do not use floating point.
- Use UTC for persisted timestamps unless explicitly decided otherwise.
- Keep hard filters separate from ranking preferences.
- Keep business logic out of React components.
- Keep provider-specific logic behind adapters.
- Never represent mock data as live data.
- Do not log secrets or sensitive requirement details unnecessarily.
- Use accessible components and keyboard-operable forms.
- Include loading, empty, validation, conflict, and server-error states.
- Document all deliberate simplifications.

If using a newer Next.js version, read the installed version's documentation before implementing framework-specific APIs. Do not rely on older Next.js conventions from memory.

## 21. Open decisions

These require an owner and explicit answer:

- Exact `ClientRequirement` fields and SLA representation
- Exact `GpuSupply` fields
- Source of initial supply data
- Relationship between `VendorResponse` and `GpuSupply`
- Quote cost formula and money representation
- Whether quotes contain alternatives or one selected offer
- Quote expiry behavior
- Authentication provider
- Reviewer and approver roles
- Audit convention for entity creation
- Deployment platform
- PostgreSQL hosting
- Whether external HTTP APIs are needed in the first release
- Whether a customer receives confirmation after form submission
- Which status names are approved product language

The agent should not silently decide these if the choice changes product behavior, security, or data structure.

## 22. Known contradictions to avoid

### “Phase 1.5” scope

One document uses Phase 1.5 for full white-label compute; another uses it for the narrow quote workflow that explicitly excludes white-label.

Always state the release name and scope, not only the phase number.

### Server Action versus curl

A Server Action is not automatically a public REST endpoint. If raw `curl` acceptance testing is required, implement and secure a Route Handler or revise the acceptance test.

### “Schemas mirror exactly”

Zod input objects and database records should align semantically, but they may not be structurally identical:

- Zod may use nested budget objects.
- Prisma may use `budgetMinUsd` and `budgetMaxUsd`.
- Zod may validate strings that Prisma stores as timestamps or decimals.

Define deliberate mapping functions rather than forcing artificial structural identity.

### Audit `beforeStatus`

Creation has no real previous status. Agree on `null` or `"nonexistent"`.

### Status strings

String database columns do not mean transitions may be arbitrary. Centralize constants and transition rules.

## 23. Definition of the first usable demo

A strong first demo should show:

1. A visitor submits a valid GPU requirement.
2. The request appears in the internal console.
3. Seeded supply is matched deterministically.
4. A pending quote shows matched supply, SLA, and estimated price.
5. An authenticated reviewer approves it.
6. One pending-delivery commitment is created.
7. The audit page or test output shows the complete history.

The demo must clearly label seeded/mock supply as test data.

## 24. Final mental model

Zod defines and validates incoming shapes.  
Prisma maps application records to PostgreSQL.  
Services enforce business rules and state transitions.  
The matcher filters hard requirements and ranks preferences.  
Next.js presents public and internal workflows.  
An authenticated human approves.  
Database constraints prevent duplicate commitments.  
Audit logs prove what happened.

Build this narrow workflow correctly first. The future marketplace, live stock, job execution, and white-label console should extend these foundations without being pulled prematurely into this release.
