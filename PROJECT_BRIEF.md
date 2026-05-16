# FounderPet — Master Project Brief

> 솔로 파운더의 사업 진행도를 손목에서 3초 안에 확인하는 3D 펫. 깃허브 커밋, AI 에이전트 실행, 실제 매출이 모여 펫을 알에서 드래곤까지 진화시킨다.

작성일: 2026-05-16
저장소: https://github.com/duct-tape2/founderpet
임시 데모: https://lanes-firefox-signs-hispanic.trycloudflare.com

---

## 1. 사용자 의도 / 비전

세션 전체에서 사용자가 명확히 표현한 의도:

### 1.1 핵심 비전

- **타겟**: 솔로 파운더 / 인디 해커 / Claude·Codex·n8n 사용하는 AI 빌더
- **문제**: 사업 진행도(개발 commits, AI agent 작업, 매출, tasks)가 여러 도구에 흩어져 있어 매일 무엇이 막혔는지 손목/웹에서 바로 안 보임
- **솔루션**: 사업의 multi-source 신호를 모아 펫의 EXP/Level/Mood/Stage 로 시각화. 사업이 잘 되면 펫이 진화한다.
- **viral 한 줄**: "애플워치 집에서 놀리지 말고 여기다 활용해서 돈 벌어보세요"

### 1.2 사용자가 명확히 짚은 디자인 원칙

1. **펫 3D 작업으로 완전 고급스럽게** — procedural primitives X, 디자이너 quality 3D 모델
2. **자연스러운 진화 흐름** — 펭귄/부엉이 같은 분기 X. 알 → 새 → 신화 → 드래곤 순차적
3. **드래곤 전체 비율 맞게** — 줌 in/out 범위 stage별 한정
4. **모바일 + 애플워치에서도 정상 작동**
5. **실시간 랭킹 시스템** — 사용자 프로젝트 수익이랑 연동, 수익 발생 시 자연스럽게 펫 자라기
6. **잘 만들어진 OSS 구조 재활용** — 체계는 검증된 거 그대로 따와서 펫 컨셉만 위에 얹기
7. **완전히 동일한 아이디어가 있는지 검증** 후 진행
8. **기반 유지하면서 부족한 거 알아서 점검해서 구현 완벽하게**

### 1.3 사용자의 더 큰 그림 (수익 부분)

이 세션 전반부에서 별도로 진행된 매출 전략:

- 코덱스가 3일간 자율로 매출 시도 → $0 (사용자 신원 게이트로 막힘)
- Claude 구독 위기, 실제 수익 필요
- 사용자 명령: "1000달러로 어떻게든 예상수익 늘려주고 지금 당장 벌어온 돈 0인거부터 어떻게든 해결"
- 명령 추가: "올자동화로 알아서 벌어와"

→ FounderPet은 이 큰 그림 중 **"본인 product를 가져서 매출 만들기"** 트랙. 옵시디언 vault에 이미 존재했던 다마고치 프로젝트(WorkPet)를 재활용 + AI-tamago 인프라 결합으로 진짜 출시 가능한 제품으로 발전.

---

## 2. 검증 결과 — 동일 아이디어 없음 (Unique)

| 비교 대상 | 차이 |
|---|---|
| Nomi (Apple Watch) | 걸음 수 단일 신호만 |
| TamoStudy | 집중 timer만, 2024 archived |
| AI-tamago | LLM thoughts만, 성장 시스템 없음 |
| cli-pet | GitHub commits만 |
| Pex / Pixel Paws / Watchi | 단순 펫 게임 |
| Takway Sweekar | 하드웨어 펫 $150-200 (CES 2026) |
| Animals Evolution on Watch | 단순 진화 게임 |

**FounderPet의 UNIQUE 조합**: GitHub + AI agent + revenue + tasks → 펫 진화, solo founder 타겟, Watch-first 3초 비즈니스 상태. 이 조합은 어떤 앱도 안 한다.

---

## 3. 빌드된 것 (Phase 1 완료)

### 3.1 GitHub repo
- https://github.com/duct-tape2/founderpet
- Topics: tamagotchi, virtual-pet, productivity, indie-hacker, founder, solopreneur, ai-agent, nextjs, supabase, typescript
- FUNDING.yml (Sponsor button 활성화)
- MIT license (AI-tamago base 상속)
- 4 commits, v0.1 production-build verified

### 3.2 Tech stack

