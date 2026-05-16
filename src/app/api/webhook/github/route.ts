import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GitHub webhook receiver.
 * Triggered on: push, pull_request.merged
 *
 * Setup:
 *   1. GitHub repo settings → Webhooks → Add webhook
 *   2. Payload URL: https://yourdomain.com/api/webhook/github
 *   3. Content-Type: application/json
 *   4. Secret: matches GITHUB_WEBHOOK_SECRET env var
 *   5. Events: Push, Pull requests
 *
 * Each commit → +2 EXP (per pet-engine)
 * Each merged PR → +20 EXP (treated as PUBLISHED_CONTENT)
 */

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";

function verifyGithubSignature(payload: string, signature: string | null): boolean {
  if (!GITHUB_WEBHOOK_SECRET) return process.env.NODE_ENV !== "production";
  if (!signature) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  if (!verifyGithubSignature(payload, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let body: any;
  try {
    body = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Map GitHub username → founderpet user
  // In production: look up via integrations table
  const githubUsername = body.sender?.login;
  if (!githubUsername) {
    return NextResponse.json({ received: true, ignored: true });
  }

  let expGained = 0;
  let metricType = "github_commits";

  switch (event) {
    case "push": {
      const commits = body.commits?.length || 0;
      expGained = commits * 2;
      metricType = "github_commits";
      break;
    }
    case "pull_request": {
      if (body.action === "closed" && body.pull_request?.merged) {
        expGained = 20;
        metricType = "published_content";
      }
      break;
    }
    default:
      return NextResponse.json({ received: true, ignored: true, event });
  }

  if (expGained === 0) {
    return NextResponse.json({ received: true, ignored: true });
  }

  // TODO: persist event + look up founderpet user from github_username
  return NextResponse.json({
    received: true,
    githubUsername,
    event,
    metricType,
    expGained,
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "github-webhook",
    events: ["push", "pull_request"],
    method: "POST",
    docs: "https://github.com/duct-tape2/founderpet#github-integration",
  });
}
