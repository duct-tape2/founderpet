import crypto from "crypto";
import { NextResponse } from "next/server";
import { EventSource, FounderEventKind } from "@/lib/pet-engine";
import { recordFounderEvent } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

function safeEqual(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyGitHubSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature?.startsWith("sha256=")) return false;

  const actual = signature.slice("sha256=".length);
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, actual);
}

function githubUserId(payload: any): string {
  return (
    payload.repository?.owner?.login ??
    payload.sender?.login ??
    payload.pusher?.name ??
    "demo"
  ).toString();
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const deliveryId = request.headers.get("x-github-delivery") ?? undefined;
  const githubEvent = request.headers.get("x-github-event") ?? "unknown";

  if (!verifyGitHubSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid GitHub signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (githubEvent !== "push") {
    return NextResponse.json({ ok: true, ignored: true, event: githubEvent });
  }

  const commits = Array.isArray(payload.commits) ? payload.commits.length : 0;
  if (commits <= 0) return NextResponse.json({ ok: true, ignored: true, reason: "no_commits" });

  const result = await recordFounderEvent({
    userId: githubUserId(payload),
    kind: FounderEventKind.GITHUB_COMMIT,
    source: EventSource.GITHUB,
    value: commits,
    verified: true,
    confidence: 1,
    externalId: deliveryId ?? payload.after,
    occurredAt: new Date().toISOString(),
    metadata: {
      repo: payload.repository?.full_name ?? null,
      branch: String(payload.ref ?? "").replace("refs/heads/", ""),
      before: payload.before ?? null,
      after: payload.after ?? null,
      pusher: payload.pusher?.name ?? null,
    },
  });

  return NextResponse.json({ ok: true, duplicate: result.duplicate, event: result.event, pet: result.state.snapshot });
}
