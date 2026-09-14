# Tatari Release A — Build Summary

This document summarizes the implementation currently present in the repository.

## Product foundation

The project is structured around Tatari's internal quote-to-commit workflow:

```text
requirement → match → quote → human decision → commitment
```

The implemented work currently covers the application foundation, shared domain validation, and persistent data layer.

## Application stack

- Next.js 16.3.4 with the App Router
- React 19.2.8
- TypeScript 5.9 in strict mode
- Tailwind CSS 4
- pnpm 10
- Node.js 24 LTS as the supported runtime
- Zod 4 for runtime validation
- Prisma 7.10 with PostgreSQL
- Neon PostgreSQL for the development database
- Vitest 5 for unit tests
- Playwright configured for browser testing
- ESLint and Prettier for code quality

## Domain validation

Shared Zod schemas define and validate the main business inputs:

- Client requirements
- GPU supply records
- Quote creation commands and line-item snapshots
- Quote approval and rejection commands
- Requirement, quote, and commitment statuses
- Decimal-string money values

Validation includes:

- End dates must occur after start dates.
- Minimum budgets cannot exceed maximum budgets.
- Monetary values use decimal strings instead of JavaScript floating-point numbers.
- GPU quantities and uptime values have valid limits.
- Required criteria and preferred criteria remain separate.
- The same criterion cannot be both required and preferred.
- Unknown input fields are rejected.
- Rejections require a reason.

Workflow status transitions are centralized in the domain layer:

- Requirements: `submitted → matched | no_match`
- Quotes: `pending_approval → approved | rejected`
- Commitments: `pending_delivery`

## Database foundation

Prisma is configured for Neon PostgreSQL with:

- `DATABASE_URL` for pooled application queries
- `DIRECT_URL` for direct schema migrations
- A generated Prisma client under `src/generated/prisma`
- A development singleton database client using `@prisma/adapter-pg`
- Database scripts for formatting, validation, generation, migration, seeding, status checks, Studio, and verification

The initial migration has been applied successfully to the Neon development database.

### Database models

Seven Prisma models are implemented:

1. **ClientRequirement** — contact information, requested GPU configuration, timeframe, region, budget, SLA, criteria, status, and timestamps.
2. **GpuSupply** — vendor, GPU model, quantity, region, hourly price, uptime, availability window, provenance, test-data marker, status, metadata, and timestamps.
3. **Quote** — one quote per requirement, approval status, total estimated cost, expiration, timestamps, line items, and optional commitment.
4. **QuoteLineItem** — immutable commercial snapshots containing supply, vendor, GPU, region, quantity, price, hours, margin, SLA, and calculated totals.
5. **Commitment** — a one-to-one quote commitment with a database-enforced unique `quoteId` and `pending_delivery` status.
6. **InternalUser** — unique email, display name, role, active status, and timestamps.
7. **AuditLog** — entity lifecycle events with entity identifiers, actions, trusted actors, before/after statuses, metadata, and timestamps.

The schema includes PostgreSQL decimal columns for money, JSON fields for structured criteria and metadata, foreign keys, uniqueness constraints, and query indexes.

## Data boundary mappings

Focused mapping functions convert validated Zod output into Prisma create inputs for:

- Client requirements
- GPU supply
- Quotes and nested quote line items
- Commitments
- Audit-log entries

These mappings:

- Convert validated decimal strings to Prisma Decimal values.
- Preserve normalized dates and structured JSON.
- Calculate quote totals using decimal arithmetic.
- Assign server-owned initial statuses.
- Prevent public requirement input from setting lifecycle statuses.
- Keep commitment and audit creation as internal operations.

## Deterministic development data

The database seed uses stable UUIDs and idempotent upserts. Running it repeatedly updates the same six records without creating duplicates.

The six GPU supply records cover:

- Matching H100 supply in Europe
- H100 supply in the wrong region
- Less expensive A100 supply
- H100 supply with insufficient quantity
- H100 supply outside the requested availability window
- H100 supply marked unavailable

Every seeded supply is clearly marked with:

```text
sourceType = "seed"
isTestData = true
```

No customer requirements, quotes, commitments, real vendor credentials, or live inventory are included in the seed.

## Database verification

A read-only verification script confirms:

- All six expected supply records exist.
- Stable IDs match the deterministic seed.
- Every record is marked as seed/test data.
- Quantities and hourly prices are positive.

The migration was applied successfully, migration status reported the schema as current, the seed was run twice successfully, and all data invariants passed.

## Automated quality checks

The repository currently passes:

- Prettier formatting validation
- ESLint
- TypeScript type-checking
- 31 Vitest unit tests across four test files
- Prisma schema validation and client generation
- Frozen-lockfile dependency installation
- Next.js production build

GitHub Actions runs Prisma validation/client generation, formatting, linting, type-checking, unit tests, and the production build using Node.js 24.

## Current implementation boundary

The repository currently contains the technical foundation, validated domain contracts, Neon database schema, migration, deterministic seed data, database client, and boundary mappings. The user-facing intake and internal workflow screens are not part of the current implementation.
