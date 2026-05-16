# FounderPet — Market-Ready Architecture

Status: Phase 2 patch integrated 2026-05-16. Branch `market-ready-cli-integration`.

> Tip: the original ChatGPT-produced patch notes live in `docs/MARKET_READY_PHASE2.md`. This document is the canonical, repo-anchored version and adds what was implemented beyond the zip.

## TL;DR

FounderPet now ingests events from multiple sources, dedupes them, discounts unverified manual revenue, scores trust, and emits a compact payload that Apple Watch can poll every minute. The leaderboard is no longer mock jitter — it is derived from stored events.

## Why Phase 2

Phase 1 demo issues:

- Pet level could be farmed with fake manual revenue.
- Leaderboard was random jitter, not real.
- No idempotency: a webhook re-delivery double-counted revenue.
- No Apple Watch-friendly endpoint.
- No way to explain "why did my pet grow today?"

Phase 2 fixes all of the above without removing anything Phase 1 already worked.

## Event model

```
FounderEvent
├── id            stable per (user + source + externalId) when available
├── userId
├── kind          task_done | task_blocked | approval | revenue | lead | views
│                 | github_commit | published_content | agent_run
│                 | integration_connected
├── source        stripe | github | gumroad | polar | lemon_squeezy | paypal
│                 | claude | codex | n8n | manual | api | ...
├── value         numeric, non-negative
├── currency?     optional (USD by default for revenue)
├── verified?     true for HMAC-verified webhook sources
├── confidence?   0..1, used for manual sources
├── externalId?   for idempotency (Stripe event id, GitHub delivery id, etc.)
├── occurredAt    Date or ISO string
└── metadata?     free-form
```

EXP per kind (preserved from Phase 1, adjusted by source + verification):

| Kind                | Base                  | Adjustment                                                               |
|---------------------|-----------------------|--------------------------------------------------------------------------|
| task_done           | +10                   | -                                                                        |
| approval (low/med)  | +5                    | -                                                                        |
| approval (high)     | +15                   | -                                                                        |
| approval (critical) | +30                   | -                                                                        |
| revenue             | min(value, 500)       | x 1.0 if verified; x 0.4875 if manual (confidence 0.65 x manual penalty) |
| lead                | value x 3             | x confidence                                                             |
| views               | floor(value / 100)    | -                                                                        |
| github_commit       | value x 2             | -                                                                        |
| published_content   | value x 20            | x confidence                                                             |
| agent_run           | +1 per run            | daily cap 80                                                             |

Per-day caps (anti-spam):

```
task_done           200
approval            180
revenue           1,000
lead                300
views               120
github_commit       200
published_content   240
agent_run            80
```

Stages preserved exactly:

```
Egg     0 - 99
Chick 100 - 299
Bird  300 - 699
Eagle 700 - 1199
Griffin 1200 - 1999
Dragon 2000+
```

## API surface

### POST /api/events

Unified ingestion. Optional `x-founderpet-secret` if `FOUNDERPET_INGEST_SECRET` is set. Optional `x-idempotency-key`.

```bash
curl -X POST http://localhost:3000/api/events \
  -H 'Content-Type: application/json' \
  -H 'x-founderpet-secret: $FOUNDERPET_INGEST_SECRET' \
  -H 'x-idempotency-key: pi_123' \
  -d '{
    "userId":"demo",
    "kind":"revenue",
    "source":"stripe",
    "value":49,
    "currency":"USD",
    "verified":true,
    "metadata":{"product":"FounderPet Early Access"}
  }'
```

Response: `{ ok, duplicate, event, pet, profile }`.

### GET /api/events?userId=demo&limit=20

Recent events for a user.

### GET /api/pet?userId=demo

Full snapshot for the web dashboard.

### POST /api/pet

Legacy/manual event recording. Same engine path as `/api/events`.

### GET /api/watch?userId=demo

Compact payload for Apple Watch polling:

