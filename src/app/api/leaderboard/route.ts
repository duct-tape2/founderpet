import { NextResponse } from "next/server";
import { MOCK_LEADERBOARD } from "@/lib/mock-leaderboard";

/**
 * Public leaderboard API.
 *
 * Query params:
 *   ?limit=10 (default 10, max 100)
 *   ?sort=exp|revenue|commits (default: exp)
 *   ?period=all|month|week (default: all)
 *
 * Production: query Supabase materialized view.
 * Current: returns mock data with simulated jitter.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
  const sort = (searchParams.get("sort") || "exp") as "exp" | "revenue" | "commits";

  // Simulate realtime jitter
  const entries = MOCK_LEADERBOARD.map((e) => ({
    ...e,
    exp: e.exp + Math.floor(Math.random() * 50 - 10),
    monthlyRevenue: e.monthlyRevenue + Math.floor(Math.random() * 200 - 50),
  }));

  // Sort
  const sortKey: Record<typeof sort, (e: typeof entries[number]) => number> = {
    exp: (e) => e.exp,
    revenue: (e) => e.monthlyRevenue,
    commits: (e) => e.commits,
  };
  entries.sort((a, b) => sortKey[sort](b) - sortKey[sort](a));

  return NextResponse.json({
    entries: entries.slice(0, limit).map((e, i) => ({ ...e, rank: i + 1 })),
    total: entries.length,
    sort,
    updatedAt: new Date().toISOString(),
  });
}
