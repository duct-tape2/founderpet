# Deploy FounderPet — one-screen copy-paste

> Vercel CLI를 sandbox에서 못 돌려서 (macOS Keychain access 차단) 사용자가 직접 두 줄 실행해야 합니다. 나머지는 모두 자동.

## A) Vercel 영구 배포 (한 줄)

본인 인터랙티브 터미널에서:

```bash
cd ~/founderpet && vercel link --yes && vercel --prod --yes
```

`--yes`는 모든 프롬프트를 기본값으로 (디렉토리명 `founderpet` 프로젝트, 현재 team) 자동 승인합니다.

끝나면 출력 마지막에 `Production: https://founderpet-xxx.vercel.app` 형태의 URL이 찍힙니다. 그게 영구 URL.

## B) 배포 직후 검증 (그 URL 그대로 사용)

```bash
HOST=https://<위에서 받은 URL>

# 1. 헬스 + mode 확인 (Supabase 안 붙였으니 mode=demo여야 함)
curl -s "$HOST/api/health" | python3 -m json.tool

# 2. 7개 라우트 200
for p in / /leaderboard /u/duct-tape2 \
         /api/health /api/watch?userId=demo \
         /api/pet?userId=demo /api/leaderboard \
         '/api/events?userId=demo&limit=5'; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$HOST$p")
  echo "[$code] $p"
done

# 3. Watch 페이로드 spec 평면 필드 검증
curl -s "$HOST/api/watch?userId=demo" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); \
    keys=['version','userId','level','stage','mood','exp','progress','headline','nextBestAction','businessPulse']; \
    print({k: type(d[k]).__name__ for k in keys}); \
    print('businessPulse keys:', sorted(d['businessPulse'].keys()))"

# 4. Idempotency 라이브 확인 (같은 key 2번 → 두번째 duplicate:true, exp 불변)
KEY=prod_smoke_$(date +%s)
for i in 1 2; do
  curl -s -X POST "$HOST/api/events" \
    -H 'Content-Type: application/json' \
    -H "x-idempotency-key: $KEY" \
    -d '{"userId":"demo","kind":"revenue","source":"stripe","value":49,"verified":true}' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'try {sys.argv[1]}: duplicate={d[\"duplicate\"]} exp={d[\"pet\"][\"exp\"]}')" $i
done
```

모두 200 + duplicate=False/True 한 쌍이면 영구 데모는 끝. 다음 단계는 Supabase + Stripe + GitHub 환경변수.

## C) 환경변수 + 외부 서비스 wiring

상세 단계는 `docs/PRODUCTION_SETUP.md` §2–§4. 핵심만:

### Vercel env (Project → Settings → Environment Variables, 모든 환경)

```
FOUNDERPET_INGEST_SECRET=<openssl rand -hex 32>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role from Supabase Settings -> API>
STRIPE_WEBHOOK_SECRET=whsec_...           # Stripe Dashboard에서 발급
GITHUB_WEBHOOK_SECRET=<openssl rand -hex 32>
```

env 추가 후 Vercel Dashboard → Deployments → 최신 → ⋯ → **Redeploy**.

### Supabase

1. https://supabase.com/dashboard → New project
2. SQL Editor → `supabase/002_market_ready_events.sql` paste → Run
3. Settings → API → URL + service_role → 위 Vercel env에

### Stripe webhook

- URL: `$HOST/api/webhook/stripe`
- Events: `payment_intent.succeeded`, `checkout.session.completed`, `invoice.paid`, `charge.succeeded`
- Checkout session metadata: `founderpet_user_id: <userId>`

### GitHub webhook

- URL: `$HOST/api/webhook/github`
- Content type: `application/json`
- Secret: `GITHUB_WEBHOOK_SECRET` 와 동일
- Events: Push (+ Pull request 선택)

## D) (선택) GitHub Actions 자동 배포

PR마다 preview 배포 + main push마다 prod 배포 + 봇 코멘트:

1. `docs/templates/vercel-deploy.workflow.yml` 파일을 GitHub 웹에서 열고 `.github/workflows/vercel-deploy.yml` 경로로 main 브랜치에 직접 commit (gh CLI는 OAuth `workflow` scope 없어서 push 거부 — 웹에서 해야 함).
2. https://vercel.com/account/tokens → 토큰 생성 → 이름 `founderpet-ci`
3. `cd ~/founderpet && cat .vercel/project.json` (vercel link 후 생성됨) — `orgId`, `projectId` 확인
4. GitHub repo → Settings → Secrets and variables → Actions → New secret 3개:
   - `VERCEL_TOKEN` = 위 토큰
   - `VERCEL_ORG_ID` = project.json 의 `orgId`
   - `VERCEL_PROJECT_ID` = project.json 의 `projectId`

이후로는 PR을 만들면 자동으로 preview URL이 코멘트로 달리고, main에 머지하면 prod 자동 배포.

## E) Apple Watch (WorkPet)

`docs/workpet-integration.md` 참조. 사용자만 할 수 있는 것:

1. Xcode → Settings → Accounts → Apple ID `ljk7178@naver.com` 추가
2. Targets 3개 (WorkPet / WorkPetWidget / WorkPet Watch App) → Team `Z9HQHX8T6Z`
3. iPhone "째리" 선택 → ▶︎ Run
4. 앱 Settings에서 API URL을 위 Vercel host로 변경
5. 자동으로 `/api/watch?userId=...` 60초마다 polling

평면 spec 필드 (`level`, `stage`, `mood`, `exp`, `progress`, `headline`, `nextBestAction`, `businessPulse.{build,outcome,momentum,launchReadiness}`)가 watch payload에 다 들어가 있어서 Swift DTO 그대로 매핑됩니다.

---

## 만약 막히면

| 증상 | 원인 | 대응 |
|---|---|---|
| `vercel link --yes` 가 멈춤 | scope 자동선택 실패 | `vercel link` 그냥 치고 화살표로 scope 골라줄 것 |
| Vercel 배포 후 `/api/health` 가 `mode:"demo"` 라고 함 | Supabase env 안 들어감 | Vercel Project Settings → Environment Variables 확인 후 Redeploy |
| `/api/leaderboard` 가 `mode:"demo"` 그대로 | 동일. 캐시 X (no-store) | Redeploy 후 다시 시도 |
| Stripe webhook 401 | `STRIPE_WEBHOOK_SECRET` 미일치 | Stripe Dashboard에서 signing secret 다시 복사 |
| GitHub webhook 401 | secret 미일치 | repo settings에서 secret 재입력 |
| WorkPet 앱 빌드 실패 | Apple ID 미등록 | Xcode → Settings → Accounts 등록 |