```json
{
  "version": 1,
  "userId": "demo",
  "handle": "duct-tape2",
  "updatedAt": "2026-05-16T...",
  "pet": { "stage": "...", "mood": "...", "level": ..., "exp": ..., "progressToNextStage": ..., "progressToNextLevel": ... },
  "pulse": { "headline": "...", "nextAction": "...", "trustScore": ..., "buildScore": ..., "outcomeScore": ..., "momentumScore": ..., "launchReadiness": ..., "riskCount": ... },
  "today": { "revenue": ..., "verifiedRevenue": ..., "tasksDone": ..., "commits": ..., "agentRuns": ..., "leads": ... },
  "complication": { "corner": "L3", "center": "FOCUSED", "footer": "...", "ringPercent": ... },
  "recent": [ ... ]
}
```

### GET /api/leaderboard?limit=10

Trust-weighted, event-derived. No more synthetic jitter.

### POST /api/webhook/stripe

HMAC verified. Stripe `event.id` is the idempotency key. `metadata.founderpet_user_id` maps the payment to a founder.

### POST /api/webhook/github

`X-Hub-Signature-256` verified. Push events become `github_commit` events; PR merges become `published_content`. GitHub delivery id is the idempotency key.

## Trust score

```
trustScore = clamp(
  25
  + verifiedRevenueScore (log-scaled, max 30)
  + sourceDiversity      (5 per source, max 20)
  + externalIdCoverage   (max 20)
  + verifiedCoverage     (max 25)
  - manualDominancePenalty (max 25)
)
```

`leaderboardScore = exp * (0.55 + trustScore/200) + verifiedRevenue * 4 + streakDays * 25 + businessHealthScore * 3`

This means: fake manual revenue cannot dominate. The pet's stage still climbs slowly with manual events, but the leaderboard rank does not.

## Env vars

Required for production:

- `FOUNDERPET_INGEST_SECRET` — gate for `/api/events`, `/api/pet` POST
- `STRIPE_WEBHOOK_SECRET` — Stripe HMAC verification
- `GITHUB_WEBHOOK_SECRET` — GitHub HMAC SHA256 verification

Persistence (optional; demo mode if missing):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## Demo mode vs production mode

Without Supabase env vars: an in-memory event store seeds `demo` with five sample events so the UI renders without setup. The `Leaderboard` component shows a clearly-labeled `fallback` state if `/api/leaderboard` fails.

With Supabase env vars: all events persist; idempotency is enforced at the DB level by a unique index on `(user_id, source, external_id)`.

## Supabase setup

Run `supabase/002_market_ready_events.sql` in the SQL editor. It creates:

- `founder_profiles` (id, handle, display_name, project_name, avatar_emoji, timestamps)
- `founder_events` (id, user_id FK, kind enum check, source, value, verified, confidence, external_id, occurred_at, metadata, created_at)
- Unique index `founder_events_source_external_id_idx` on `(user_id, source, external_id) where external_id is not null`
- `founder_event_rollup_v1` view for fast leaderboard reads
- RLS: profiles + events publicly readable; writes require service role

## Local dev

```bash
npm install
npm test           # vitest, 26 tests
npm run typecheck  # tsc --noEmit
npm run dev        # http://localhost:3000
npm run build      # production build verify
```

## Deploy checklist

- [ ] Supabase project + run SQL migration
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` on Vercel
- [ ] Set `FOUNDERPET_INGEST_SECRET` on Vercel (long random)
- [ ] Set `STRIPE_WEBHOOK_SECRET` on Vercel
- [ ] Set `GITHUB_WEBHOOK_SECRET` on Vercel
- [ ] Stripe webhook endpoint: `https://<host>/api/webhook/stripe` (events: `payment_intent.succeeded`, `checkout.session.completed`, `invoice.paid`, `charge.succeeded`)
- [ ] GitHub webhook endpoint: `https://<host>/api/webhook/github` (events: `push`, optional `pull_request`)
- [ ] Sanity check `GET /api/watch?userId=demo` returns valid JSON
- [ ] (Optional) Apple Watch app: point `WorkPetAPIClient.baseURL` at the production host. See `docs/workpet-integration.md`.

## Known limitations

- The home page button list still operates on an in-memory client array. Switching it to call `/api/events` is a 10-line change once auth is in place.
- The `RevenueIntegrations` component is informational; it does not yet OAuth-connect Gumroad, Polar, Lemon Squeezy.
- Apple Watch native app is read-only; recording events back to FounderPet from Watch is not yet wired.
- No rate limiting on `/api/events` beyond `FOUNDERPET_INGEST_SECRET`. Add Vercel/Upstash rate limit before public scale.
