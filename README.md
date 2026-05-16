# FounderPet 🐣 → 🐉

> A virtual pet that grows from your **real business outcomes**. GitHub commits, AI agent runs, revenue, tasks — all feed your pet's evolution from egg to dragon.

For solo founders, indie hackers, and AI builders who want a **3-second business status signal** that's actually fun to check.

[Live demo](https://founderpet.dev) · [Leaderboard](https://founderpet.dev/leaderboard) · [GitHub](https://github.com/duct-tape2/founderpet)

---

## What it is

A pet that lives on your web dashboard and Apple Watch. It evolves stage by stage as your business actually moves:

| Signal | Source | Effect on pet |
|---|---|---|
| Revenue | Stripe / Gumroad / Polar / Lemon Squeezy / PayPal / manual | +$1 = +1 EXP (capped at +500 per event) + celebrating mood |
| Code | GitHub push webhook | +2 EXP per commit |
| AI activity | Claude / Codex / n8n agent run | +1 EXP per successful run |
| Tasks | Manual or API | +10 EXP per done, blocked → mood: blocked |
| Approvals | Manual or API | +5 / +15 / +30 EXP by risk |
| Content published | GitHub release / Substack / X | +20 EXP per piece |

**No revenue + stale tasks** → hunger goes up, mood: hungry.
**Blocked tasks** → mood: blocked.
**Big sale + recent commits** → mood: celebrating 🎉

## Evolution path

```
🥚 EGG  (Level 1)
   ↓ 200 EXP
🐣 CHICK  (Level 2-3)
   ↓ 400 EXP
🐤 BIRD  (Level 4-7)
   ↓ 800 EXP
🦅 EAGLE  (Level 8-12) — strong predator
   ↓ 1,300 EXP
✨ GRIFFIN  (Level 13-20) — mythical
   ↓ 2,100 EXP
🐉 DRAGON  (Level 21+) — final form
```

## Why it works

- **Real signals.** No vanity metrics. Your pet only grows if your business actually moves.
- **Public leaderboard.** See top founders by MRR + EXP. Your pet visible at `/u/[handle]`.
- **3D + Apple Watch.** Full 3D rendered pet on web. Native SwiftUI/SceneKit version coming for Apple Watch.
- **Stripe/Gumroad/GitHub auto-sync.** Configure once, never enter data manually again.

## Quick start (local dev)

```bash
git clone https://github.com/duct-tape2/founderpet.git
cd founderpet
npm install
npm run dev
# open http://localhost:3000
```

Run tests:
```bash
npm test          # vitest, 26 tests (engine + market-ready event flow)
npm run typecheck # tsc --noEmit
npm run build     # production build verify
```

Phase 2 docs:
- `docs/MARKET_READY.md` — event model, API surface, trust score, deploy checklist
- `docs/PRODUCTION_SETUP.md` — step-by-step Vercel + Supabase + Stripe + GitHub wiring with copy-paste curl tests
- `docs/LAUNCH_QA.md` — automated + manual UI checklist before flipping the public switch
- `docs/LAUNCH.md` — pricing schedule and Korean/English marketing copy
- `docs/workpet-integration.md` — connect the WorkPet iOS / Apple Watch app to FounderPet's `/api/watch`

## Architecture

```
┌─────────────────────┐
│   Web Dashboard     │  Next.js 13 + React Three Fiber + Tailwind
│   /                 │
│   /leaderboard      │
│   /u/[handle]       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐    ┌─────────────────────────┐
│   Pet Engine        │    │   Webhook Receivers     │
│   src/lib/pet-      │←───│   /api/webhook/stripe   │
│   engine.ts         │    │   /api/webhook/github   │
│   18 unit tests     │    │   /api/webhook/gumroad  │
└──────────┬──────────┘    └─────────────────────────┘
           │
           ↓
┌─────────────────────┐
│   Public API        │
│   GET /api/pet      │  ← Apple Watch polls every 60s
│   GET /api/leaderboard │  ← realtime jitter every 4s
│   POST /api/pet     │  ← manual event recording
└─────────────────────┘
```

Tech:
- **Frontend**: Next.js 13 (App Router), Tailwind CSS, TypeScript
- **3D**: React Three Fiber + Drei, GLTF models from Poly Pizza (CC0/CC-BY)
- **Pet engine**: Pure TypeScript, 18 unit tests passing (vitest)
- **Webhooks**: HMAC-verified for GitHub, signature-verified for Stripe
- **Mobile**: DPR + shadow + particle count auto-throttle on `<768px`
- **Future**: Supabase (postgres + realtime), Clerk (auth), Fly.io (hosting)

## Integrations

All listed integrations route to `MetricEvent` events that flow through the same pet engine.

| Provider | Webhook URL | Status |
|---|---|---|
| Stripe | `POST /api/webhook/stripe` | ✅ Implemented |
| GitHub | `POST /api/webhook/github` | ✅ Implemented (HMAC verified) |
| Gumroad | `POST /api/webhook/gumroad` | 🚧 Planned |
| Polar.sh | `POST /api/webhook/polar` | 🚧 Planned |
| Lemon Squeezy | `POST /api/webhook/lemonsqueezy` | 🚧 Planned |
| PayPal | `POST /api/webhook/paypal` | 🚧 Planned |
| GitHub Sponsors | `POST /api/webhook/github-sponsors` | 🚧 Planned |
| Toss / 카카오페이 | `POST /api/webhook/toss` | 🚧 Planned (Korean SMB) |
| Manual | `POST /api/pet` with eventType | ✅ Implemented |

### Stripe setup
```bash
# 1. Stripe Dashboard → Webhooks → Add endpoint
# 2. URL: https://yourdomain.com/api/webhook/stripe
# 3. Events: charge.succeeded, invoice.paid, customer.subscription.created
# 4. .env.local:
STRIPE_WEBHOOK_SECRET=whsec_...
```

When creating a Stripe charge, set:
```js
metadata: { founderpet_user_id: "your-user-id" }
```

### GitHub setup
```bash
# 1. Repo settings → Webhooks → Add webhook
# 2. URL: https://yourdomain.com/api/webhook/github
# 3. Secret: matches GITHUB_WEBHOOK_SECRET env var
# 4. Events: push, pull_request
GITHUB_WEBHOOK_SECRET=...
```

## Apple Watch (Phase 2)

Native SwiftUI + SceneKit app polls `/api/pet?userId=xxx` every 60s.

Source code in [`apps/ios/WorkPet Watch App/`](https://github.com/duct-tape2/founderpet) (separately maintained, will be merged from sibling [workpet](https://github.com/duct-tape2/workpet) repo).

Features:
- Glance at pet level + stage on wrist
- Quick task complete / approval action
- Today's MRR + commits count

## Roadmap

- [x] Pet engine with 18 unit tests
- [x] 3D rendered pet (6 stages, Poly Pizza CC0/CC-BY)
- [x] Mobile responsive (DPR + shadow throttling)
- [x] Stripe + GitHub webhook receivers
- [x] Public leaderboard (mock data, realtime jitter)
- [x] Public profile pages `/u/[handle]`
- [ ] Supabase persistence + realtime
- [ ] Clerk auth + onboarding flow
- [ ] Gumroad / Polar / Lemon webhook receivers
- [ ] Apple Watch native app (SwiftUI)
- [ ] Pet "trading" (NFT-free, just bragging rights)

## Credits

- 3D models: [Poly Pizza](https://poly.pizza) (CC0 / CC-BY)
- Inspired by [AI-tamago](https://github.com/ykhli/AI-tamago) (MIT) — kept production infrastructure pattern
- Original pet evolution mechanics: [WorkPet/다마고치 프로젝트](https://github.com/duct-tape2/workpet) (this author)

## License

MIT

---

## 한국어

**FounderPet**은 솔로 파운더, 인디 해커, AI 빌더를 위한 사업 진행도 펫입니다.

GitHub 커밋, AI 에이전트 실행, 매출(Stripe/Gumroad/Polar 자동 연동), 작업 완료 → 모두 펫의 EGG → DRAGON 진화에 반영.

기존 펫 앱과 달리 **사업 멀티 소스**를 통합해서, 손목/웹에서 3초 안에 내 사업이 살아있는지 확인할 수 있습니다.

**바이럴 한 줄**: 애플워치 집에서 놀리지 말고 여기다 활용해서 돈 벌어보세요.

타겟: Claude, Codex, ChatGPT, Gemini 사용자 + Apple Watch + 솔로 파운더.

데모: https://founderpet.dev