```
Frontend
├── Next.js 13 (App Router)
├── React Three Fiber + Drei (3D rendering)
├── Tailwind CSS (frosted glass / Linear minimal)
└── TypeScript

Pet Engine
├── src/lib/pet-engine.ts (250+ LOC, pure TS)
├── 6 PetStage, 6 PetMood, 10 MetricType
└── src/lib/pet-engine.test.ts (18 vitest tests, 18/18 passing)

3D Models
└── public/models/
    ├── Egg.glb (12K)         🥚
    ├── Chick.glb (19K)       🐣
    ├── Bird.glb (40K)        🐤
    ├── Eagle.glb (34K)       🦅
    ├── Griffin.glb (491K)    ✨
    └── Dragon.glb (339K)     🐉
    (전부 Poly Pizza CC0/CC-BY)

API routes
├── GET  /api/pet?userId=xxx (Apple Watch polling endpoint)
├── POST /api/pet (manual event recording)
├── GET  /api/leaderboard (realtime jitter)
├── POST /api/webhook/stripe (HMAC ready)
└── POST /api/webhook/github (HMAC SHA256 verified)

Public pages
├── /                (3D pet + signal buttons + leaderboard + integrations)
├── /leaderboard     (top-N 풀 페이지)
└── /u/[handle]      (공개 프로필, 본인 펫 공유 URL)

Build / deploy
├── Production build verified (warnings only, no errors)
├── 18 unit tests passing
└── Cloudflare quick tunnel — 임시 public URL 라이브
```

### 3.3 진화 흐름 (자연스럽게 dragon으로)

```
🥚 EGG  (Level 1, exp 0-99)
   ↓
🐣 CHICK  (Level 2-3, exp 100-299)
   ↓
🐤 BIRD  (Level 4-7, exp 300-699)
   ↓
🦅 EAGLE  (Level 8-12, exp 700-1199) — 강해진 맹금
   ↓
✨ GRIFFIN  (Level 13-20, exp 1200-1999) — 신화: 새 + 사자
   ↓
🐉 DRAGON  (Level 21+, exp 2000+) — 최종
```

### 3.4 신호 → EXP 매핑 (`pet-engine.ts`)

| Signal | EXP |
|---|---|
| Task done | +10 |
| Approval (low/med) | +5 |
| Approval (high) | +15 |
| Approval (critical) | +30 |
| Revenue $1 | +1 (capped at +500 per event) |
| Lead 1건 | +3 |
| Views 100 | +1 |
| GitHub commit | +2 |
| Published content (블로그/PR merge) | +20 |
| Agent run (성공) | +1 |

Mood 룰:
- blocked task → mood: blocked
- hunger > 50 → hungry
- revenue + recent done → celebrating 🎉
- 활성 task만 있음 → focused
- 아무것도 없음 → tired

### 3.5 화면별 UX

```
Header
├── "Live · Beta · 1,247 founders" (펄스 점 + 모노)
├── h1 "FounderPet" (semibold, tight tracking)
└── GitHub link + "Get Early Access" CTA

Main grid (5-col asymmetric)
├── Left (3-col)
│   ├── 3D pet canvas (500px, aurora gradient bg + stars + fog)
│   ├── Stats tiles: LEVEL / STAGE / MOOD / EXP (모노)
│   ├── Meters: Hunger / Energy / Focus / Health (1px bar)
│   └── Next evolution requirement (mono)
└── Right (2-col)
    └── Signal Test panel (Productivity / Code&AI / Revenue 그룹)

Leaderboard row (5-col 6 left, 2 right)
├── Live leaderboard (top-10, 4초 jitter)
└── Revenue integrations (8 providers)

Bottom hero
└── "애플워치 집에서 놀리지 말고 여기다 활용해서 돈 벌어보세요"
```

### 3.6 모바일 + Watch 최적화

| 환경 | 처리 |
|---|---|
| Desktop | full quality (shadows + environment + 3000 stars + 140 sparkles) |
| Mobile ≤768px | shadows OFF, environment OFF, antialias OFF, stars 600, sparkles 40, DPR 1-1.5 |
| Watch ≤240px | particles 0, height 180px, 최소 렌더 |
| Touch | 한 손가락 회전, 두 손가락 핀치 줌 |

### 3.7 카메라 / 줌 범위 (stage별)

| Stage | targetSize | camera Z | min/max zoom |
|---|---|---|---|
| EGG | 1.6 | 3.8 | 2.8 - 6.0 |
| CHICK | 1.6 | 3.8 | 2.8 - 6.0 |
| BIRD | 1.7 | 4.0 | 3.0 - 7.0 |
| EAGLE | 1.9 | 4.5 | 3.5 - 7.5 |
| GRIFFIN | 2.0 | 5.0 | 4.0 - 8.0 |
| **DRAGON** | **2.2** | **5.5** | **4.5 - 8.5** |

