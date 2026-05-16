import type { FounderEvent, GrowthSnapshot } from "@/lib/pet-engine";

function timeAgo(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatKind(kind: string): string {
  return kind.replace(/_/g, " ");
}

export default function EventFeed({ events, snapshot }: { events: FounderEvent[]; snapshot: GrowthSnapshot }) {
  const impactById = new Map(snapshot.eventImpacts.map((impact) => [impact.eventId, impact]));
  const latest = [...events].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 8);

  return (
    <section className="rounded-2xl border border-zinc-800/70 bg-zinc-900/45 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">Audit Feed</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-100">EXP가 왜 올랐는지 보이는 로그</h2>
        </div>
        <div className="text-xs font-mono text-zinc-500">{events.length} events</div>
      </div>

      <div className="mt-4 space-y-2">
        {latest.map((event) => {
          const impact = impactById.get(event.id);
          return (
            <div key={event.id} className="rounded-xl border border-zinc-800/70 bg-zinc-950/35 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium capitalize text-zinc-200">{formatKind(String(event.kind))}</span>
                    <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-zinc-400">
                      {String(event.source)}
                    </span>
                    {event.verified ? (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-emerald-300">
                        verified
                      </span>
                    ) : null}
                    {impact?.capped ? (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-amber-300">
                        capped
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    value {event.value} · {timeAgo(event.occurredAt)} {event.externalId ? `· ${event.externalId}` : ""}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-sm text-zinc-200">+{impact?.awardedExp ?? 0} EXP</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
