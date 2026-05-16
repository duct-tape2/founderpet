import { NextResponse } from "next/server";
import { getRuntimeMode } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

const STARTED_AT = Date.now();
const VERSION = "0.2.0";

/**
 * GET /api/health
 *
 * Cheap liveness probe. Uptime monitors should hit this. Returns:
 *   - ok          : always true if the process is running
 *   - mode        : "demo" (no Supabase env) or "production" (Supabase wired)
 *   - integrations: which secrets are present (not their values)
 *   - uptimeMs    : ms since this process started
 *   - version     : app marketing version
 *   - commit      : VERCEL_GIT_COMMIT_SHA if running on Vercel, else null
 *   - timestamp   : ISO now
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      mode: getRuntimeMode(),
      version: VERSION,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      uptimeMs: Date.now() - STARTED_AT,
      integrations: {
        supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        githubWebhook: Boolean(process.env.GITHUB_WEBHOOK_SECRET),
        ingestSecret: Boolean(process.env.FOUNDERPET_INGEST_SECRET),
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}
