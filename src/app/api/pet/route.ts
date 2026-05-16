import { NextResponse } from "next/server";
import {
  calculateGrowth,
  TaskStatus,
  MetricType,
  type Task,
  type ApprovalEvent,
  type MetricEvent,
  type AgentRun,
} from "@/lib/pet-engine";

/**
 * Pet snapshot API.
 *
 * GET  /api/pet?userId=xxx → current snapshot
 * POST /api/pet/event       → record a new event (task/metric/agent_run/approval)
 *
 * Apple Watch app polls GET every 60s.
 * Web dashboard polls every 5s while open.
 *
 * Production: query events from Supabase, run calculateGrowth on the fly,
 * cache snapshot in Redis (Upstash) for 30s.
 */

// Mock event store (in-memory). Replace with Supabase in production.
const mockEvents: Record<string, { tasks: Task[]; approvals: ApprovalEvent[]; metrics: MetricEvent[]; agentRuns: AgentRun[] }> = {};

function ensure(userId: string) {
  if (!mockEvents[userId]) {
    mockEvents[userId] = { tasks: [], approvals: [], metrics: [], agentRuns: [] };
  }
  return mockEvents[userId];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "demo";
  const data = ensure(userId);
  const snapshot = calculateGrowth(data.tasks, data.approvals, data.metrics, data.agentRuns);

  return NextResponse.json({
    userId,
    snapshot,
    cached: false,
    updatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { userId, eventType, payload } = body;
  if (!userId || !eventType) {
    return NextResponse.json({ error: "missing userId or eventType" }, { status: 400 });
  }

  const data = ensure(userId);
  const now = new Date();

  switch (eventType) {
    case "task":
      data.tasks.push({
        id: `t-${Date.now()}`,
        status: (payload?.status as TaskStatus) || TaskStatus.DONE,
        createdAt: now,
        completedAt: payload?.status === TaskStatus.DONE ? now : undefined,
      });
      break;
    case "metric":
      data.metrics.push({
        id: `m-${Date.now()}`,
        type: (payload?.type as MetricType) || MetricType.MANUAL_REVENUE,
        value: payload?.value || 0,
        recordedAt: now,
      });
      break;
    case "agent_run":
      data.agentRuns.push({
        id: `a-${Date.now()}`,
        agentName: payload?.agentName || "claude",
        success: payload?.success !== false,
        startedAt: now,
        finishedAt: now,
      });
      break;
    case "github_commit":
      data.metrics.push({
        id: `m-${Date.now()}`,
        type: MetricType.GITHUB_COMMITS,
        value: payload?.count || 1,
        recordedAt: now,
      });
      break;
    default:
      return NextResponse.json({ error: "unknown eventType" }, { status: 400 });
  }

  const snapshot = calculateGrowth(data.tasks, data.approvals, data.metrics, data.agentRuns);

  return NextResponse.json({
    ok: true,
    userId,
    eventType,
    snapshot,
  });
}