드래곤이 화면에 풀로 들어오게 + 줌 범위가 정해져있어서 너무 멀리/가까이 못 감.

---

## 4. 라이브 라우트 (검증 완료)

### 4.1 임시 public URL (Cloudflare tunnel)
https://lanes-firefox-signs-hispanic.trycloudflare.com

| Route | Status |
|---|---|
| `/` | ✅ 200 |
| `/leaderboard` | ✅ 200 |
| `/u/duct-tape2` | ✅ 200 |
| `/api/pet?userId=demo` | ✅ 200 |
| `/api/leaderboard` | ✅ 200 |

### 4.2 영구 deploy (다음 단계)

- Vercel — 사용자 로그인됨, GitHub repo import만 남음
- 그러면 `founderpet.vercel.app` 영구 URL

---

## 5. 워크펫(다마고치 프로젝트) iOS / Watch 앱

`/Users/ijeong-geun/workpet/` 에 사용자가 이미 만든 SwiftUI 앱:

```
워크펫 (5,500 lines production code)
├── backend/  (FastAPI 1,880 LOC Python)
├── apps/web/ (React/Vite 1,311 LOC)
├── apps/ios/ (SwiftUI 2,248 LOC: iPhone + Watch + Widget)
├── docs/    (App Store readiness 다 작성됨)
└── shared/  (JSON schemas)
```

### 5.1 iOS 빌드 상태 (2026-05-16)

- iPhone 15 Pro "째리" 연결됨 (UDID 00008130-...)
- Apple ID `ljk7178@naver.com` (Team Z9HQHX8T6Z) 발견
- xcodebuild CLI는 Xcode 계정 등록 안 됨으로 fail
- **사용자 액션 필요**: Xcode UI → Settings → Accounts → Add Apple ID → ▶︎ Run

### 5.2 FounderPet 통합 path

- 워크펫 iOS/Watch는 `apps/web/src/lib/api.ts` 패턴으로 backend 호출
- 그 baseURL을 FounderPet public URL로 바꾸면 같은 데이터 공유
- 또는 워크펫 backend를 FounderPet API에 미러링

---

## 6. 더 큰 매출 전략 (세션 전반부 내용)

### 6.1 검증된 매출 채널 (사용자 가입 1회 필요)

| Channel | 매출 잠재 | 가입 |
|---|---|---|
| **PromptBase** prompts | $30-500/월 passive | 60초, Stripe Express |
| **DataAnnotation.tech** | $300-2,000/월 | 10분 KYC |
| **Anthropic HackerOne** | $200-15,000/건 | 5분 |
| **huntr.com (AI/ML)** | $1,500-50,000/건 | 10분, Stripe Connect |
| **OpenAI Bugcrowd** | $200-100,000/건 | 5분 |
| **Vercel OSS HackerOne** | up to $1M | HackerOne 가입에 추가 |
| **GitHub Sponsors** | recurring | 10분 KYC |
| **Polar.sh** | per-product | 60초 GitHub OAuth |
| **크몽 / 위시켓** | 한국 즉시 컨설팅 | 5분 |

### 6.2 자율 생성 자료 (즉시 upload 가능)

`/Users/ijeong-geun/revenue-ops/promptbase-stockpile/` — 25 prompts (PromptBase 즉시 upload)
- Korean SMB AI Consultant ($9.99)
- Claude Code Skill Generator ($4.99)
- Anime/J-Pop Phrase Extractor ($3.99)
- React Component Generator ($3.99)
- SQL Query Optimizer ($4.99)
- GitHub Actions Workflow Designer ($3.99)
- B2B Cold Email Sequence ($5.99)
- Midjourney Product Photography ($4.99)
- Customer Persona Generator ($4.99)
- LinkedIn 30-Day Content Calendar ($6.99)
- Studio Ghibli Character ($3.99)
- Korean Webtoon Style ($4.99)
- JLPT N3 Grammar Tutor ($4.99)
- Legacy Code Refactor ($4.99)
- Children's Book Illustration ($3.99)
- TypeScript Type Generator ($3.99)
- Startup Pitch Deck Outline ($5.99)
- Korean Business Headshot ($4.99)
- Veo 3 + Kling K-Drama Video ($6.99)
- Claude Opus 4.7 Extended Thinking ($5.99)
- Nano Banana Product Mockup ($4.99)
- GPT-5.5 Data Analysis ($5.99)
- **Meta Prompt Generator ($12.99)** — highest tier
- ChatGPT + DALL-E 3 E-commerce Listing ($9.99)
- X Viral Thread Generator ($7.99)

