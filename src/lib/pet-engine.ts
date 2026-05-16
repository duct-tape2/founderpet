/**
 * FounderPet Growth Engine — market-ready Phase 2
 *
 * This keeps the original WorkPet/Tamagotchi API shape, but adds the pieces a
 * real launch needs: idempotent multi-source events, anti-gaming caps, trust
 * scoring, 3-second Apple Watch payload inputs, and actionable business pulse.
 */

export enum PetStage {
  EGG = "EGG",
  CHICK = "CHICK",
  BIRD = "BIRD",
  EAGLE = "EAGLE",
  GRIFFIN = "GRIFFIN",
  DRAGON = "DRAGON",

  /** Backward-compatible aliases for older components/tests. */
  WORKER_BIRD = "EAGLE",
  FOUNDER_BIRD = "GRIFFIN",
  DRAGON_OR_PHOENIX = "DRAGON",
}

export enum PetMood {
  HAPPY = "happy",
  FOCUSED = "focused",
  CELEBRATING = "celebrating",
  HUNGRY = "hungry",
  TIRED = "tired",
  BLOCKED = "blocked",
}

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  DONE = "done",
  BLOCKED = "blocked",
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum MetricType {
  MANUAL_REVENUE = "manual_revenue",
  AD_REVENUE = "ad_revenue",
  AFFILIATE_REVENUE = "affiliate_revenue",
  CONSULTING_REVENUE = "consulting_revenue",
  APP_REVENUE = "app_revenue",
  CONTENT_REVENUE = "content_revenue",
  LEADS = "leads",
  VIEWS = "views",
  GITHUB_COMMITS = "github_commits",
  PUBLISHED_CONTENT = "published_content",
}

export enum FounderEventKind {
  TASK_STARTED = "task_started",
  TASK_DONE = "task_done",
  TASK_BLOCKED = "task_blocked",
  APPROVAL = "approval",
  REVENUE = "revenue",
  LEAD = "lead",
  VIEWS = "views",
  GITHUB_COMMIT = "github_commit",
  PUBLISHED_CONTENT = "published_content",
  AGENT_RUN = "agent_run",
  INTEGRATION_CONNECTED = "integration_connected",
}

export enum EventSource {
  MANUAL = "manual",
  STRIPE = "stripe",
  GUMROAD = "gumroad",
  POLAR = "polar",
  LEMON_SQUEEZY = "lemon_squeezy",
  PAYPAL = "paypal",
  GITHUB = "github",
  GITHUB_SPONSORS = "github_sponsors",
  CLAUDE = "claude",
  CODEX = "codex",
  N8N = "n8n",
  API = "api",
}

export interface Task {
  id: string;
  status: TaskStatus;
  completedAt?: Date;
  createdAt: Date;
}

