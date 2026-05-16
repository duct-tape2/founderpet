import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const leaderboard = await getLeaderboard(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20);

  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      scoring: "EXP weighted by trust + verified revenue + streak. Manual/unverified revenue is discounted.",
      leaderboard,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
