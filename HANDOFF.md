# FounderPet — Handoff (CLI 통합 후)

작성: 2026-05-16
브랜치: `market-ready-cli-integration`
PR: https://github.com/duct-tape2/founderpet/pull/1
저장소 위치: `/Users/ijeong-geun/founderpet/` (이전 `/tmp/founderpet`에서 영구 이동)

---

## 지금 라이브로 떠 있는 URL

| URL | 상태 |
|---|---|
| `http://localhost:3000` | ✅ dev 서버 (PID 8565) |
| `https://similar-tubes-investigation-favorites.trycloudflare.com` | ✅ 공개 URL (Cloudflare quick tunnel) |
| `https://github.com/duct-tape2/founderpet/pull/1` | ✅ PR open |

공개 URL에서 동작 검증 완료:
- `/` → 200
- `/api/watch?userId=demo` → 200 (compact Watch payload)
- `/api/leaderboard` → 200 (trust-weighted)
- `/u/duct-tape2` → 200 (server component 공개 증빙)
- `/leaderboard` → 200

bad gateway는 이전 Cloudflare tunnel이 좀비 next 워커 4개(각 97% CPU)에 묶여서 발생. 모두 kill 후 깨끗하게 재기동.

⚠ Cloudflare quick tunnel은 dev 머신 + 이 dev 서버 프로세스가 살아 있어야 응답함. 영구 deploy는 Vercel로 옮길 것 (아래 "사용자 액션").

---

## 이번 CLI 세션에서 완료한 것

### 1) ChatGPT 패치 zip 통합
`~/Downloads/founderpet_market_ready_patch.zip` (44KB, 17 파일) 전체 적용. `apply_market_ready_patch.sh` 사용 (cp만, 삭제 없음).

### 2) 엔진 (`src/lib/pet-engine.ts`)
- `FounderEvent` 이벤트 모델 (11 kind × 12 source)
- `source + externalId` 기반 idempotency
- Daily EXP cap per (day, user, kind, source): agent_run 80, revenue 1000, github_commit 200 등
- Manual revenue 0.4875x 할인 (confidence 0.65 × manual penalty 0.75) → 가짜 매출로 리더보드 farming 차단
- `trustScore` (0–100) = verifiedRevenue + sourceDiversity + externalIdCoverage + verifiedCoverage − manualDominance
- `leaderboardScore = exp × (0.55 + trust/200) + verifiedRev × 4 + streak × 25 + health × 3`
- `businessPulse`: buildScore / outcomeScore / momentumScore / launchReadiness
- `nextBestAction` (한국어 컨텍스트별 자동 메시지)
- `streakDays` (UTC 일 단위 연속 활동일)
- 🐛 **버그 fix**: 빈 이벤트 사용자가 "hungry"로 잘못 표시되던 회귀. 신규 사용자는 TIRED로.

### 3) 신규 API
- `POST /api/events` 통합 ingestion (x-idempotency-key, x-founderpet-secret)
- `GET /api/events?userId=...&limit=N` 최근 이벤트
- `GET /api/watch?userId=...` 워치 컴팩트 JSON (complication ring + nextAction)
- Stripe webhook: HMAC + Stripe event id idempotency
- GitHub webhook: HMAC SHA256 + delivery id idempotency
- `/api/leaderboard` trust-weighted, mock jitter 제거

### 4) UI 컴포넌트
- `BusinessPulse` 4 gauge + Next Best Action + Risk Flags
- `LaunchChecklist` 5 항목 (verified 매출 / 빌드 신호 / AI 자동화 / trust ≥70 / Watch payload)
- `EventFeed` "왜 EXP 올랐는지" 감사 로그 + capped/verified 배지
- `WatchGlance` 워치 화면 미리보기
- `Leaderboard` `/api/leaderboard` 호출 + fallback 명시

### 5) Supabase 스키마
`supabase/002_market_ready_events.sql`:
- `founder_profiles` + `founder_events`
- `(user_id, source, external_id) WHERE external_id IS NOT NULL` 유니크 인덱스 → DB 레벨 idempotency
- RLS: 공개 read, write는 service role만
- `founder_event_rollup_v1` view (리더보드 쿼리용)
- updated_at 자동 트리거

### 6) Docs
- `docs/MARKET_READY.md` — 정식 docs (event model, API, trust score 공식, 배포 체크리스트)
- `docs/MARKET_READY_PHASE2.md` — 패치 원본 노트
- `docs/workpet-integration.md` — WorkPet iOS/Watch ⇆ FounderPet 연결 가이드 + Swift snippet
- `.env.local.market-ready.example` — env 가이드

### 7) 테스트
- `src/lib/pet-engine.market.test.ts`: 8 신규 테스트 (stage threshold, idempotency, daily cap, manual discount, watch payload)
- `src/lib/pet-engine.test.ts`: 4 레거시 테스트 재작성 (manual 할인 행동 문서화)
- **26/26 passing** (vitest)
- `npx tsc --noEmit`: clean
- `npm run build`: 9 routes generated

### 8) 인프라
- `/tmp/founderpet` → `~/founderpet` 영구 이동 (재부팅 시 휘발 위험 제거)
- 좀비 next 워커 4개 kill (각 97% CPU 점유 중) → bad gateway 해결
- 깨끗한 dev 서버 + 새 Cloudflare tunnel 재기동
- `tsconfig` target es5 → es2017 (Map iteration typecheck)
- `package.json` scripts: `test`, `test:watch`, `typecheck`
- `.gitignore` `.npm-cache/` 추가 + `git rm -r --cached` 정리

### 9) Git
- Branch `market-ready-cli-integration` (1 커밋: `8c1eb7f`)
- origin push 완료
- PR #1 open

---

