import { NextResponse } from "next/server";
import { EventSource, FounderEventKind } from "@/lib/pet-engine";
import { getRecentEvents, recordFounderEvent, verifyIngestSecret } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function isFounderEventKind(value: unknown): value is FounderEventKind {
  return typeof value === "string" && Object.values(FounderEventKind).includes(value as FounderEventKind);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "demo";
  const limit = Number(searchParams.get("limit") ?? 20);
  const events = await getRecentEvents(userId, Number.isFinite(limit) ? limit : 20);
  return NextResponse.json({ ok: true, userId, events }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!verifyIngestSecret(request)) return jsonError("Invalid FounderPet ingest secret", 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const userId = String(body.userId ?? body.user_id ?? "").trim();
  if (!userId) return jsonError("userId is required");

  const kind = body.kind ?? body.eventType ?? body.type;
  if (!isFounderEventKind(kind)) {
    return jsonError(`kind must be one of: ${Object.values(FounderEventKind).join(", ")}`);
  }

  const idempotencyKey = request.headers.get("x-idempotency-key") ?? body.externalId ?? body.external_id;
  const value = body.value === undefined ? 1 : Number(body.value);
  if (!Number.isFinite(value) || value < 0) return jsonError("value must be a non-negative number");

  const result = await recordFounderEvent({
    id: body.id,
    userId,
    kind,
    source: body.source ?? EventSource.API,
    value,
    currency: body.currency,
    verified: Boolean(body.verified),
    confidence: body.confidence === undefined ? undefined : Number(body.confidence),
    externalId: idempotencyKey ?? undefined,
    occurredAt: body.occurredAt ?? body.occurred_at ?? new Date().toISOString(),
    metadata: body.metadata ?? {},
  });

  return NextResponse.json(
    {
      ok: true,
      duplicate: result.duplicate,
      event: result.event,
      pet: result.state.snapshot,
      profile: result.state.profile,
    },
    { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store" } },
  );
}
