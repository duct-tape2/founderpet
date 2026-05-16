"use client";

import { useEffect, useState } from "react";
import { MOCK_LEADERBOARD, formatRevenue, stageEmoji, type LeaderboardEntry } from "@/lib/mock-leaderboard";

export default function Leaderboard() {
  const [board, setBoard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);

  // Simulate realtime updates - random tiny variations every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setBoard((prev) =>
        prev
          .map((entry) => {
            const delta = (Math.random() - 0.45) * 50;
            return {
              ...entry,
              exp: Math.max(0, entry.exp + Math.floor(delta)),
              monthlyRevenue: Math.max(0, entry.monthlyRevenue + Math.floor(delta * 10)),
              commits: entry.commits + (Math.random() > 0.6 ? 1 : 0),
              agentRuns: entry.agentRuns + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0),
            };
          })
          .sort((a, b) => b.exp - a.exp)
          .map((entry, i) => ({ ...entry, rank: i + 1 })),
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-zinc-200">Live Leaderboard</h2>
          </div>
          <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-mono">
            Top Founders · Real Revenue
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          UPDATING
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[40px_1fr_80px_100px_60px_60px] gap-3 px-5 py-2 text-[10px] uppercase tracking-wider text-zinc-600 font-mono border-b border-zinc-900">
        <div>#</div>
        <div>Founder · Project</div>
        <div className="text-right">Level</div>
        <div className="text-right">MRR</div>
        <div className="text-right">EXP</div>
        <div className="text-right">7d</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-zinc-900/80">
        {board.slice(0, 10).map((entry) => (
          <Row key={entry.handle} entry={entry} highlighted={entry.handle === "@duct-tape2"} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
        <span className="text-zinc-500">Showing top 10 · </span>
        <button className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
          View all 1,247 founders →
        </button>
      </div>
    </div>
  );
}

function Row({ entry, highlighted }: { entry: LeaderboardEntry; highlighted?: boolean }) {
  return (
    <div
      className={`grid grid-cols-[40px_1fr_80px_100px_60px_60px] gap-3 px-5 py-3 items-center transition-all duration-300 ${
        highlighted ? "bg-amber-500/[0.06] ring-1 ring-inset ring-amber-500/20" : "hover:bg-zinc-800/30"
      }`}
    >
      {/* Rank */}
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-mono ${
          entry.rank === 1 ? "text-amber-400" :
          entry.rank === 2 ? "text-zinc-300" :
          entry.rank === 3 ? "text-orange-400" :
          "text-zinc-600"
        }`}>
          {entry.rank.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Founder + Project */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-base shrink-0 relative">
          {entry.avatar}
          {entry.online && (
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-medium ${highlighted ? "text-amber-200" : "text-zinc-200"}`}>
              {entry.handle}
            </span>
            <span className="text-base leading-none">{stageEmoji(entry.stage)}</span>
          </div>
          <div className="text-[11px] text-zinc-500 truncate">{entry.projectName}</div>
        </div>
      </div>

      {/* Level */}
      <div className="text-right">
        <div className="text-sm font-mono text-zinc-200">L{entry.level}</div>
        <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">{entry.stage.split("_")[0].toLowerCase()}</div>
      </div>

      {/* Monthly Revenue */}
      <div className="text-right">
        <div className="text-sm font-mono text-emerald-300">{formatRevenue(entry.monthlyRevenue)}</div>
        <div className="text-[10px] text-zinc-600 font-mono">/ mo</div>
      </div>

      {/* EXP */}
      <div className="text-right text-sm font-mono text-zinc-400">{entry.exp.toLocaleString()}</div>

      {/* Weekly delta */}
      <div className="text-right">
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-mono ${
            entry.weeklyDelta > 0 ? "text-emerald-400" : entry.weeklyDelta < 0 ? "text-red-400" : "text-zinc-500"
          }`}
        >
          {entry.weeklyDelta > 0 ? "↑" : entry.weeklyDelta < 0 ? "↓" : "−"}
          {Math.abs(entry.weeklyDelta).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
