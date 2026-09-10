# Tatari Release A

Foundation for Tatari's Internal Quote-to-Commit Workflow:

```text
requirement → match → quote → human decision → commitment
```

Release A ends at a `pending_delivery` commitment. Marketplace browsing, live
provider inventory, provisioning, billing, and white-label features are outside
this release.

See:

- `docs/release-a-decisions.md` for approved working decisions
- `docs/tatari-technical-agent-context.md` for full product and engineering context

## Requirements

- Node.js 24 LTS
- pnpm 10

## Local setup

```bash
npm install --global pnpm@10
pnpm install
pnpm dev
```

If pnpm is not installed globally:

```bash
npx pnpm@10 install
npx pnpm@10 dev
```

Copy the environment template before configuring database or authentication
work:

```bash
cp .env.example .env.local
```

Never commit `.env.local`.

## Quality commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

Run browser tests later, after an end-to-end workflow exists:

```bash
pnpm test:e2e
```
