# FounderPet Phase 2 — Market-ready upgrade

This patch focuses on the parts that make FounderPet credible outside a demo:

1. **Trust-weighted growth engine**
   - Keeps the original egg → chick → bird → eagle → griffin → dragon fantasy path.
   - Adds idempotent event ingestion using `source + externalId`.
   - Adds daily EXP caps so agent-run or commit spam cannot farm the leaderboard forever.
   - Discounts manual revenue in EXP/trust, while verified Stripe/GitHub-style events get full credit.
   - Returns `businessPulse`, `trustScore`, `streakDays`, `leaderboardScore`, and `nextBestAction`.

2. **Unified event API**
   - `POST /api/events` accepts all FounderPet signal types.
   - `POST /api/pet` remains backward compatible with old manual event calls.
   - Optional `FOUNDERPET_INGEST_SECRET` protects ingestion in production.
   - `x-idempotency-key` prevents duplicate webhook deliveries from double-counting.

3. **Apple Watch-ready endpoint**
   - `GET /api/watch?userId=demo` returns compact JSON for complication/glance UI.
   - Includes level, mood, stage, ring progress, headline, and one next action.

4. **Real leaderboard path**
   - `GET /api/leaderboard` now returns trust-weighted rows from stored events.
   - The `Leaderboard` component fetches this API instead of simulating fake jitter.

5. **Launch UX components**
   - `BusinessPulse` shows build/outcome/momentum/readiness.
   - `LaunchChecklist` makes missing production setup obvious.
   - `EventFeed` explains why EXP changed and shows verified/capped/idempotent signals.
   - `WatchGlance` previews the watch experience without requiring the native app yet.

6. **Supabase production schema**
   - `supabase/002_market_ready_events.sql` adds profiles, events, idempotency index, RLS, and a rollup view.
   - The app uses Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
   - Without Supabase, it falls back to an in-memory demo so local dev still works.

## Apply

```bash
unzip founderpet_market_ready_patch.zip
cd founderpet_market_ready_patch
./scripts/apply_market_ready_patch.sh /path/to/founderpet
cd /path/to/founderpet
npm test
npm run build
```

## API examples

```bash
curl -X POST http://localhost:3000/api/events \
  -H 'Content-Type: application/json' \
  -H 'x-founderpet-secret: change_me_long_random_secret' \
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

```bash
curl 'http://localhost:3000/api/watch?userId=demo'
curl 'http://localhost:3000/api/leaderboard?limit=10'
```

## Event kinds

- `task_started`
- `task_done`
- `task_blocked`
- `approval`
- `revenue`
- `lead`
- `views`
- `github_commit`
- `published_content`
- `agent_run`
- `integration_connected`

## Production notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Do not expose it to client components.
- Set `FOUNDERPET_INGEST_SECRET` on Vercel before allowing external API writes.
- Keep Stripe/GitHub webhook HMAC verification; route verified webhooks into `recordFounderEvent()` with a stable `externalId`.
- Public leaderboard should always show `trustScore` so users understand why fake manual revenue does not dominate.
