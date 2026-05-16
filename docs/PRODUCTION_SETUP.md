# FounderPet — Production Setup (Supabase + Stripe + GitHub)

> Step-by-step from a fresh Vercel deploy to a fully wired production stack. Every step has a curl you can copy-paste to verify it worked.

Branch: `market-ready-cli-integration` · PR: https://github.com/duct-tape2/founderpet/pull/1

---

## 0) Pre-flight

```bash
cd /Users/ijeong-geun/founderpet
npm test           # expect 26/26
npm run typecheck  # expect clean
npm run build      # expect 9 routes
```

Required env vars (set on Vercel):

```
FOUNDERPET_INGEST_SECRET=<long random>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role>
STRIPE_WEBHOOK_SECRET=whsec_...
GITHUB_WEBHOOK_SECRET=<random>
```

Optional:

```
NEXT_PUBLIC_APP_URL=https://<vercel-host>
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

---

## 1) Vercel deploy

```bash
vercel login
cd /Users/ijeong-geun/founderpet
vercel link
vercel --prod
```

Or via web: https://vercel.com/new → import `duct-tape2/founderpet` → branch `market-ready-cli-integration` (or merge PR #1 then main) → Deploy.

After deploy, sanity check:

```bash
HOST=https://<your-vercel-host>
curl -I "$HOST/"
curl    "$HOST/api/watch?userId=demo" | head -c 400
curl    "$HOST/api/leaderboard?limit=3"
```

Demo mode is fine here — Supabase is not yet connected, the in-memory store will serve `demo`.

---

## 2) Supabase

### 2.1 Create project

1. https://supabase.com/dashboard → New project
2. Region: choose closest to your Vercel region
3. Save the database password somewhere safe

### 2.2 Run the migration

In Supabase **SQL Editor**, paste the entire contents of `supabase/002_market_ready_events.sql` and Run.

This creates:

- `public.founder_profiles` (id, handle, display_name, project_name, avatar_emoji, timestamps)
- `public.founder_events` (id, user_id FK, kind check, source, value, currency, verified, confidence, external_id, occurred_at, metadata, created_at)
- Unique idempotency index: `founder_events_source_external_id_idx` on `(user_id, source, external_id) where external_id is not null`
- `public.founder_event_rollup_v1` view for leaderboard queries
- RLS: profiles + events publicly readable, writes require `service_role`

### 2.3 Copy keys

Supabase Dashboard → Settings → API:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to client)

Set both on Vercel: Project → Settings → Environment Variables (all environments).

### 2.4 Verify

After redeploy:

```bash
# Insert a verified test revenue event
curl -X POST "$HOST/api/events" \
  -H 'Content-Type: application/json' \
  -H "x-founderpet-secret: $FOUNDERPET_INGEST_SECRET" \
  -H 'x-idempotency-key: supabase_smoke_001' \
  -d '{"userId":"demo","kind":"revenue","source":"stripe","value":49,"currency":"USD","verified":true}'

# Repeat — must return duplicate:true with unchanged exp
curl -X POST "$HOST/api/events" \
  -H 'Content-Type: application/json' \
  -H "x-founderpet-secret: $FOUNDERPET_INGEST_SECRET" \
  -H 'x-idempotency-key: supabase_smoke_001' \
  -d '{"userId":"demo","kind":"revenue","source":"stripe","value":49,"currency":"USD","verified":true}'

# Confirm it landed
curl "$HOST/api/pet?userId=demo" | head -c 500
curl "$HOST/api/watch?userId=demo"
curl "$HOST/api/leaderboard"
```

In the Supabase Table Editor, `founder_events` should contain one row with `external_id = supabase_smoke_001`.

---

## 3) Stripe — real verified revenue

### 3.1 Register the webhook

Stripe Dashboard → Developers → Webhooks → **Add endpoint**

- **Endpoint URL**: `https://<vercel-host>/api/webhook/stripe`
- **Events to send**:
  - `payment_intent.succeeded`
  - `checkout.session.completed`
  - `invoice.paid`
  - `charge.succeeded`

After creation, copy the **Signing secret** (`whsec_...`) into Vercel env `STRIPE_WEBHOOK_SECRET` and redeploy.

### 3.2 Wire the user id

When you create a Stripe Checkout Session or PaymentIntent, attach the FounderPet user id:

```js
const session = await stripe.checkout.sessions.create({
  // ...
  metadata: { founderpet_user_id: "duct-tape2" }
});
```

The webhook reads metadata in this priority order:

1. `metadata.founderpet_user_id`
2. `metadata.userId`
3. `metadata.user_id`
4. `client_reference_id`
5. `customer_email`
6. `"demo"` (last-resort fallback so test events still show up)

### 3.3 Verify

Stripe Dashboard → Webhooks → your endpoint → **Send test webhook** → `payment_intent.succeeded`.

```bash
# Watch the event land
curl "$HOST/api/events?userId=demo&limit=5"

# Confirm pet/leaderboard reflect it
curl "$HOST/api/watch?userId=demo"
curl "$HOST/api/leaderboard"
```