export interface ApprovalEvent {
  id: string;
  status: ApprovalStatus;
  riskLevel: RiskLevel;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface MetricEvent {
  id: string;
  type: MetricType;
  value: number;
  recordedAt: Date;
}

export interface AgentRun {
  id: string;
  agentName: string;
  success: boolean;
  startedAt: Date;
  finishedAt?: Date;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface FounderEvent {
  id: string;
  userId: string;
  kind: FounderEventKind | `${FounderEventKind}`;
  source: EventSource | `${EventSource}` | string;
  value: number;
  occurredAt: Date | string;
  currency?: string;
  verified?: boolean;
  confidence?: number; // 0..1; low for manual, high for HMAC/OAuth webhooks
  externalId?: string;
  metadata?: Record<string, JsonValue>;
}

export interface EventImpact {
  eventId: string;
  kind: string;
  source: string;
  rawExp: number;
  awardedExp: number;
  dailyCap: number | null;
  capped: boolean;
}

export interface GrowthSnapshot {
  exp: number;
  level: number;
  stage: PetStage;
  stageLabel: string;
  mood: PetMood;
  hunger: number;
  energy: number;
  focusScore: number;
  businessHealthScore: number;
  nextEvolutionRequirement: string;
  progressToNextLevel: number;
  progressToNextStage: number;
  trustScore: number;
  streakDays: number;
  totalRevenue: number;
  verifiedRevenue: number;
  revenue30d: number;
  leaderboardScore: number;
  eventImpacts: EventImpact[];
  today: {
    revenue: number;
    verifiedRevenue: number;
    tasksDone: number;
    blockedTasks: number;
    commits: number;
    agentRuns: number;
    leads: number;
  };
  businessPulse: {
    buildScore: number;
    outcomeScore: number;
    momentumScore: number;
    launchReadiness: number;
    nextBestAction: string;
    riskFlags: string[];
  };
}

const REVENUE_TYPES = new Set<MetricType>([
  MetricType.MANUAL_REVENUE,
  MetricType.AD_REVENUE,
  MetricType.AFFILIATE_REVENUE,
  MetricType.CONSULTING_REVENUE,
  MetricType.APP_REVENUE,
  MetricType.CONTENT_REVENUE,
]);

const STAGE_THRESHOLDS: Array<{ stage: PetStage; label: string; minExp: number; level: number }> = [
  { stage: PetStage.EGG, label: "Egg", minExp: 0, level: 1 },
  { stage: PetStage.CHICK, label: "Chick", minExp: 100, level: 2 },
  { stage: PetStage.BIRD, label: "Bird", minExp: 300, level: 4 },
  { stage: PetStage.EAGLE, label: "Eagle", minExp: 700, level: 8 },
  { stage: PetStage.GRIFFIN, label: "Griffin", minExp: 1200, level: 13 },
  { stage: PetStage.DRAGON, label: "Dragon", minExp: 2000, level: 21 },
];

const DAILY_EXP_CAPS: Partial<Record<FounderEventKind, number>> = {
  [FounderEventKind.TASK_DONE]: 200,
  [FounderEventKind.APPROVAL]: 180,
  [FounderEventKind.REVENUE]: 1000,
  [FounderEventKind.LEAD]: 300,
  [FounderEventKind.VIEWS]: 120,
  [FounderEventKind.GITHUB_COMMIT]: 200,
  [FounderEventKind.PUBLISHED_CONTENT]: 240,
  [FounderEventKind.AGENT_RUN]: 80,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

function clampFloat(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function nonNegativeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function toDate(date: Date | string | undefined, fallback: Date): Date {
  if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
  if (typeof date === "string") {
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

function hoursAgo(date: Date | string | undefined, now: Date): number {
  const parsed = toDate(date, now);
  return (now.getTime() - parsed.getTime()) / (1000 * 60 * 60);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function eventKey(event: FounderEvent): string {
  if (event.externalId) return `${event.userId}:${event.source}:${event.externalId}`;
  return `${event.userId}:${event.id}`;
}

function normalizeKind(kind: FounderEvent["kind"]): FounderEventKind {
  const raw = String(kind) as FounderEventKind;
  if (Object.values(FounderEventKind).includes(raw)) return raw;
  return FounderEventKind.AGENT_RUN;
}

function stageForExp(exp: number): { stage: PetStage; label: string; minExp: number; level: number } {
  const safeExp = Math.max(0, Math.floor(exp));
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (safeExp >= STAGE_THRESHOLDS[i].minExp) return STAGE_THRESHOLDS[i];
  }
  return STAGE_THRESHOLDS[0];
}

export function stageForLevel(level: number): PetStage {
  if (level <= 1) return PetStage.EGG;
  if (level <= 3) return PetStage.CHICK;
  if (level <= 7) return PetStage.BIRD;
  if (level <= 12) return PetStage.EAGLE;
  if (level <= 20) return PetStage.GRIFFIN;
  return PetStage.DRAGON;
}

function nextStageForExp(exp: number): { stage: PetStage; label: string; minExp: number; level: number } | null {
  return STAGE_THRESHOLDS.find((threshold) => exp < threshold.minExp) ?? null;
}

function defaultConfidence(source: string, verified: boolean | undefined): number {
  if (verified) return 1;
  if (source === EventSource.MANUAL) return 0.65;
  if (source === EventSource.API) return 0.75;
  return 0.85;
}

function sourceIsVerifiedByDefault(source: string): boolean {
  return [
    EventSource.STRIPE,
    EventSource.GITHUB,
    EventSource.GITHUB_SPONSORS,
    EventSource.POLAR,
    EventSource.PAYPAL,
    EventSource.GUMROAD,
    EventSource.LEMON_SQUEEZY,
  ].includes(source as EventSource);
}

export function calculateEventExp(event: FounderEvent): number {
  const kind = normalizeKind(event.kind);
  const value = nonNegativeNumber(event.value);
  const source = String(event.source);
  const verified = Boolean(event.verified || sourceIsVerifiedByDefault(source));
  const confidence = clampFloat(event.confidence ?? defaultConfidence(source, verified));
  const manualRevenuePenalty = kind === FounderEventKind.REVENUE && source === EventSource.MANUAL ? 0.75 : 1;
  const confidenceMultiplier = verified ? 1 : Math.max(0.45, confidence) * manualRevenuePenalty;

  switch (kind) {
    case FounderEventKind.TASK_DONE:
      return 10;
    case FounderEventKind.TASK_STARTED:
      return 0;
    case FounderEventKind.TASK_BLOCKED:
      return 0;
    case FounderEventKind.APPROVAL:
      return value >= 4 ? 30 : value >= 3 ? 15 : 5;
    case FounderEventKind.REVENUE:
      return Math.round(Math.min(value, 500) * confidenceMultiplier);
    case FounderEventKind.LEAD:
      return Math.round(value * 3 * confidenceMultiplier);
    case FounderEventKind.VIEWS:
      return Math.floor(value / 100);
    case FounderEventKind.GITHUB_COMMIT:
      return Math.round(value * 2 * confidenceMultiplier);
    case FounderEventKind.PUBLISHED_CONTENT:
      return Math.round(value * 20 * confidenceMultiplier);
    case FounderEventKind.AGENT_RUN:
      return value > 0 ? Math.max(1, Math.round(value)) : 1;
    case FounderEventKind.INTEGRATION_CONNECTED:
      return 15;
    default:
      return 0;
  }
}

function dedupeEvents(events: FounderEvent[], now: Date): FounderEvent[] {
  const seen = new Set<string>();
  const normalized = events
    .map((event) => ({ ...event, occurredAt: toDate(event.occurredAt, now), value: nonNegativeNumber(event.value) }))
    .filter((event) => event.userId && event.id && event.kind)
    .sort((a, b) => toDate(a.occurredAt, now).getTime() - toDate(b.occurredAt, now).getTime());

  return normalized.filter((event) => {
    const key = eventKey(event);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function calculateImpacts(events: FounderEvent[], now: Date): EventImpact[] {
  const spent = new Map<string, number>();

  return events.map((event) => {
    const kind = normalizeKind(event.kind);
    const rawExp = calculateEventExp(event);
    const cap = DAILY_EXP_CAPS[kind] ?? null;
    const date = toDate(event.occurredAt, now);
    const bucket = `${dayKey(date)}:${event.userId}:${kind}:${event.source}`;
    const alreadySpent = spent.get(bucket) ?? 0;
    const awardedExp = cap === null ? rawExp : Math.max(0, Math.min(rawExp, cap - alreadySpent));
    spent.set(bucket, alreadySpent + awardedExp);

    return {
      eventId: event.id,
      kind,
      source: String(event.source),
      rawExp,
      awardedExp,
      dailyCap: cap,
      capped: awardedExp < rawExp,
    };
  });
}

function countConsecutiveActivityDays(events: FounderEvent[], now: Date): number {
  const activeDays = new Set(
    events
      .filter((event) => calculateEventExp(event) > 0)
      .map((event) => dayKey(toDate(event.occurredAt, now))),
  );

  let streak = 0;
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function calculateTrustScore(events: FounderEvent[], totalRevenue: number, verifiedRevenue: number): number {
  if (events.length === 0) return 35;

  const sources = new Set(events.map((event) => String(event.source)));
  const externalIdCoverage = events.filter((event) => Boolean(event.externalId)).length / events.length;
  const verifiedEvents = events.filter((event) => event.verified || sourceIsVerifiedByDefault(String(event.source))).length;
  const verifiedCoverage = verifiedEvents / events.length;
  const manualRevenue = events
    .filter((event) => normalizeKind(event.kind) === FounderEventKind.REVENUE && String(event.source) === EventSource.MANUAL)
    .reduce((sum, event) => sum + nonNegativeNumber(event.value), 0);
  const manualDominancePenalty = totalRevenue > 0 ? Math.min(25, (manualRevenue / totalRevenue) * 25) : 0;

  const verifiedRevenueScore = verifiedRevenue > 0 ? Math.min(30, 12 + Math.log10(verifiedRevenue + 1) * 8) : 0;
  const diversityScore = Math.min(20, sources.size * 5);
  const provenanceScore = Math.min(20, externalIdCoverage * 20);
  const verifiedSourceScore = Math.min(25, verifiedCoverage * 25);

  return clamp(25 + verifiedRevenueScore + diversityScore + provenanceScore + verifiedSourceScore - manualDominancePenalty);
}

function nextBestAction(params: {
  now: Date;
  events: FounderEvent[];
  blockedTasks: number;
  verifiedRevenue: number;
  revenue30d: number;
  commits7d: number;
  leads7d: number;
  agentRuns24h: number;
  hoursSinceLastEvent: number;
}): string {
  if (params.blockedTasks > 0) return "막힌 태스크 1개를 30분 안에 unblock 처리하세요.";
  if (params.verifiedRevenue <= 0) return "Stripe/Polar/Gumroad 중 1개를 연결해서 수익 신호를 검증 가능하게 만드세요.";
  if (params.hoursSinceLastEvent > 36) return "오늘 커밋 1개 또는 고객 리드 1건을 기록해서 펫 굶주림을 낮추세요.";
  if (params.commits7d === 0) return "이번 주 첫 GitHub commit을 밀어 넣어 빌드 신호를 살리세요.";
  if (params.leads7d === 0 && params.revenue30d < 100) return "리드 3명에게 outbound를 보내고 lead 이벤트로 남기세요.";
  if (params.agentRuns24h === 0) return "Claude/Codex/n8n 실행 1회를 기록해서 자동화 루프를 보여주세요.";
  return "지금 흐름 좋습니다. 매출 또는 공개 콘텐츠 1개를 추가하면 다음 진화가 빨라집니다.";
}

function stageProgress(exp: number): number {
  const current = stageForExp(exp);
  const next = nextStageForExp(exp);
  if (!next) return 100;
  const span = next.minExp - current.minExp;
  if (span <= 0) return 100;
  return clamp(((exp - current.minExp) / span) * 100);
}

export function calculateFromEvents(events: FounderEvent[], now: Date = new Date()): GrowthSnapshot {
  const deduped = dedupeEvents(events, now);
  const impacts = calculateImpacts(deduped, now);
  const exp = impacts.reduce((sum, impact) => sum + impact.awardedExp, 0);
  const level = Math.floor(exp / 100) + 1;
  const stageInfo = stageForExp(exp);
  const nextStage = nextStageForExp(exp);
  const lastEvent = deduped[deduped.length - 1];
  // For a brand-new user with no events, do not pretend they have been "starving".
  // Mood/hunger should only react once there is a signal history to be stale relative to.
  const hoursSinceLastEvent = lastEvent ? hoursAgo(lastEvent.occurredAt, now) : 0;

  const inLast24h = deduped.filter((event) => hoursAgo(event.occurredAt, now) <= 24);
  const inLast7d = deduped.filter((event) => hoursAgo(event.occurredAt, now) <= 24 * 7);
  const inLast30d = deduped.filter((event) => hoursAgo(event.occurredAt, now) <= 24 * 30);
  const todayKey = dayKey(now);
  const todayEvents = deduped.filter((event) => dayKey(toDate(event.occurredAt, now)) === todayKey);

  const totalRevenue = deduped
    .filter((event) => normalizeKind(event.kind) === FounderEventKind.REVENUE)
    .reduce((sum, event) => sum + nonNegativeNumber(event.value), 0);
  const verifiedRevenue = deduped
    .filter((event) => normalizeKind(event.kind) === FounderEventKind.REVENUE)
    .filter((event) => event.verified || sourceIsVerifiedByDefault(String(event.source)))
    .reduce((sum, event) => sum + nonNegativeNumber(event.value), 0);
  const revenue30d = inLast30d
    .filter((event) => normalizeKind(event.kind) === FounderEventKind.REVENUE)
    .reduce((sum, event) => sum + nonNegativeNumber(event.value), 0);

  const today = {
    revenue: todayEvents
      .filter((event) => normalizeKind(event.kind) === FounderEventKind.REVENUE)
      .reduce((sum, event) => sum + nonNegativeNumber(event.value), 0),
    verifiedRevenue: todayEvents
      .filter((event) => normalizeKind(event.kind) === FounderEventKind.REVENUE)
      .filter((event) => event.verified || sourceIsVerifiedByDefault(String(event.source)))
      .reduce((sum, event) => sum + nonNegativeNumber(event.value), 0),
    tasksDone: todayEvents.filter((event) => normalizeKind(event.kind) === FounderEventKind.TASK_DONE).length,
    blockedTasks: todayEvents.filter((event) => normalizeKind(event.kind) === FounderEventKind.TASK_BLOCKED).length,
    commits: todayEvents
      .filter((event) => normalizeKind(event.kind) === FounderEventKind.GITHUB_COMMIT)
      .reduce((sum, event) => sum + Math.max(1, nonNegativeNumber(event.value)), 0),
    agentRuns: todayEvents.filter((event) => normalizeKind(event.kind) === FounderEventKind.AGENT_RUN).length,
    leads: todayEvents
      .filter((event) => normalizeKind(event.kind) === FounderEventKind.LEAD)
      .reduce((sum, event) => sum + nonNegativeNumber(event.value), 0),
  };

  const blockedTasks7d = inLast7d.filter((event) => normalizeKind(event.kind) === FounderEventKind.TASK_BLOCKED).length;
  const commits7d = inLast7d
    .filter((event) => normalizeKind(event.kind) === FounderEventKind.GITHUB_COMMIT)
    .reduce((sum, event) => sum + Math.max(1, nonNegativeNumber(event.value)), 0);
  const leads7d = inLast7d
    .filter((event) => normalizeKind(event.kind) === FounderEventKind.LEAD)
    .reduce((sum, event) => sum + nonNegativeNumber(event.value), 0);
  const agentRuns24h = inLast24h.filter((event) => normalizeKind(event.kind) === FounderEventKind.AGENT_RUN).length;
  const meaningful24h = inLast24h.filter((event) => calculateEventExp(event) > 0).length;

  const staleHunger = hoursSinceLastEvent > 72 ? 70 : hoursSinceLastEvent > 48 ? 50 : hoursSinceLastEvent > 24 ? 25 : 0;
  const hunger = clamp(staleHunger + blockedTasks7d * 15);
  const energy = clamp(today.tasksDone * 15 + today.commits * 5 + today.agentRuns * 3 + today.verifiedRevenue / 10);
  const focusScore = clamp(((today.tasksDone + commits7d + agentRuns24h) / Math.max(today.tasksDone + commits7d + agentRuns24h + blockedTasks7d, 1)) * 100);
  const businessHealthScore = clamp(Math.log10(totalRevenue + 1) * 22 + Math.min(25, leads7d * 3) + (verifiedRevenue > 0 ? 15 : 0));
  const trustScore = calculateTrustScore(deduped, totalRevenue, verifiedRevenue);
  const streakDays = countConsecutiveActivityDays(deduped, now);

  let mood = PetMood.HAPPY;
  if (deduped.length === 0) mood = PetMood.TIRED;
  else if (blockedTasks7d > 0) mood = PetMood.BLOCKED;
  else if (hunger > 55) mood = PetMood.HUNGRY;
  else if (today.verifiedRevenue > 0 || (today.revenue > 0 && today.tasksDone > 0)) mood = PetMood.CELEBRATING;
  else if (commits7d > 0 || agentRuns24h > 0 || today.tasksDone > 0) mood = PetMood.FOCUSED;
  else if (meaningful24h === 0) mood = PetMood.TIRED;

  const buildScore = clamp(today.tasksDone * 12 + commits7d * 4 + agentRuns24h * 6 + streakDays * 4);
  const outcomeScore = clamp(Math.log10(revenue30d + 1) * 28 + leads7d * 5 + (verifiedRevenue > 0 ? 12 : 0));
  const momentumScore = clamp(meaningful24h * 12 + streakDays * 5 + (hoursSinceLastEvent < 6 ? 15 : 0));
  const sourceDiversity = new Set(deduped.map((event) => String(event.source))).size;
  const launchReadiness = clamp(
    (verifiedRevenue > 0 ? 20 : 0) +
      (commits7d > 0 ? 15 : 0) +
      (agentRuns24h > 0 ? 10 : 0) +
      Math.min(15, sourceDiversity * 4) +
      trustScore * 0.2 +
      (meaningful24h > 0 ? 20 : 0),
  );

  const riskFlags: string[] = [];
  if (verifiedRevenue <= 0 && totalRevenue > 0) riskFlags.push("Revenue is manual/unverified — leaderboard score is discounted.");
  if (verifiedRevenue <= 0 && totalRevenue <= 0) riskFlags.push("No verified revenue source yet.");
  if (hoursSinceLastEvent > 36) riskFlags.push("No fresh founder signal in the last 36 hours.");
  if (blockedTasks7d > 0) riskFlags.push("Blocked tasks are hurting mood and focus.");
  if (sourceDiversity < 2) riskFlags.push("Only one signal source connected; add GitHub or Stripe for trust.");

  const nextEvolutionRequirement = nextStage
    ? `${Math.max(0, nextStage.minExp - exp)} more EXP to evolve into ${nextStage.label} (level ${nextStage.level})`
    : "Max stage reached. Keep compounding real revenue and shipping.";

  const leaderboardScore = Math.round(exp * (0.55 + trustScore / 200) + verifiedRevenue * 4 + streakDays * 25 + businessHealthScore * 3);

  return {
    exp,
    level,
    stage: stageInfo.stage,
    stageLabel: stageInfo.label,
    mood,
    hunger,
    energy,
    focusScore,
    businessHealthScore,
    nextEvolutionRequirement,
    progressToNextLevel: clamp((exp % 100) / 100 * 100),
    progressToNextStage: stageProgress(exp),
    trustScore,
    streakDays,
    totalRevenue,
    verifiedRevenue,
    revenue30d,
    leaderboardScore,
    eventImpacts: impacts,
    today,
    businessPulse: {
      buildScore,
      outcomeScore,
      momentumScore,
      launchReadiness,
      nextBestAction: nextBestAction({
        now,
        events: deduped,
        blockedTasks: blockedTasks7d,
        verifiedRevenue,
        revenue30d,
        commits7d,
        leads7d,
        agentRuns24h,
        hoursSinceLastEvent,
      }),
      riskFlags,
    },
  };
}

function approvalValue(riskLevel: RiskLevel): number {
  if (riskLevel === RiskLevel.CRITICAL) return 4;
  if (riskLevel === RiskLevel.HIGH) return 3;
  return 1;
}

function metricToFounderEvent(metric: MetricEvent): FounderEventKind {
  if (REVENUE_TYPES.has(metric.type)) return FounderEventKind.REVENUE;
  if (metric.type === MetricType.LEADS) return FounderEventKind.LEAD;
  if (metric.type === MetricType.VIEWS) return FounderEventKind.VIEWS;
  if (metric.type === MetricType.GITHUB_COMMITS) return FounderEventKind.GITHUB_COMMIT;
  if (metric.type === MetricType.PUBLISHED_CONTENT) return FounderEventKind.PUBLISHED_CONTENT;
  return FounderEventKind.AGENT_RUN;
}

/**
 * Backward-compatible API used by the existing demo page and tests.
 */
export function calculateGrowth(
  tasks: Task[],
  approvals: ApprovalEvent[],
  metrics: MetricEvent[],
  agentRuns: AgentRun[],
  now: Date = new Date(),
): GrowthSnapshot {
  const userId = "legacy-demo";
  const taskEvents: FounderEvent[] = tasks.map((task) => ({
    id: task.id,
    userId,
    kind:
      task.status === TaskStatus.DONE
        ? FounderEventKind.TASK_DONE
        : task.status === TaskStatus.BLOCKED
          ? FounderEventKind.TASK_BLOCKED
          : FounderEventKind.TASK_STARTED,
    source: EventSource.MANUAL,
    value: 1,
    occurredAt: task.completedAt ?? task.createdAt,
    verified: false,
    confidence: 0.8,
  }));

  const approvalEvents: FounderEvent[] = approvals
    .filter((approval) => approval.status === ApprovalStatus.APPROVED)
    .map((approval) => ({
      id: approval.id,
      userId,
      kind: FounderEventKind.APPROVAL,
      source: EventSource.MANUAL,
      value: approvalValue(approval.riskLevel),
      occurredAt: approval.resolvedAt ?? approval.createdAt,
      verified: false,
      confidence: 0.8,
    }));

  const metricEvents: FounderEvent[] = metrics.map((metric) => ({
    id: metric.id,
    userId,
    kind: metricToFounderEvent(metric),
    source: metric.type === MetricType.GITHUB_COMMITS ? EventSource.GITHUB : EventSource.MANUAL,
    value: metric.value,
    occurredAt: metric.recordedAt,
    verified: metric.type === MetricType.GITHUB_COMMITS,
    confidence: metric.type === MetricType.MANUAL_REVENUE ? 0.65 : 0.9,
  }));

  const runEvents: FounderEvent[] = agentRuns
    .filter((run) => run.success)
    .map((run) => ({
      id: run.id,
      userId,
      kind: FounderEventKind.AGENT_RUN,
      source: run.agentName || EventSource.API,
      value: 1,
      occurredAt: run.finishedAt ?? run.startedAt,
      verified: run.agentName === EventSource.N8N,
      confidence: 0.85,
    }));

  const snapshot = calculateFromEvents([...taskEvents, ...approvalEvents, ...metricEvents, ...runEvents], now);

  // Preserve stale pending task/approval hunger from the original engine.
  const staleTaskCount = tasks.filter((task) => task.status !== TaskStatus.DONE && hoursAgo(task.createdAt, now) > 24).length;
  const stalePendingApprovals = approvals.filter(
    (approval) => approval.status === ApprovalStatus.PENDING && hoursAgo(approval.createdAt, now) > 24,
  ).length;
  const legacyHunger = clamp((staleTaskCount + stalePendingApprovals) * 10);

  return {
    ...snapshot,
    hunger: Math.max(snapshot.hunger, legacyHunger),
    mood:
      tasks.some((task) => task.status === TaskStatus.BLOCKED)
        ? PetMood.BLOCKED
        : Math.max(snapshot.hunger, legacyHunger) > 50
          ? PetMood.HUNGRY
          : snapshot.mood,
  };
}

function stableId(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36);
}

export function createFounderEvent(input: Omit<FounderEvent, "id" | "occurredAt" | "value"> & Partial<Pick<FounderEvent, "id" | "occurredAt" | "value">>): FounderEvent {
  const occurredAt = input.occurredAt ?? new Date();
  const seed = `${input.userId}:${input.kind}:${input.source}:${input.externalId ?? "manual"}:${toDate(occurredAt, new Date()).toISOString()}`;
  const id = input.id ?? `evt_${stableId(seed)}`;

  return {
    ...input,
    id,
    value: input.value ?? 1,
    occurredAt,
  };
}
