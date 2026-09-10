# Tatari 1.5 / Compute Platform — Product Context

Source: Software Development Intern posting (Tatari 1.5 / White-Label). This is how the company describes the product to candidates. Treat as product intent, not a live SLA.

## What it is

Asset-light GPU compute. Tatari sells GPU time across many providers and wraps it in one console: pick a region, pick a GPU, launch a job or Jupyter notebook. Matching finds the cheapest reliable GPU near the user’s data and keeps watch so the job does not drop. The same console can run under a partner’s brand (logo, colors, domain).

**Who it is for:** AI startups and research labs.

**Pain:** Hyperscalers are expensive; cheap spots kill jobs mid-run.

## How it is drawn (FIG. 01)

| Layer | What |
| --- | --- |
| Who uses it | AI startups & labs |
| You build this | Branded console — pick a GPU, launch a job |
| Tatari engine | Match & monitor — cheapest reliable GPU |
| GPU supply | RunPod · Vast.ai · colo / cloud |

Interns (and the frontend brief) sit on the console. They connect UI to APIs that talk to providers. They do not run data centers.

## Four layers (FIG. 02)

1. **Console** — dashboard, branded UI, API access ← where product/eng intern work lives
2. **Matching & scheduling** — right GPU, right region, usage tracking
3. **Infrastructure** — power, cooling, greener / renewable-backed DCs
4. **Compute** — GPU clusters running jobs across regions

## What “you’ll work on” maps to the product

- **Console:** choose GPU, region, one-click job or Jupyter
- **Brandable:** partner logo, colors, and domain swap without forking the app
- **Front-end ↔ APIs** that talk to GPU providers
- **Glue:** job status, live cost and usage, logs, account settings

Team label in the posting: Tatari 1.5 / White-Label. Stack: front-end + light back-end.

## How this should change our working model

1. 1.5 is an aggregator + matcher + branded console, not “Tatari owns the H100s.” Supply named in the posting is RunPod, Vast.ai, colo/cloud.
2. “Real uptime promises” and “job doesn’t drop” are product claims on top of mixed supply. Frontend should show status, cost, and reliability honestly; do not invent the matching/uptime contract.
3. White-label includes domain, not only colors. Still split theme tokens in v1 vs CNAME/admin unless product says otherwise.
4. Live cost/usage is in the intern scope, which supports treating the pricing grid as a first-class live surface — still wire mock/staging to the real message shape if the engine is late.

Apply path in the posting: info@tatari.systems. Deadline listed: July 10, 2026.
