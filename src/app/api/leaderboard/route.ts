import { NextResponse } from "next/server";
import { getLeaderboard, getRuntimeMode } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const leaderboard = await getLeaderboard(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20);
  const mode = getRuntimeMode();

  return NextResponse.json(
    {
      ok: true,
      mode,
      generatedAt: new Date().toISOString(),
      scoring: "EXP weighted by trust + verified revenue + streak. Manual/unverified revenue is discounted.",
      notice: mode === "demo"
        ? "Demo mode — Supabase is not connected. Numbers are seeded for the demo founder only."
        : undefined,
      leaderboard,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
