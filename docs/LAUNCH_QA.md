# FounderPet — Launch QA Checklist

> Run before flipping the public switch. Two passes: automated and manual UI.

## A. Automated (must all pass)

```bash
cd /Users/ijeong-geun/founderpet
npm test           # 26/26 expected
npm run typecheck  # clean expected
npm run build      # 10 routes generated expected (incl. /api/health)
```

Live (replace `$HOST` with prod or local):

```bash
HOST=http://localhost:3000   # or https://<vercel-host>

# /
curl -o /dev/null -s -w "%{http_code}\n" "$HOST/"
# /leaderboard
curl -o /dev/null -s -w "%{http_code}\n" "$HOST/leaderboard"
# /u/duct-tape2 (public profile)
curl -o /dev/null -s -w "%{http_code}\n" "$HOST/u/duct-tape2"
# /api/watch — spec-shape sanity
curl -s "$HOST/api/watch?userId=demo" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['version']==1 and 'level' in d and 'businessPulse' in d and {'build','outcome','momentum','launchReadiness'}<=set(d['businessPulse']); print('watch OK')"
# /api/pet
curl -o /dev/null -s -w "%{http_code}\n" "$HOST/api/pet?userId=demo"
# /api/leaderboard
curl -o /dev/null -s -w "%{http_code}\n" "$HOST/api/leaderboard"
# /api/events (GET)
curl -o /dev/null -s -w "%{http_code}\n" "$HOST/api/events?userId=demo&limit=5"
# /api/health (mode + integrations)
curl -s "$HOST/api/health" | python3 -c "import sys,json; d=json.load(sys.stdin); print('health:', d['ok'], 'mode:', d['mode'], 'integrations:', d['integrations'])"

# POST /api/events idempotency
KEY=qa_$(date +%s)
curl -s -X POST "$HOST/api/events" -H 'Content-Type: application/json' -H "x-idempotency-key: $KEY" \
  -d '{"userId":"demo","kind":"revenue","source":"stripe","value":49,"verified":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('first:', d['duplicate'], d['pet']['exp'])"
curl -s -X POST "$HOST/api/events" -H 'Content-Type: application/json' -H "x-idempotency-key: $KEY" \
  -d '{"userId":"demo","kind":"revenue","source":"stripe","value":49,"verified":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('second:', d['duplicate'], d['pet']['exp'])"
# expect: first: False <n> ; second: True <n>   (exp unchanged)
```

Pass criteria:

- [ ] `npm test` 26/26
- [ ] `npm run typecheck` no errors
- [ ] `npm run build` 9 routes (no missing pages)
- [ ] `/` → 200
- [ ] `/leaderboard` → 200
- [ ] `/u/duct-tape2` → 200
- [ ] `/api/watch?userId=demo` → 200 and payload contains all spec keys
- [ ] `/api/pet?userId=demo` → 200
- [ ] `/api/leaderboard` → 200 and `scoring` field present
- [ ] `/api/events` GET → 200
- [ ] `/api/events` POST first call → `duplicate:false`, second with same key → `duplicate:true`, exp unchanged

## B. Trust + anti-gaming behavior

- [ ] Manual revenue $100 (`source:"manual"`, `verified:false`) → `awardedExp == 49` (0.4875× discount)
- [ ] Verified Stripe $100 (`source:"stripe"`, `verified:true`) → `awardedExp == 100`
- [ ] 120 consecutive `agent_run` events same day → daily cap 80 EXP, `capped:true` on impacts past the cap
- [ ] Blocked task event → `mood:"blocked"` regardless of revenue
- [ ] Brand new user with zero events → `mood:"tired"` (NOT `hungry`)
- [ ] Manual-only user has lower `trustScore` than verified-only user with same EXP

(Automated equivalents live in `src/lib/pet-engine.market.test.ts`.)

## C. Manual UI sweep

Desktop browser (1280px wide):

- [ ] `/` 3D pet visible, stage matches snapshot
- [ ] Level / Stage / Mood / EXP tiles populate
- [ ] BusinessPulse: build / outcome / momentum / launchReadiness gauges all show numeric values
- [ ] Next Best Action visible and in Korean
- [ ] EventFeed shows recent events with verified / capped badges where applicable
- [ ] WatchGlance preview shows Apple Watch frame with ring, headline, next action
- [ ] LaunchChecklist shows X/5 with item statuses
- [ ] Leaderboard shows verified revenue + trustScore + score, no random jitter
- [ ] RevenueIntegrations shows 8 providers (Stripe / Gumroad / Polar / Lemon / PayPal / Toss / Sponsors / Manual)
- [ ] Bottom viral line: "애플워치 집에서 놀리지 말고 여기다 활용해서 돈 벌어보세요" present
- [ ] No console errors

Mobile (375px wide, devtools):

- [ ] 3D canvas height ~400px, no layout overflow
- [ ] All cards stack into single column
- [ ] Sparkles + stars reduced (perf), no jank
- [ ] Touch-rotate works on 3D pet

Public profile `/u/duct-tape2`:

- [ ] Header shows `@duct-tape2`, stage, level
- [ ] Public Proof badge with L<level> · stageLabel
- [ ] Pet3D renders
- [ ] BusinessPulse + EventFeed visible
- [ ] WatchGlance visible
- [ ] No client-only state errors (page is a Server Component)

## D. Stage / model integrity (visual)

- [ ] Egg model loads at exp 0
- [ ] Chick model at exp ~150
- [ ] Bird model at exp ~400
- [ ] Eagle model at exp ~900
- [ ] Griffin model at exp ~1500
- [ ] Dragon model at exp ≥ 2000 and **fits inside the canvas** (no clipping outside the frame)
- [ ] Zoom in/out limits feel right at every stage — dragon does not escape the camera bounds
- [ ] No penguin / owl / random branching in the sequence

(Drive stage by sending events: `for i in 1..30; do curl -X POST .../api/events -d '{"userId":"demo","kind":"revenue","source":"stripe","value":50,"verified":true}' ...; done`)

## E. Production-only checks (once Vercel + Supabase + Stripe + GitHub are wired)

- [ ] Vercel build succeeds with all 5 env vars set
- [ ] Vercel build also succeeds without Supabase env (demo fallback path)
- [ ] Supabase `founder_events` rows appear after curl POSTs
- [ ] Stripe test webhook (`payment_intent.succeeded`) lands as `verified=true` row
- [ ] GitHub push lands as `kind=github_commit` row
- [ ] `/api/leaderboard` survives a redeploy with same data (proves DB write, not in-memory)
- [ ] `FOUNDERPET_INGEST_SECRET` enforced: POST without header → 401

## F. Soft-launch sanity

- [ ] Share `https://<vercel-host>/u/duct-tape2` in a DM — page loads in <2s for someone not logged in
- [ ] Open `/api/watch?userId=demo` in a browser tab — JSON is small enough to read at a glance
- [ ] No PayPal email, GitHub token, or any secret leaks into the rendered HTML (`view source`)
- [ ] No CSP / mixed-content warnings in console
