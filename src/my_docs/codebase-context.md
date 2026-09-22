# Tatari Release A - Codebase Context

> Developer context generated from repository analysis.
>
> Verify important details against the current code before making changes.
> This document may contain temporary/local development information and should
> not be committed unless explicitly intended.
>
> Last known state: Ticket 1 complete/committed; Ticket 5 implemented and tested
> locally but not committed.

## 1. Quick Context

- Repo: `tatari-release-a`
- Next.js `16.3.4` / React `19` / TypeScript / Tailwind 4
- Prisma 7 + Postgres / NextAuth v5 beta
- Scope: internal quote-to-commit flow only:
  `requirement -> match -> quote -> human decision -> commitment(pending_delivery)`
- Layout:
  - `src/app/(marketing)` - public intake
  - `src/app/(console)` - auth-gated review
  - `src/lib/{validation,db,domain,matching,services,auth,api}`
- Writes use `getDirectPrisma()` (`DIRECT_URL`)
- Reads use `getPrisma()` (`DATABASE_URL`)
- State changes use `$transaction` with an `AuditLog` row
- Auth: Google only; access requires an active `InternalUser`
- Roles: `reviewer < approver(canApprove) < admin(canAdminister)`
- Services return discriminated unions and accept injectable `deps.prisma`
- Money uses `Prisma.Decimal` / decimal strings, never floats
- Platform margin: `1000` bps
- Quote expiry: 7 days
- Ticket 1: DONE, committed as `abf77d7`
- Ticket 5: implemented, tested, NOT committed
- Ticket 5 files:
  - `src/lib/services/internal-users.ts` (new)
  - `src/lib/services/internal-users.test.ts` (new)
  - `src/lib/validation/internal-user.ts` (modified)
