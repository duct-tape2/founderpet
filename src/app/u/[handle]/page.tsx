import Link from "next/link";
import Pet3D from "@/components/Pet3D";
import BusinessPulse from "@/components/BusinessPulse";
import EventFeed from "@/components/EventFeed";
import WatchGlance from "@/components/WatchGlance";
import { getPetStateByHandle } from "@/lib/pet-store";
import { buildWatchPayload } from "@/lib/watch-payload";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: { handle: string } }) {
  const state = await getPetStateByHandle(params.handle);
  const payload = buildWatchPayload(state);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080d] text-zinc-100 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/[0.08] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-purple-500/[0.06] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
              ← Back to FounderPet
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-2xl">
                {state.profile.avatarEmoji}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">@{state.profile.handle}</h1>
                <p className="text-sm text-zinc-500">{state.profile.projectName}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/45 px-4 py-3 text-right backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Public Proof</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-100">L{state.snapshot.level} · {state.snapshot.stageLabel}</div>
            <div className="text-xs text-zinc-500">Trust {state.snapshot.trustScore}/100 · Score {state.snapshot.leaderboardScore}</div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Pet3D stage={state.snapshot.stage} mood={state.snapshot.mood} level={state.snapshot.level} />
            <BusinessPulse snapshot={state.snapshot} />
            <EventFeed events={state.events} snapshot={state.snapshot} />
          </div>
          <aside className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/45 p-5 backdrop-blur-xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Metrics</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="EXP" value={state.snapshot.exp.toLocaleString()} />
                <Metric label="Mood" value={state.snapshot.mood} />
                <Metric label="Verified" value={`$${Math.round(state.snapshot.verifiedRevenue)}`} />
                <Metric label="Streak" value={`${state.snapshot.streakDays}d`} />
              </div>
            </div>
            <WatchGlance payload={payload} />
          </aside>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">{label}</div>
      <div className="mt-1 text-sm font-medium text-zinc-200">{value}</div>
    </div>
  );
}
