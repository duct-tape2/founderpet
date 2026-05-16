import type { GrowthSnapshot } from "@/lib/pet-engine";

interface CheckItem {
  label: string;
  done: boolean;
  detail: string;
}

function statusText(done: boolean): string {
  return done ? "READY" : "TODO";
}

export default function LaunchChecklist({ snapshot }: { snapshot: GrowthSnapshot }) {
  const checks: CheckItem[] = [
    {
      label: "검증 가능한 수익 신호",
      done: snapshot.verifiedRevenue > 0,
      detail: snapshot.verifiedRevenue > 0 ? "Stripe/검증 소스 매출 반영됨" : "Stripe · Polar · Gumroad 중 1개 연결 필요",
    },
    {
      label: "빌드 신호",
      done: snapshot.today.commits > 0 || snapshot.businessPulse.buildScore >= 40,
      detail: snapshot.today.commits > 0 ? `${snapshot.today.commits} commits today` : "GitHub webhook으로 커밋 자동 반영 필요",
    },
    {
      label: "AI 자동화 신호",
      done: snapshot.today.agentRuns > 0,
      detail: snapshot.today.agentRuns > 0 ? `${snapshot.today.agentRuns} agent runs today` : "Claude/Codex/n8n run event 연결 필요",
    },
    {
      label: "리더보드 신뢰도",
      done: snapshot.trustScore >= 70,
      detail: `trust score ${snapshot.trustScore}/100 · manual revenue는 할인됨`,
    },
    {
      label: "워치 3초 payload",
      done: true,
      detail: "GET /api/watch?userId=demo 에서 complication용 compact JSON 제공",
    },
  ];

  return (
    <section className="rounded-2xl border border-zinc-800/70 bg-zinc-900/45 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">Launch Checklist</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-100">부끄럽지 않게 공개하기 위한 최소 기준</h2>
        </div>
        <div className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-mono text-zinc-300">
          {checks.filter((check) => check.done).length}/{checks.length}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/35 p-3">
            <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${check.done ? "bg-emerald-400" : "bg-zinc-600"}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-zinc-200">{check.label}</div>
                <div className={`text-[10px] font-mono ${check.done ? "text-emerald-300" : "text-zinc-500"}`}>{statusText(check.done)}</div>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
