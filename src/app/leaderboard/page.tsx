"use client";

import Link from "next/link";
import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#08080d] text-zinc-100 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/[0.08] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/[0.06] rounded-full blur-[100px]" />
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Back to dashboard
            </Link>
            <h1 className="text-4xl font-semibold tracking-tight mt-2">Public Leaderboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Top founders by EXP. Updates every 4 seconds.</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700">All time</button>
            <button className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700">Month</button>
            <button className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700">Week</button>
          </div>
        </header>
        <Leaderboard />
      </div>
    </main>
  );
}