In Supabase, the row in `founder_events` should have `source = stripe`, `verified = true`, `external_id = evt_...` (the Stripe event id — that's the idempotency key).

### 3.4 Anti-double-count

Stripe webhooks can re-deliver. FounderPet uses Stripe `event.id` as `external_id`, and the DB unique index guarantees no double-counting. Verified via test in `src/lib/pet-engine.market.test.ts` ("dedupes events by user + source + externalId").

---

## 4) GitHub — verified build signal

### 4.1 Register the webhook

Your repo → Settings → Webhooks → **Add webhook**

- **Payload URL**: `https://<vercel-host>/api/webhook/github`
- **Content type**: `application/json`
- **Secret**: any random string — set the same value as `GITHUB_WEBHOOK_SECRET` on Vercel
- **Events**: at minimum `Pushes`. Optional: `Pull requests`.

Save. GitHub will send a `ping` event — it is intentionally ignored by FounderPet (`ignored: true`).

### 4.2 Verify

Push a single commit to the repo, then:

```bash
curl "$HOST/api/events?userId=<your-gh-handle>&limit=5"
curl "$HOST/api/watch?userId=<your-gh-handle>"
curl "$HOST/api/leaderboard"
```

`founder_events` should now contain a row with `kind = github_commit`, `source = github`, `external_id = <delivery uuid>` (X-GitHub-Delivery header).

### 4.3 User id resolution

```
repository.owner.login → sender.login → pusher.name → "demo"
```

If you want one FounderPet user to receive commits from multiple GitHub identities, add a mapping table in Supabase later. For now, default behavior gives the repo owner credit.

---

## 5) End-to-end smoke

```bash
HOST=https://<vercel-host>
SECRET=$FOUNDERPET_INGEST_SECRET

# 1. Manual revenue (will be discounted)
curl -X POST "$HOST/api/events" \
  -H 'Content-Type: application/json' \
  -H "x-founderpet-secret: $SECRET" \
  -H 'x-idempotency-key: e2e_manual_1' \
  -d '{"userId":"demo","kind":"revenue","source":"manual","value":100,"verified":false}'

# 2. Verified Stripe revenue (full trust)
curl -X POST "$HOST/api/events" \
  -H 'Content-Type: application/json' \
  -H "x-founderpet-secret: $SECRET" \
  -H 'x-idempotency-key: e2e_stripe_1' \
  -d '{"userId":"demo","kind":"revenue","source":"stripe","value":49,"verified":true}'

# 3. GitHub commit
curl -X POST "$HOST/api/events" \
  -H 'Content-Type: application/json' \
  -H "x-founderpet-secret: $SECRET" \
  -H 'x-idempotency-key: e2e_commit_1' \
  -d '{"userId":"demo","kind":"github_commit","source":"github","value":3,"verified":true}'

# 4. Watch payload (compact, spec-shape flat fields)
curl "$HOST/api/watch?userId=demo"
# expect: { version, userId, level, stage, mood, exp, progress, headline,
#          nextBestAction, businessPulse:{build,outcome,momentum,launchReadiness},
#          pet:{...}, pulse:{...}, today:{...}, complication:{...}, recent:[...] }

# 5. Re-fire #2 to prove idempotency
curl -X POST "$HOST/api/events" \
  -H 'Content-Type: application/json' \
  -H "x-founderpet-secret: $SECRET" \
  -H 'x-idempotency-key: e2e_stripe_1' \
  -d '{"userId":"demo","kind":"revenue","source":"stripe","value":49,"verified":true}'
# expect: { ok:true, duplicate:true, ... }
```

Open `$HOST/u/demo` and visually confirm:

- Pet matches stage from `/api/pet?userId=demo`
- BusinessPulse shows non-zero build/outcome/momentum
- EventFeed shows the events you just inserted with `verified` and `capped` badges where applicable
- Watch glance preview matches the `/api/watch` payload

---

## 6) Demo mode vs production mode (how to tell)

| Indicator | Demo (no Supabase env) | Production (Supabase env set) |
|---|---|---|
| `/api/leaderboard` payload `scoring` field | same string | same string |
| `/api/leaderboard` rows | 1 seeded `duct-tape2` row | every row in `founder_profiles` |
| `/api/events?userId=<new>&limit=1` for a brand-new user | empty array (in-memory store seeds only `demo`) | empty array unless someone has inserted |
| `/api/pet?userId=demo` shows seeded GitHub commit + Stripe sale | yes | yes (re-seeded once per process if profiles table empty for `demo`) |
| Re-deploy resets data | yes | no |

The Leaderboard component shows a `fallback` indicator (amber dot) when `/api/leaderboard` is unreachable. There is no live indicator for demo-vs-prod in the UI yet — knowing "the DB is wired" comes from sending a curl event and seeing it survive a redeploy.

---

## 7) Rollback

```bash
# Disable just FounderPet integrations without losing data
# - Remove the webhook endpoints from Stripe + GitHub dashboards
# - Or temporarily unset STRIPE_WEBHOOK_SECRET / GITHUB_WEBHOOK_SECRET on Vercel
#   (signature verification fails → 401 → no event written)

# Reset the Supabase database (destructive)
# In Supabase SQL editor:
#   drop view if exists public.founder_event_rollup_v1;
#   drop table if exists public.founder_events;
#   drop table if exists public.founder_profiles;
# Then re-run supabase/002_market_ready_events.sql
```
