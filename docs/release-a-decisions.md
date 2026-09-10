# Release A — Approved Working Decisions

Status: approved working defaults for the Internal Quote-to-Commit Workflow.

These decisions govern Release A implementation. Commercial values such as platform margin must receive product approval before any quote is represented as a real customer offer.

## Scope

Release A implements only:

```text
requirement submission
→ persistence
→ deterministic supply matching
→ quote creation
→ authenticated human approval or rejection
→ commitment creation
```

The release ends at `Commitment.status = "pending_delivery"`.

Explicitly excluded:

- Public GPU marketplace browsing
- Live RunPod or Vast.ai inventory and pricing
- GPU provisioning and job execution
- Billing and payment collection
- White-label theming, partner administration, and CNAME management
- Machine-learning matching

## Requirement contract

Collect these customer fields:

- `contactName`
- `contactEmail`
- `companyName`
- `companyWebsite` (optional)

Collect these compute fields:

- `workloadType`: `ai_training`, `fine_tuning`, `inference`, `research`, or `other`
- `gpuModel`: an explicitly requested model or `flexible`
- `quantity`
- `region`
- `timeframeStart`
- `timeframeEnd`
- `budgetMinUsd` (optional)
- `budgetMaxUsd`
- `minimumUptimeBps`
- `mustHaves`
- `niceToHaves`
- `additionalNotes` (optional)

Matcher-critical information must remain structured. Region, quantity, dates, uptime, and budget must not be hidden in free text.

Persist timestamps in UTC. Accept ISO 8601 timestamps carrying either `Z` or an explicit offset, then normalize them at the persistence boundary.

## SLA representation

Store minimum uptime as integer basis points:

- `9500` = 95%
- `9900` = 99%
- `9990` = 99.9%

Optional `slaNotes` may capture requirements that are not yet machine-matchable. Uptime is a customer requirement compared with supplier claims; it is not a Tatari uptime guarantee.

## Supply

Release A reads normalized `GpuSupply` records from PostgreSQL.

- Local and test environments use deterministic seeded records.
- Staging demonstrations use records clearly labelled as test data.
- Initial production operations may use manually verified or imported records.
- Automated provider API integrations are deferred.

Supply provenance fields include:

- `sourceType`: `seed` or `manual`
- `isTestData`
- `sourceReference` (optional)
- `lastVerifiedAt` (optional)

Do not create a deep `VendorResponse` model in Release A. Future provider responses will be normalized into `GpuSupply` through an adapter or import process.

## Quote shape

One `Quote` represents one proposed commercial offer. It owns one or more immutable `QuoteLineItem` snapshots, but the initial matcher creates one line item from the best eligible supply record.

Candidate matches may be displayed internally without becoming quote alternatives. Approval applies to one unambiguous offer, and one approved quote may create exactly one commitment.

## Cost calculation

Provisional technical formula:

```text
supplier subtotal = hourly price × quantity × billable hours
platform fee       = supplier subtotal × margin basis points
estimated total    = supplier subtotal + platform fee
```

Rules:

- Currency is USD.
- Duration is calculated in UTC.
- Billable duration rounds up to the next whole hour.
- Money enters application boundaries as decimal strings and is stored using decimal-safe database types.
- Platform margin is explicit basis points, never an invisible floating-point adjustment.
- Taxes, storage, network egress, and setup fees are excluded unless deliberately added as separate line items.
- Quote expiry defaults to seven days.

Store the calculation inputs on quote line items so a quote remains reproducible. Product must approve margin and commercial terms before real customer use.

## Authentication and authorization

Use Auth.js with the organization-approved OAuth/OIDC provider. Google OAuth is the preferred default when Tatari Workspace accounts are available.

An email-domain check alone is insufficient. Internal users and their roles must be approved in PostgreSQL.

Roles:

- `public`: submit requirements
- `reviewer`: view requirements, matches, and quotes
- `approver`: reviewer access plus approve/reject
- `admin`: approver access plus internal user and supply management

All authorization runs server-side. Audit `actorId` comes from the trusted session, never from request input.

## Audit convention

Entity creation uses:

```text
beforeStatus = null
afterStatus  = initial status
```

Public submissions may have `actorId = null`; customer identity remains on the requirement and must not be fabricated as an authenticated audit actor.

## Status language

Centralized requirement states:

- `submitted`
- `matched`
- `no_match`

Centralized quote states:

- `pending_approval`
- `approved`
- `rejected`

Centralized commitment state:

- `pending_delivery`

A requirement is created directly as `submitted`; no separate `created` status is needed.

## Platform defaults

- Application deployment: Vercel
- Managed PostgreSQL: Neon with pooled application connections
- Environments: development, test, staging, and production remain isolated
- UI-owned mutations: Server Actions
- Stable external HTTP endpoints: deferred until an integration requires them
- Business logic: service functions called by server entry points

## Submission confirmation

After a valid public submission, show:

- A human-readable request reference
- Submission timestamp
- Short request summary
- A statement that Tatari will review the request
- A contact path for corrections

Do not promise a match, quote, price, or response time. Email confirmation is deferred and does not block Release A.
