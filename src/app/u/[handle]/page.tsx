"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MOCK_LEADERBOARD, formatRevenue, stageEmoji } from "@/lib/mock-leaderboard";
import { PetStage } from "@/lib/pet-engine";

const Pet3D = dynamic(() => import("@/components/Pet3D"), { ssr: false });

export default function PublicProfile() {
  const params = useParams();
  const handle = params?.handle as string;
  const entry = MOCK_LEADERBOARD.find((e) => e.handle.replace("@", "") === handle);

  if (!entry) {
    return (
      <main className="min-h-screen bg-[#08080d] text-zinc-100 antialiased flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Pet not found</h1>
          <p className="text-zinc-500 mt-2">@{handle} has not claimed their pet yet.</p>
          <Link href="/" className="inline-block mt-6 text-sm text-amber-400 hover:underline">
            ← Back to FounderPet
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08080d] text-zinc-100 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/[0.06] rounded-full blur-[120px]" />
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Back
        </Link>

        <header className="mt-4 mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-3xl relative">
            {entry.avatar}
            {entry.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{entry.handle}</h1>
              <span className="text-2xl">{stageEmoji(entry.stage)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                #{entry.rank}
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-1">{entry.projectName}</p>
          </div>
        </header>

        <Pet3D stage={entry.stage} mood={entry.mood} level={entry.level} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Stat label="LEVEL" value={`L${entry.level}`} />
          <Stat label="STAGE" value={entry.stage.replace(/_/g, " ")} small />
          <Stat label="MRR" value={formatRevenue(entry.monthlyRevenue)} accent="text-emerald-300" />
          <Stat label="TOTAL" value={formatRevenue(entry.totalRevenue)} accent="text-amber-300" />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <Stat label="COMMITS" value={entry.commits.toLocaleString()} />
          <Stat label="AGENT RUNS" value={entry.agentRuns.toLocaleString()} />
          <Stat label="7D Δ" value={`${entry.weeklyDelta > 0 ? "+" : ""}${entry.weeklyDelta.toFixed(1)}%`} accent={entry.weeklyDelta > 0 ? "text-emerald-300" : "text-red-300"} />
        </div>

        <div className="mt-8 p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60">
          <h2 className="text-sm font-medium text-zinc-300 mb-2">Share this pet</h2>
          <code className="block text-xs text-zinc-500 font-mono break-all">
            {typeof window !== "undefined" ? window.location.href : `https://founderpet.dev/u/${handle}`}
          </code>
        </div>

        <footer className="mt-12 text-center text-zinc-600 text-xs">
          Make your own pet at <Link href="/" className="text-amber-400 hover:underline">founderpet</Link>
        </footer>
      </div>
    </main>
  );
}

function Stat({ label, value, accent = "text-zinc-100", small = false }: { label: string; value: string; accent?: string; small?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500 mb-1">{label}</div>
      <div className={`font-semibold tracking-tight ${accent} ${small ? "text-sm" : "text-xl"}`}>{value}</div>
    </div>
  );
}