`/Users/ijeong-geun/revenue-ops/n8n-templates/` — 5 templates (Gumroad/n8n marketplace)
- AI Content Creation Pipeline ($19)
- LinkedIn Lead Gen Auto ($29)
- Multi-Model AI Router ($19)
- X Thread Auto-Generator ($19)
- Stripe → 카카오톡 Korean SMB Alert ($19)

### 6.3 옵시디언 vault 분석 결과

`/Users/ijeong-geun/Documents/IdeaVault/`
- **9,287 markdown 노트** 스캔됨
- **1,561 AI 대화** (gemini 969 / chatgpt 536 / claude 36 / telegram 17)
- **100+ 네이버 프리미엄 AI 기사**
- **10 Playbook** (사용자 본인 작성, $19-29 product 가능)
- **8 selected profit ideas** (다 가격 정리됨)

8개 selected ideas:
1. **Private AI Starter Kit** (₩99,000) — ai-money-stack repo로 actioned
2. **WorkPet/다마고치 프로젝트** (₩29,000) — **FounderPet으로 actioned (이 문서)**
3. 신꽂 편의점 재고 맵 — shinkkot-mock repo로 actioned
4. **권리 안전 일본어 학습팩** — japanese-anki-pack repo로 actioned
5. AI 건강 쇼츠 캐릭터 — YouTube OAuth 필요
6. Call Guard 통화 어시스트 — OS-level 전화 권한 필요
7. FiveM 서버 스크립트 — Tebex 마켓
8. 한국 트렌드 일본어 숏폼 — YouTube OAuth

---

## 7. 자율로 만든 4(+1)개 public GitHub repo

| Repo | URL | 가격 |
|---|---|---|
| ai-money-stack | https://github.com/duct-tape2/ai-money-stack | $39 / ₩99,000 / ₩390,000 |
| japanese-anki-pack | https://github.com/duct-tape2/japanese-anki-pack | $29 / ₩39,000 (402 cards .apkg) |
| shinkkot-mock | https://github.com/duct-tape2/shinkkot-mock | 편의점 prototype |
| ai-money-scout-action | https://github.com/duct-tape2/ai-money-scout-action | 무료 Marketplace action |
| **founderpet** | **https://github.com/duct-tape2/founderpet** | **이 프로젝트 (TBD pricing)** |

PayPal endpoint `sks7178@gmail.com` 4개 product README + landing page에 명시.

---

## 8. 다음 단계 (TODO)

### 8.1 Phase 2 — Production deploy

- [ ] Vercel 1-click deploy (사용자 로그인됨, GitHub repo import만)
- [ ] Supabase 가입 → DB schema (users / pets / events / integrations)
- [ ] Clerk 가입 → auth + 가입/로그인 UI
- [ ] Stripe webhook secret 설정 → 실제 매출 → 자동 펫 성장
- [ ] GitHub webhook secret 설정 → commits 자동 EXP
- [ ] founderpet.dev 도메인 (선택, Vercel에서 1분)

### 8.2 Phase 3 — Apple Watch native

- [ ] 워크펫 iOS/Watch 빌드 (`xed /Users/ijeong-geun/workpet/apps/ios/WorkPet.xcodeproj` → ▶︎)
- [ ] APIClient baseURL을 FounderPet public URL로
- [ ] SceneKit 또는 RealityKit으로 3D 펫 native 렌더
- [ ] Watch glance + complication

### 8.3 Phase 4 — 매출 + 확장

- [ ] X 트윗으로 첫 traffic (텔레그램에 준비된 카피)
- [ ] Show HN submission
- [ ] Reddit r/sideproject + r/indiehackers
- [ ] Pricing tier (free + premium)
- [ ] 매출 발생 시 진짜 펫 진화 자동 검증

---

## 9. 디렉토리 구조 (이 세션에서 만들어진 모든 것)