- Verified locally:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test:run` - 77 tests / 13 files
- `pnpm build` not run
- `pnpm format:check` fails locally because `core.autocrlf=true` causes CRLF while Prettier expects LF
- Do NOT run `pnpm format --write`
- Do NOT run `pnpm db:seed` / `pnpm db:verify` without real DB credentials
- Local `.env` contains placeholder DB URLs and is gitignored
- `src/generated/prisma` is generated/gitignored
- Local Node is v22; package requires Node >=24 <25 and CI uses Node 24
- Repo style: zero source comments in `src/`; scripts log one summary line at the end

## 2. Codebase Overview

### Architecture

Single Next.js App Router application with server-side data access.

- Server Components read through Prisma directly.
- Mutations go through Server Actions (`"use server"`).
- The only API route is the NextAuth handler:
  `src/app/api/auth/[...nextauth]/route.ts`.

### Scope Boundary

Release A implements:

`requirement -> match -> quote -> human decision -> commitment`

and ends at a `pending_delivery` commitment.

Explicitly out of scope:

- Marketplace browsing
- Live provider inventory
- Provisioning
- Billing
- White-label

### Main Directories

| Path | Responsibility |
|---|---|
| `src/app/(marketing)/` | Public unauthenticated intake form and confirmation |
| `src/app/(console)/` | Auth-gated internal quote review |
| `src/app/(auth)/login/` | Login page |
| `src/lib/validation/` | Zod schemas; source of truth for input shape |
| `src/lib/db/client.ts` | Pooled read Prisma client and direct write Prisma client |
| `src/lib/db/mappers/` | Zod input to Prisma create-input builders |
| `src/lib/domain/` | Pure role and status-transition rules |
| `src/lib/matching/` | Matching, pricing, quote proposal |
| `src/lib/services/` | Transactional write services |
| `src/lib/auth/` | Internal-user lookup, actor resolution, login helpers |
| `src/lib/api/` | Thin Server Action wrappers |
| `src/lib/requirements/` | Form values, field errors, reference formatting |
| `prisma/` | Schema, migrations, seed, verification |
| `src/generated/prisma/` | Generated Prisma client; gitignored |

### Technologies

- Next.js 16.3.4
- React 19.2.8
- TypeScript 5
- Tailwind 4
- Prisma 7.10 with `@prisma/adapter-pg`
- NextAuth 5.0.0-beta.32
- Google provider
- JWT sessions
- Zod 4
- react-hook-form + `@hookform/resolvers`
- Vitest 5
- Playwright

`@tanstack/react-query` exists in `package.json` but no usage was found. Treat as unused until verified.

### Important Next.js Detail

`AGENTS.md` points to Next 16 documentation. Middleware lives at:

`src/proxy.ts`

and exports `proxy`, rather than using `middleware.ts`.

The statement that this is specifically a Next 16 rename is an inference; verify against the installed version/docs if needed.

## 3. Important Code Flows

### Public Intake

`src/app/(marketing)/quote/page.tsx`

renders:

`requirement-form.tsx`

using react-hook-form + Zod from:

`src/lib/requirements/form-values.ts`

Submit calls:

`submitRequirementAction`

in:

`src/lib/api/requirements.ts`

which calls:

`submitClientRequirement`

in:

`src/lib/services/requirements.ts`

and then synchronously:

`proposeQuoteForRequirement`

Matching failure is logged with `console.error`, but the user still receives a successful result.

Confirmation:

`/quote/confirmation/[id]`

### Matching

`proposeQuoteForRequirement`:

1. Loads the requirement.
2. Returns early if a quote already exists or status is not `submitted`.
3. Calls `prisma.gpuSupply.findMany()` with no filter.
4. Maps rows through `toMatchableSupply`.
5. Invalid supply rows become `null`.
6. Ranks valid supplies with `matchSupply`.
7. If no match:
   - requirement -> `no_match`
   - audit row created
8. If matched:
   - requirement -> `matched`
   - creates one `Quote`
   - creates one quote line item
   - creates two audit rows

The transaction uses:

- `maxWait: 15_000`
- `timeout: 20_000`

### Console Review

`src/proxy.ts` gates:

- `/quotes`
- `/quotes/:path*`

using NextAuth authorization.

`src/app/(console)/quotes/[requestId]/page.tsx`:

- is `force-dynamic`
- calls `requireConsoleActor()`
- redirects to `/login` when unauthenticated
- redirects to `/login?error=AccessDenied` without an active internal user
- validates request id with `isRequirementId`
- calls `getQuoteReview`

`getQuoteReview` re-runs matching on every page view to display candidate supply.

Decision UI appears only when:

- quote status is `pending_approval`
- actor satisfies `canApprove(actor.role)`

### Quote Decision

`quote-decision-form.tsx` calls:

`decideQuoteAction`

in:

`src/lib/api/quotes.ts`

The action:

1. Resolves actor server-side with `requireConsoleActor()`
2. Passes actor as a separate argument to `decideQuote`
3. Calls `revalidatePath`

Approve:

- quote -> `approved`
- creates `Commitment`
- creates two audit rows

Reject:

- quote -> `rejected`
- creates one audit row with rejection reason

### Authentication

`src/auth.ts`:

- `signIn` rejects unverified Google emails
- rejects emails without an active internal user
- `jwt` attaches `internalUserId` and `role` only when `canReview`
- `session` copies them to `session.user`
- no user is created at login

### Dependency Direction

`app/`
-> `lib/api`
-> `lib/services`
-> `lib/db`

with dependencies on:

- `lib/domain`
- `lib/matching`
- `lib/validation`

Pure/database-free areas:

- `lib/domain`
- `lib/matching/pricing`
- `lib/matching/matchSupply`
- `lib/validation`
- `lib/requirements/reference`
- `lib/requirements/field-errors`

## 4. Important Files

### `prisma/schema.prisma`

Models:

- `ClientRequirement`
- `GpuSupply`
- `Quote`
- `QuoteLineItem`
- `Commitment`
- `InternalUser`
- `AuditLog`

`InternalUser`:

- `email` is unique
- `role` defaults to `reviewer`
- `isActive` defaults to `true`
- index on `[role, isActive]`

`Quote.requirementId` and `Commitment.quoteId` are unique.

Money:

- `Decimal(18,2)`
- prices `Decimal(18,6)`
- timestamps `Timestamptz(3)`

### `prisma/seed-data.ts`

Exports:

`seedGpuSupplies` - 6 rows

and:

`seedInternalUsers` - 3 rows added by Ticket 1:

- `seed.admin@example.com` - id `...101`
- `seed.approver@example.com` - id `...102`
- `seed.reviewer@example.com` - id `...103`

All are active.

Uses:

`satisfies readonly InternalUserInput[]`

### `prisma/seed.ts`

- Upserts GPU supplies by `id`
- Upserts internal users by `email`
- Optional bootstrap admin from `INTERNAL_BOOTSTRAP_EMAIL`
- Bootstrap update sets `isActive: true`
- Does not change an existing role during bootstrap
- `bootstrapAdminEmail()` lowercases the variable
- Returns `null` when unset or colliding with fixture email
- One `console.info` at end
- Does not import `dotenv/config`

### `prisma/verify-data-foundation.ts`

Imports `dotenv/config`.

Ticket 1 verification checks:

- user count is 3
- all users active
- emails are lowercase
- email+role pairs match fixtures
- role set size equals `INTERNAL_ROLES.length`

It intentionally does not assert IDs or bootstrap row.

### `src/lib/validation/internal-user.ts`

Private schemas:

- `internalEmailSchema`
- `displayNameSchema`

Exported:

- `InternalUserInputSchema`
- `GrantInternalAccessCommandSchema`
- `SetInternalUserActiveCommandSchema`

`GrantInternalAccessCommandSchema`:

- email
- displayName?
- role
- actorRole
- no id

`SetInternalUserActiveCommandSchema`:

- id
- isActive
- actorRole

All use `strictObject`.

### `src/lib/services/internal-users.ts`

Ticket 5 implementation.

Functions:

- `grantInternalAccess(input, deps)`
- `setInternalUserActive(input, deps)`

Helpers:

- `isAdminActor`
- `isRecordNotFoundError`

Behavior:

1. Admin authorization gate
2. Safe input parsing
3. Direct write through `getDirectPrisma()`
4. Discriminated result

Grant:

- upserts by email
- creates using `mapInternalUserCreate`
- updates role
- reactivates user
- updates displayName when provided

### `src/lib/db/mappers/internal-user.ts`

Pre-existing.

`mapInternalUserCreate(input)`:

- validates with `InternalUserInputSchema`
- returns `Prisma.InternalUserUncheckedCreateInput`
- omits `id` and `displayName` when absent

### `src/lib/auth/internal-users.ts`

Contains:

- `normalizeEmail`
- `isApprovedInternalUser`
- `findActiveInternalUserByEmail`
- `resolveConsoleActor`

Ticket 5's deactivation test checks behavior through `isApprovedInternalUser`.

### `src/lib/domain/roles.ts`

Roles:

`reviewer`, `approver`, `admin`

Permissions:

- `canReview` -> all internal roles
- `canApprove` -> approver/admin
- `canAdminister` -> admin

### `src/lib/domain/statuses.ts`

Requirement:

`submitted -> matched | no_match`

Quote:

`pending_approval -> approved | rejected`

Commitment:

`pending_delivery`

### `src/lib/db/client.ts`

- `getPrisma()` -> `DATABASE_URL`
- `getDirectPrisma()` -> `DIRECT_URL`, falling back to `DATABASE_URL`
- cached on `globalThis` outside production
- throws if required variable is missing

### `src/lib/matching/pricing.ts`

- `PLATFORM_MARGIN_BPS = 1000`
- `QUOTE_EXPIRY_DAYS = 7`
- `billableHoursUtc`
- `priceQuote`
- `isWithinBudget`
- `quoteExpiresAt`

Uses `Prisma.Decimal`.

### `src/lib/matching/matchSupply.ts`

Eligibility:

- status `available`
- GPU model matches case-insensitively
- requirement GPU model `flexible` is wildcard
- region matches
- quantity sufficient
- availability window fully covers timeframe
- uptime meets requirement
- all `mustHaves` match supply metadata
- total within `budgetMaxUsd`

Ranking:

1. nice-to-have count descending
2. cheapest total
3. supply id for deterministic tie-breaking

### `src/lib/validation/money.ts`

- `DecimalStringSchema` <= 6 decimal places
- `UsdAmountSchema` <= 2 decimal places
- `compareDecimalStrings` uses `BigInt`
- no floating-point money

### `src/lib/requirements/reference.ts`

`formatRequirementReference`:

`REQ-` + first 8 hex chars, uppercased

`isRequirementId`:

UUID regex requiring version nibble `[1-8]` and variant `[89ab]`

### `src/lib/db/mappers/internal-records.ts`

Allowed audit entity types:

- `client_requirement`
- `quote`
- `commitment`

Allowed audit actions:

- `created`
- `status_changed`

Also contains:

- `buildAuditLogCreate`
- `buildCommitmentCreate`

This is why Ticket 5 currently has no audit logging: `internal_user` is not an allowed audit entity type.

## 5. Current Tickets

### Ticket 1 - Seed Internal Users

Status: COMPLETE / committed.

Commit:

`abf77d7 feat: seed internal users`

Files changed:

- `.env.example`
- `prisma/seed-data.ts`
- `prisma/seed.ts`
- `prisma/verify-data-foundation.ts`
- `src/lib/db/seed-data.test.ts`

Remaining acceptance verification requires a real database:

- `pnpm db:seed` twice without duplicates
- `pnpm db:verify` passes

### Ticket 5 - Grant / Deactivate Internal Users

Status: code complete, NOT committed.

Requirements:

- `grantInternalAccess({ email, role, displayName, actorRole })`
- lowercase email
- admin-only
- upsert by email
- `setInternalUserActive({ id, isActive })`
- admin-only
- writes via `getDirectPrisma()`
- no new audit entity types without Dagim's approval
- no user creation in NextAuth `signIn`

Tests cover:

- create
- same-email upsert
- reactivation
- non-admin refusal for reviewer/approver/public/empty role
- no-write assertions
- invalid email field errors
- `not_found`
- deactivation causing `isApprovedInternalUser` -> `false`

Remaining:

1. Commit Ticket 5
2. Decide audit logging with Dagim
3. No admin UI or Server Action is wired yet
4. Functions are currently callable only from scripts/future actions

## 6. Decisions and Reasoning

- Seed users upsert by `email`, not `id`, because email is unique and protects against duplicate-seed behavior when an existing row has a different id.
- Verification checks email+role rather than IDs because an existing row can legitimately retain its own id.
- Bootstrap admin update is `{ isActive: true }`; it does not promote an existing reviewer to admin.
- Bootstrap skips fixture-email collisions.
- `prisma/seed.ts` does not import `dotenv/config`; Prisma CLI config handles environment loading.
- `verify-data-foundation.ts` imports `dotenv/config` because it is executed directly with `tsx`.
- `INTERNAL_BOOTSTRAP_EMAIL` belongs in `.env`, not `.env.local`, for this setup.
- Ticket 5 retains the single-object signature with `actorRole` inside the payload.
- Authorization is extracted before strict validation so forbidden is returned before field-level validation to non-admin callers.
- `setInternalUserActive` requires admin even though the ticket did not explicitly state this; deactivation is treated as privileged.
- Grant cannot set an id.
- Seed fixtures use `@example.com` and generic names to avoid real staff identities.
- Existing `@tatari.test` convention was intentionally deferred.
- Do not unnecessarily change:
  - GPU seed id-keyed upsert
  - audit entity allowlist
  - `deps.prisma` injection
  - pooled-read/direct-write split
  - decimal money handling
  - `src/proxy.ts` matcher

## 7. Current State

Verified locally:

- `pnpm typecheck` - clean
- `pnpm lint` - clean
- `pnpm test:run` - 77 tests / 13 files passing

Not run:

- `pnpm build`
- `pnpm test:e2e`
- `pnpm db:seed`
- `pnpm db:verify`
- `pnpm db:migrate:deploy`

### Formatting

`pnpm format:check` fails locally because:

`git config core.autocrlf = true`

causes CRLF in the working tree while Prettier expects LF.

It reports 80 files, including untouched files.

Do not run:

`pnpm format --write`

because it would rewrite the whole tree and create a large diff.

### Environment

- Node: v22 locally
- package engine: `>=24 <25`
- CI: Node 24
- `node_modules` was missing and took 13m44s to install
- `src/generated/prisma` must exist for typecheck/tests
- no Docker
- no local Postgres
- placeholder `.env` was created locally
- replace placeholder DB credentials before database commands

Uncommitted:

- `src/lib/services/internal-users.ts`
- `src/lib/services/internal-users.test.ts`
- `src/lib/validation/internal-user.ts`
- `docs/internal-users-changes.md`

No known bugs in Ticket 5 code as written.

## 8. Important Discoveries

- Vitest collects only `src/**/*.test.ts`.
- Therefore seed tests live under `src/`, not `prisma/`.
- Existing `src/lib/auth/internal-users.test.ts` has a seed fixture:
  `reviewer@tatari.test`
  with id `00000000-0000-4000-8000-000000000101`
  and display name `"Seed Reviewer"`.
- This conflicts with committed Ticket 1 fixture conventions and was intentionally deferred.
- Service dependencies are structurally typed minimal writer objects.
- Tests use `prisma: prisma as never`.
- `$transaction([...])` fakes require the `lazy()` helper used in other service tests.
- CI runs on Node 24 and sets only a localhost `DIRECT_URL`.
- CI order:
  `db:validate -> db:generate -> format:check -> lint -> typecheck -> test:run -> build`
- `getQuoteReview` and `proposeQuoteForRequirement` both call unfiltered `gpuSupply.findMany()`.
- Requirement submission runs matching inline and swallows matching failure after logging.
- Zod 4 top-level helpers such as `z.email()`, `z.url()`, `z.uuid()`, `z.iso.datetime()`, and `z.int()` are the repository idiom.
- README links to:
  - `docs/release-a-decisions.md`
  - `docs/tatari-technical-agent-context.md`
  but neither exists.
- `AGENTS.md` is regenerated by `next dev`.

## 9. Unresolved Questions

1. Ticket 1 database acceptance checks remain undemonstrated.
2. Audit logging for internal-user grant/deactivation is blocked on Dagim's approval.
3. Email/domain fixture inconsistency:
   - committed fixtures use `@example.com`
   - existing test fixture uses `@tatari.test`
   - id assignments also differ
4. Whether `grantInternalAccess` should allow role demotion is unconfirmed.
5. `@tanstack/react-query` appears unused; verify before assuming a client-fetching pattern.
6. No caller currently exists for Ticket 5 functions.
7. Any future Server Action must obtain `actorRole` from `requireConsoleActor()` server-side, never from client input.
8. Bootstrap admin deactivation/reactivation behavior should be confirmed with the team.
9. `pnpm build` has not been run locally.

## 10. Development Guidelines

### Comments

There are zero `//` comments in `src/`.

