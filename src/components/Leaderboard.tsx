"use client";

import { useEffect, useMemo, useState } from "react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  handle: string;
  displayName: string;
  projectName: string;
  avatarEmoji: string;
  stage: string;
  mood: string;
  level: number;
  exp: number;
  trustScore: number;
  leaderboardScore: number;
  verifiedRevenue: number;
  revenue30d: number;
  streakDays: number;
}

function stageEmoji(stage: string): string {
  if (stage === "DRAGON") return "🐉";
  if (stage === "GRIFFIN") return "✨";
  if (stage === "EAGLE") return "🦅";
  if (stage === "BIRD") return "🐤";
  if (stage === "CHICK") return "🐣";
  return "🥚";
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

const FALLBACK: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "demo",
    handle: "duct-tape2",
    displayName: "Duct Tape Founder",
    projectName: "FounderPet",
    avatarEmoji: "🐉",
    stage: "CHICK",
    mood: "celebrating",
    level: 2,
    exp: 107,
    trustScore: 86,
    leaderboardScore: 461,
    verifiedRevenue: 49,
    revenue30d: 49,
    streakDays: 1,
  },
];

export default function Leaderboard() {
  const [board, setBoard] = useState<LeaderboardEntry[]>(FALLBACK);
  const [status, setStatus] = useState<"loading" | "live" | "fallback">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/leaderboard?limit=10", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : payload.leaderboard;
        if (!cancelled && Array.isArray(rows) && rows.length > 0) {
          setBoard(rows);
          setStatus("live");
        }
      } catch {
        if (!cancelled) setStatus("fallback");
      }
    }

    load();
    const interval = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const highestScore = useMemo(() => Math.max(1, ...board.map((entry) => entry.leaderboardScore)), [board]);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/45 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/70 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${status === "live" ? "bg-emerald-400" : "bg-amber-400"}`} />
            <h2 className="text-sm font-semibold text-zinc-200">Trust-weighted Leaderboard</h2>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Verified revenue + EXP + streak. Manual revenue is discounted.</p>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-600">{status}</div>
      </div>

      <div className="grid grid-cols-[42px_1fr_70px_88px_68px] gap-3 border-b border-zinc-900 px-5 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-600 md:grid-cols-[42px_1fr_70px_96px_80px_70px]">
        <div>#</div>
        <div>Founder</div>
        <div className="text-right">Level</div>
        <div className="text-right">Revenue</div>
        <div className="hidden text-right md:block">Trust</div>
        <div className="text-right">Score</div>
      </div>

      <div className="divide-y divide-zinc-900/80">
        {board.map((entry) => (
          <div
            key={entry.userId}
            className={`grid grid-cols-[42px_1fr_70px_88px_68px] gap-3 px-5 py-3 transition-colors md:grid-cols-[42px_1fr_70px_96px_80px_70px] ${
              entry.handle === "duct-tape2" ? "bg-amber-500/[0.06] ring-1 ring-inset ring-amber-500/20" : "hover:bg-zinc-800/30"
            }`}
          >
            <div className="font-mono text-sm text-zinc-500">{String(entry.rank).padStart(2, "0")}</div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700/70 bg-zinc-950 text-base">
                  {entry.avatarEmoji || stageEmoji(entry.stage)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-zinc-200">@{entry.handle}</span>
                    <span>{stageEmoji(entry.stage)}</span>
                  </div>
                  <div className="truncate text-[11px] text-zinc-500">{entry.projectName}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-zinc-200">L{entry.level}</div>
              <div className="text-[10px] font-mono uppercase text-zinc-600">{entry.mood}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-emerald-300">{money(entry.verifiedRevenue)}</div>
              <div className="text-[10px] font-mono text-zinc-600">30d {money(entry.revenue30d)}</div>
            </div>
            <div className="hidden text-right md:block">
              <div className="font-mono text-sm text-zinc-300">{entry.trustScore}</div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-zinc-100" style={{ width: `${entry.trustScore}%` }} />
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-zinc-300">{entry.leaderboardScore.toLocaleString()}</div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-amber-300" style={{ width: `${(entry.leaderboardScore / highestScore) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800/70 px-5 py-3 text-xs">
        <span className="text-zinc-500">No fake jitter. Rows come from /api/leaderboard.</span>
        <a href="/leaderboard" className="font-medium text-amber-300 hover:text-amber-200">
          View full →
        </a>
      </div>
    </div>
  );
}