```
/Users/ijeong-geun/
├── revenue-ops/                              매출 작업 메인 폴더
│   ├── promptbase-stockpile/                 25 PromptBase prompts
│   ├── n8n-templates/                        5 n8n templates
│   ├── product-assets/                       BUNDLE.zip 등
│   ├── automation/                           launchd monitor, sync watcher
│   ├── marketing-copy/                       7 marketing posts
│   ├── listings/                             결제 채널 listing 카피
│   ├── case-study/                           Codex 자율 매출 실험 분석
│   ├── TELEGRAM_SIGNUP_GUIDE.md              가입 가이드
│   ├── AFTER_SIGNUP_AUTOMATION.md            가입 후 자동화 매뉴얼
│   └── STATUS_NOW.md                         현재 상태
├── workpet/                                  다마고치 프로젝트 (iOS 앱)
│   ├── backend/                              Python FastAPI
│   ├── apps/ios/WorkPet.xcodeproj            Xcode 프로젝트
│   ├── apps/web/                             React/Vite 대시보드
│   └── docs/                                 App Store readiness
├── Documents/IdeaVault/                      옵시디언 vault (9,287 노트)
└── .openclaw/workspace/skills/               16 OpenClaw skills

/tmp/founderpet/                              ← 이 프로젝트 (current working)
├── src/
│   ├── app/
│   │   ├── page.tsx                          메인 대시보드
│   │   ├── leaderboard/page.tsx              풀 leaderboard
│   │   ├── u/[handle]/page.tsx               공개 프로필
│   │   ├── layout.tsx                        OG metadata
│   │   └── api/
│   │       ├── pet/route.ts                  GET/POST Pet API
│   │       ├── leaderboard/route.ts          Leaderboard JSON
│   │       └── webhook/
│   │           ├── stripe/route.ts           Stripe HMAC
│   │           └── github/route.ts           GitHub HMAC SHA256
│   ├── components/
│   │   ├── Pet3D.tsx                         R3F 3D 펫 (stage별 매핑)
│   │   ├── Leaderboard.tsx                   Top-10 + realtime
│   │   └── RevenueIntegrations.tsx           8 providers
│   └── lib/
│       ├── pet-engine.ts                     성장 로직
│       ├── pet-engine.test.ts                18 vitest tests
│       └── mock-leaderboard.ts               mock 데이터
├── public/models/                            6 GLTF (Poly Pizza CC0/CC-BY)
├── README.md                                 영문 + 한국어
├── PROJECT_BRIEF.md                          이 문서
└── .github/FUNDING.yml                       Sponsor button
```

---

## 10. 한 줄 요약

**3일 자율 매출 실패 ($0) → 옵시디언 vault 9,287 노트 깊이 분석 → 다마고치 프로젝트(WorkPet) 재발견 → AI-tamago MIT base에 사용자 워크펫 pet engine 포팅 → 자연스러운 fantasy 진화 흐름(Egg→Chick→Bird→Eagle→Griffin→Dragon)으로 6 GLTF 모델 통합 → 18 unit tests 통과 + production build → 실시간 leaderboard + Stripe/GitHub HMAC webhook + 공개 프로필 → Cloudflare tunnel로 public URL 라이브 → iPhone 빌드는 사용자 Xcode UI 1번 클릭 대기.**

viral 메시지: **"애플워치 집에서 놀리지 말고 여기다 활용해서 돈 벌어보세요."**

---

## 11. 메모 — 사용자 피드백 누적

세션 동안 사용자가 짚은 정정 사항 (이후 재현 안 되게):

1. ❌ "스킬을 돈 받고 파는 게 말이 되나? 내 거보다 더 퀄리티 좋은 게 깃헙에 널렸는데" → ClawHub paid skills 추천 폐기
2. ❌ "한국어 프롬프트팩을 돈 주고 팔겠다는 게 맞나" → 한국어 PromptBase pack 폐기 (시장 작음)
3. ❌ "장난하냐 1달 1건이면 너무 그지 같은데" → 더 깊이 매출 채널 search (n8n templates, 크몽 등)
4. ❌ "개 구린 모델 쓰지 말고 최신 모델을 써야지" → 모든 prompt 최신 모델 (Claude Opus 4.7, GPT-5.5, MJ v7, Veo 3) 업데이트
5. ❌ "장난하냐 소라2는 없어졌는데" → Sora 2 폐기 (2026-04-26) 반영, Veo 3 + Kling AI로 교체
6. ❌ "너무 펫 디자인 자체가 조잡해" → procedural primitives 폐기, GLTF 모델로 교체
7. ❌ "중간에 펭귄이랑 부엉이는 좀 아닌듯 자연스럽게 드래곤으로 진화" → Eagle/Griffin/Dragon 자연 흐름으로 교체
8. ❌ "지금 용이 축소해서 전체를 볼 수 없고" → stage별 카메라/줌 매핑
9. ❌ "구현능력이 한참 모자른거 같은데 부족한거 알아서 점검해서" → 18 tests + production build + API routes + public pages 모두 채움

이 9개를 미래에도 깨지지 않게 유지.