Do not add explanatory source comments. Prefer clear naming.

### Scripts

Scripts log exactly one summary line at the end.

### Services

Use:

- `safeParse`
- discriminated result unions
- `{ ok: true, ... }`
- `{ ok: false, error: "...", formError: "...", fieldErrors?: ... }`

Authorization is checked before validation.

Convert known Prisma errors:

- `P2002` -> `conflict`
- `P2025` -> `not_found`

Unexpected errors:

- `console.error("Failed to …", error)`
- return a `server` result

Services should not throw to callers.

### Dependency Injection

Services accept `deps` with optional injectable values such as:

- `prisma`
- `now`
- `id`
- `quoteId`
- `commitmentId`

This keeps tests database-free and deterministic.

### Validation

- Zod `strictObject`
- cross-field rules with `.superRefine`
- shared field schemas as module-private constants
- input types via `z.input`
- output types via `z.infer` / `z.output`
- normalization happens in schemas

### Money

Use:

- `Prisma.Decimal`
- decimal strings
- `compareDecimalStrings`

Never use floating-point money calculations.

Formatting:

- USD -> `toFixed(2)`
- hourly prices -> `toFixed(6)`

### Purity

Keep:

- `domain/`
- `matching/pricing`
- `matching/matchSupply`

database-free.

