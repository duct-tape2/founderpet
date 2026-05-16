import { NextResponse } from "next/server";
import { EventSource, FounderEventKind } from "@/lib/pet-engine";
import { getPetState, recordFounderEvent, verifyIngestSecret } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

const LEGACY_EVENT_MAP: Record<string, FounderEventKind> = {
  task_done: FounderEventKind.TASK_DONE,
  task_completed: FounderEventKind.TASK_DONE,
  task_blocked: FounderEventKind.TASK_BLOCKED,
  approval: FounderEventKind.APPROVAL,
  revenue: FounderEventKind.REVENUE,
  manual_revenue: FounderEventKind.REVENUE,
  lead: FounderEventKind.LEAD,
  leads: FounderEventKind.LEAD,
  views: FounderEventKind.VIEWS,
  github_commit: FounderEventKind.GITHUB_COMMIT,
  github_commits: FounderEventKind.GITHUB_COMMIT,
  published_content: FounderEventKind.PUBLISHED_CONTENT,
  agent_run: FounderEventKind.AGENT_RUN,
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "demo";
  const state = await getPetState(userId);

  return NextResponse.json(
    {
      ok: true,
      userId,
      profile: state.profile,
      pet: state.snapshot,
      events: state.events.slice(-10).reverse(),
      updatedAt: state.updatedAt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!verifyIngestSecret(request)) return jsonError("Invalid FounderPet ingest secret", 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const userId = String(body.userId ?? body.user_id ?? "demo").trim();
  const rawKind = String(body.kind ?? body.eventType ?? body.type ?? "task_done");
  const kind = LEGACY_EVENT_MAP[rawKind] ?? (Object.values(FounderEventKind).includes(rawKind as FounderEventKind) ? (rawKind as FounderEventKind) : null);
  if (!kind) return jsonError(`Unsupported event type: ${rawKind}`);

  const result = await recordFounderEvent({
    userId,
    kind,
    source: body.source ?? EventSource.MANUAL,
    value: body.value === undefined ? 1 : Number(body.value),
    currency: body.currency,
    verified: Boolean(body.verified),
    confidence: body.confidence === undefined ? undefined : Number(body.confidence),
    externalId: request.headers.get("x-idempotency-key") ?? body.externalId ?? body.external_id,
    occurredAt: body.occurredAt ?? body.occurred_at ?? new Date().toISOString(),
    metadata: body.metadata ?? {},
  });

  return NextResponse.json(
    {
      ok: true,
      duplicate: result.duplicate,
      event: result.event,
      profile: result.state.profile,
      pet: result.state.snapshot,
      updatedAt: result.state.updatedAt,
    },
    { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store" } },
  );
}
