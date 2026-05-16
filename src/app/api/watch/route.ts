import { NextResponse } from "next/server";
import { getPetState } from "@/lib/pet-store";
import { buildWatchPayload } from "@/lib/watch-payload";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "demo";
  const state = await getPetState(userId);
  const payload = buildWatchPayload(state);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