## 아직 사용자 액션 필요한 것

### 영구 deploy (Vercel)
`vercel` CLI 인증 안 됨 (저번에 "vercel 로그인 해놨어"는 웹사이트 로그인이고 CLI는 별도). 둘 중 하나:

```bash
# 옵션 A — CLI
vercel login   # 브라우저 OAuth 1회
cd ~/founderpet
vercel link    # 프로젝트 연결
vercel --prod  # 배포
```

```text
# 옵션 B — Vercel 웹 (더 쉬움)
1. https://vercel.com/new
2. Import "duct-tape2/founderpet"
3. Branch: market-ready-cli-integration (또는 PR 머지 후 main)
4. Deploy
```

### Env 변수 (Vercel 대시보드에서 설정)
`.env.local.market-ready.example` 그대로:

```
FOUNDERPET_INGEST_SECRET=<긴 랜덤>
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
STRIPE_WEBHOOK_SECRET=whsec_...
GITHUB_WEBHOOK_SECRET=<랜덤>
```

### Supabase
1. https://supabase.com/dashboard → New project (무료)
2. SQL editor → `supabase/002_market_ready_events.sql` paste + Run
3. Settings → API → URL + service_role key 복사
4. Vercel env에 넣기

### Stripe webhook
- Dashboard → Webhooks → Add endpoint
- URL: `https://<vercel-host>/api/webhook/stripe`
- Events: `payment_intent.succeeded`, `checkout.session.completed`, `invoice.paid`, `charge.succeeded`
- Signing secret을 `STRIPE_WEBHOOK_SECRET`에 세팅
- 매출 만들 때 Stripe `metadata.founderpet_user_id` 같이 보낼 것

### GitHub webhook
- Repo Settings → Webhooks → Add webhook
- URL: `https://<vercel-host>/api/webhook/github`
- Secret: `GITHUB_WEBHOOK_SECRET` 와 동일하게
- Events: Push, optionally Pull request

### WorkPet iOS / Apple Watch
이전 세션에서 멈춘 곳:
1. Xcode → Settings → Accounts → Add Apple ID `ljk7178@naver.com` (Team `Z9HQHX8T6Z`)
2. Targets `WorkPet` + `WorkPetWidget` + `WorkPet Watch App` → Signing & Capabilities → Team: Personal Team
3. iPhone "째리" 선택 → ▶︎ Run (⌘R)
4. 앱 Settings에서 API URL을 Vercel 호스트로 → 자동으로 `/api/watch` polling 시작

자세한 매핑: `docs/workpet-integration.md`

---

## 빠른 검증 명령어

```bash
cd ~/founderpet

# 테스트 + 빌드
npm test
npm run typecheck
npm run build

# 로컬 데모
npm run dev
open http://localhost:3000
open http://localhost:3000/api/watch?userId=demo

# 현재 살아 있는 공개 URL
open https://similar-tubes-investigation-favorites.trycloudflare.com

# Idempotency 실제 확인 (같은 키로 2회 호출 → 두 번째 duplicate:true)
curl -X POST http://localhost:3000/api/events \
  -H 'Content-Type: application/json' \
  -H 'x-idempotency-key: demo_key_$(date +%s)' \
  -d '{"userId":"demo","kind":"revenue","source":"stripe","value":49,"verified":true}'

# PR
open https://github.com/duct-tape2/founderpet/pull/1
```

---

## 폴더 구조 (현재)

```
~/founderpet/
├── HANDOFF.md                     ← 이 문서
├── PROJECT_BRIEF.md               ← 이전 세션 종합
├── README.md                      ← Phase 2 docs 링크 추가됨
├── docs/
│   ├── MARKET_READY.md            ← 정식 docs
│   ├── MARKET_READY_PHASE2.md     ← 패치 원본 노트
│   └── workpet-integration.md     ← iOS/Watch 연결 가이드
├── supabase/
│   └── 002_market_ready_events.sql ← 프로덕션 스키마
├── src/
│   ├── lib/
│   │   ├── pet-engine.ts          ← 이벤트 엔진 + trust + cap
│   │   ├── pet-engine.test.ts     ← 18 레거시 테스트 (재작성된 4개 포함)
│   │   ├── pet-engine.market.test.ts ← 8 신규 테스트
│   │   ├── pet-store.ts           ← Supabase + in-memory fallback
│   │   └── watch-payload.ts       ← Watch JSON 빌더
│   ├── app/
│   │   ├── api/events/route.ts    ← 통합 ingestion
│   │   ├── api/watch/route.ts     ← Watch 페이로드
│   │   ├── api/pet/route.ts       ← legacy 호환
│   │   ├── api/leaderboard/route.ts ← trust-weighted
│   │   ├── api/webhook/stripe/route.ts ← HMAC + idempotency
│   │   ├── api/webhook/github/route.ts ← HMAC + idempotency
│   │   ├── page.tsx
│   │   ├── leaderboard/page.tsx
│   │   └── u/[handle]/page.tsx
│   └── components/
│       ├── BusinessPulse.tsx      ← 신규
│       ├── LaunchChecklist.tsx    ← 신규
│       ├── EventFeed.tsx          ← 신규
│       ├── WatchGlance.tsx        ← 신규
│       ├── Leaderboard.tsx        ← API 기반 재작성
│       ├── Pet3D.tsx              ← 그대로 (자연스러운 진화 유지)
│       └── RevenueIntegrations.tsx
└── .env.local.market-ready.example
```

---

## 최우선 다음 한 가지

`vercel login` 후 `vercel --prod` 한 번 돌리면 `founderpet.vercel.app` 영구 URL 확보. 그 다음 Supabase + Stripe webhook을 한 번 세팅하면 진짜 매출이 자동으로 펫을 키운다.
