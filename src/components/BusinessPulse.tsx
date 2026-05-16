import type { GrowthSnapshot } from "@/lib/pet-engine";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function Gauge({ label, value, caption }: { label: string; value: number; caption?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">{label}</span>
        <span className="text-sm font-mono text-zinc-200">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-zinc-100 transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      {caption ? <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{caption}</p> : null}
    </div>
  );
}

export default function BusinessPulse({ snapshot }: { snapshot: GrowthSnapshot }) {
  const riskFlags = snapshot.businessPulse.riskFlags.slice(0, 3);

  return (
    <section className="rounded-2xl border border-zinc-800/70 bg-zinc-900/45 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">Business Pulse</div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-100">3초 안에 보는 사업 생존 신호</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            단순 EXP가 아니라 검증된 매출, GitHub/AI 실행, 오늘의 momentum, anti-gaming trust를 같이 계산합니다.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-right">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300/70">Verified Revenue</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-100">{money(snapshot.verifiedRevenue)}</div>
          <div className="text-[11px] text-emerald-200/60">Trust {snapshot.trustScore}/100 · Streak {snapshot.streakDays}d</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Gauge label="Build" value={snapshot.businessPulse.buildScore} caption="tasks · commits · AI runs" />
        <Gauge label="Outcome" value={snapshot.businessPulse.outcomeScore} caption="revenue · leads" />
        <Gauge label="Momentum" value={snapshot.businessPulse.momentumScore} caption="fresh signals today" />
        <Gauge label="Launch" value={snapshot.businessPulse.launchReadiness} caption="ready to show users" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 lg:col-span-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-200/70">Next Best Action</div>
          <p className="mt-2 text-sm leading-relaxed text-amber-50">{snapshot.businessPulse.nextBestAction}</p>
        </div>
        <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4 lg:col-span-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Risk Flags</div>
          {riskFlags.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-400">
              {riskFlags.map((flag) => (
                <li key={flag}>• {flag}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">No critical risk flags right now.</p>
          )}
        </div>
      </div>
    </section>
  );
}
