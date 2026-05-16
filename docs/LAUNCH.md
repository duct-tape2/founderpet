# FounderPet — Launch (Pricing + Copy)

> Pricing is intentional but not yet enforced in code. This document is the source of truth for marketing copy and the pricing schedule we'll wire into Stripe products when we ship paid tiers.

## One-liner

> 솔로 파운더의 사업 진행도를 손목에서 3초 안에 확인하는 3D 펫. 깃허브 커밋, AI 에이전트 실행, 실제 매출이 모여 펫을 알에서 드래곤까지 진화시킨다.

## Viral hook (반드시 보존)

> 애플워치 집에서 놀리지 말고 여기다 활용해서 돈 벌어보세요.

## Supporting copy (Korean)

- 사업이 자라면 펫도 자란다.
- 오늘 커밋했나? 매출 났나? AI agent가 일했나? 손목에서 3초면 보인다.
- Stripe, GitHub, Claude/Codex/n8n 신호를 하나의 펫으로.
- 가짜 매출은 펫을 못 키운다. Verified만 점수에 들어간다.

## Supporting copy (English)

- Your business grows. So does your pet.
- Did you ship? Did money move? Did your agent work? Three seconds on your wrist.
- Real signals only. Manual revenue is discounted so the leaderboard can't be farmed.
- Stripe + GitHub + Claude / Codex / n8n — one pet, one wrist, one truth.

## Pricing schedule (planned)

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0 / mo | Demo pet, manual events via UI buttons, public profile, read-only Watch payload |
| **Founder** | $9 / mo | Stripe webhook (verified revenue), GitHub webhook (verified commits), Apple Watch payload polling, trust-weighted leaderboard, EventFeed audit, BusinessPulse, LaunchChecklist |
| **Studio** | $29 / mo | Everything in Founder + multiple FounderPet identities, custom event sources, longer history, priority support, early access to native Watch builds |

### Why $9

- The verified-only feature set replaces ~$20 of separate "founder dashboard" tools (Plausible-light + GitHub commit board + Stripe MRR widget) for a solo dev.
- $9 is the lowest credible monthly price that still telegraphs "this is a real product, not a free toy."
- Annual: $90/yr (2 months free).

### Why $29

- Multi-project + custom sources land at the "indie studio with 3+ projects" psychographic.
- This is also the natural target for the WorkPet iOS / Apple Watch app once it goes paid.

### Not in pricing yet (intentional)

- LLM-driven "next best action coaching" — keep it as a free differentiator until v0.3.
- NFT / token / on-chain — out of scope forever for this product line.

## Free → Founder upsell triggers (UI hooks)

Show a soft prompt in these states (`LaunchChecklist` already exposes the data):

- After the user has logged 3+ manual revenue events → "Connect Stripe to make these count"
- After the user has logged a commit manually → "Wire GitHub webhook to do this automatically"
- After 7 consecutive `streakDays` with manual-only data → "Verified signals would unlock leaderboard placement"

## Launch checklist (marketing side)

- [ ] Twitter/X thread draft (3-4 tweets, lead with Watch screenshot of `/api/watch` payload)
- [ ] Product Hunt page draft
- [ ] Show HN post draft
- [ ] r/sideproject post
- [ ] r/indiehackers post
- [ ] Korean GeekNews 게시글 초안
- [ ] 한국 인디해커 톡방 1곳 골라서 prelaunch 공유
- [ ] FounderPet 단독 도메인 (founderpet.dev) 점유 / Vercel custom domain 연결

## Distribution levers (low-cost)

1. **3D pet evolution GIF**: one short clip of egg → dragon. The dragon is the punchline.
2. **"Why your pet didn't grow"** screenshot: BusinessPulse + Risk Flags. Shows the product's honest signal.
3. **Apple Watch glance still**: ringPercent + 1 headline + 1 nextAction. Shows the 3-second promise.
4. **Public profile link**: `/u/<handle>` — single-URL share so users naturally spread the product.

## Anti-marketing (don't do)

- Don't fake the leaderboard.
- Don't show a sparkly pet with no real data underneath; the EventFeed must be visible.
- Don't pretend the Watch app is native today — it's a payload + WorkPet integration path.
- Don't hide demo mode.