Follow the pure-helper + inline-I/O pattern.

### Transactions and Audit

State changes normally use:

`$transaction([...], { maxWait: 15_000, timeout: 20_000 })`

with an audit row.

Use:

- `canTransitionRequirement`
- `canTransitionQuote`

where appropriate.

Ticket 5 is currently the exception because `internal_user` is not an allowed audit entity type and audit behavior requires team approval.

### Naming

- Files: kebab-case
- Exceptions: `matchSupply.ts`, `proposeQuote.ts`
- Functions: verb-first
  - `mapXCreate`
  - `buildXCreate`
  - `canX`
  - `isX`
  - `getX`
  - `requireX`
  - `toX`
- Result types: `<Verb>Result`
- Roles/statuses: snake_case strings backed by `as const`

### Testing

Vitest:

- `environment: "node"`
- `clearMocks`
- `restoreMocks`
- only `src/**/*.test.ts` collected

Use:

- hand-rolled `vi.fn()` fakes
- no mocking libraries/database
- `lazy()` for array-form transaction fakes
- `prisma: prisma as never`
- fixed UUID-shaped constants
- whole-result `toEqual`
- `toMatchObject({ ok: false, error: "..." })`
- `not.toHaveBeenCalled()` for no-write assertions

### Formatting

Prettier:

- print width 80
- double quotes
- semicolons
- trailing commas

Long template literals may exceed 80.

Observed import order:

1. Node builtins
2. external packages
3. `@/` internal
4. relative imports

Import grouping is observed, not confirmed as lint-enforced.

### Commands

Common:

```bash
pnpm typecheck
pnpm lint
pnpm test:run
pnpm format:check
pnpm build