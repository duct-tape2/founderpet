/**
 * FounderPet Growth Engine
 *
 * Ported from the original Python pet_engine (WorkPet/다마고치 프로젝트).
 * Calculates pet level, stage, mood, and metrics from multi-source progress
 * (tasks, approvals, business metrics, AI agent runs, GitHub commits).
 *
 * Original concept: solo founder's business progress → pet evolution.
 */

export enum PetStage {
  EGG = "EGG",
  CHICK = "CHICK",
  BIRD = "BIRD",
  WORKER_BIRD = "WORKER_BIRD",
  FOUNDER_BIRD = "FOUNDER_BIRD",
  DRAGON_OR_PHOENIX = "DRAGON_OR_PHOENIX",
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
  GITHUB_COMMITS = "github_commits", // NEW: from GitHub OAuth integration
  PUBLISHED_CONTENT = "published_content",
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
  agentName: string; // "claude", "codex", "n8n", "github-action", etc.
  success: boolean;
  startedAt: Date;
  finishedAt?: Date;
}

export interface GrowthSnapshot {
  exp: number;
  level: number;
  stage: PetStage;
  mood: PetMood;
  hunger: number; // 0-100: stale tasks + pending approvals
  energy: number; // 0-100: completed work today
  focusScore: number; // 0-100: how on-track today
  businessHealthScore: number; // 0-100: revenue + leads health
  nextEvolutionRequirement: string;
}

const REVENUE_TYPES = new Set([
  MetricType.MANUAL_REVENUE,
  MetricType.AD_REVENUE,
  MetricType.AFFILIATE_REVENUE,
  MetricType.CONSULTING_REVENUE,
  MetricType.APP_REVENUE,
  MetricType.CONTENT_REVENUE,
]);

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

export function stageForLevel(level: number): PetStage {
  if (level <= 1) return PetStage.EGG;
  if (level <= 3) return PetStage.CHICK;
  if (level <= 7) return PetStage.BIRD;
  if (level <= 12) return PetStage.WORKER_BIRD;
  if (level <= 20) return PetStage.FOUNDER_BIRD;
  return PetStage.DRAGON_OR_PHOENIX;
}

function nextEvolutionThreshold(currentLevel: number): { level: number; exp: number } {
  const thresholds = [
    { stage: PetStage.CHICK, level: 2 },
    { stage: PetStage.BIRD, level: 4 },
    { stage: PetStage.WORKER_BIRD, level: 8 },
    { stage: PetStage.FOUNDER_BIRD, level: 13 },
    { stage: PetStage.DRAGON_OR_PHOENIX, level: 21 },
  ];
  for (const t of thresholds) {
    if (currentLevel < t.level) return { level: t.level, exp: t.level * 100 };
  }
  return { level: currentLevel, exp: currentLevel * 100 };
}

function hoursAgo(date: Date | undefined, now: Date): number {
  if (!date) return Infinity;
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

/**
 * Core growth calculation.
 * Multi-source signal aggregation:
 * - Tasks completed → EXP + energy
 * - Approvals (low/medium auto-resolved) → EXP
 * - Revenue events → big EXP boost + business health
 * - Agent runs successful → small EXP + focus
 * - GitHub commits → EXP (NEW for FounderPet vs WorkPet)
 * - Stale tasks + pending approvals → hunger
 * - Blocked tasks → mood: blocked
 */
export function calculateGrowth(
  tasks: Task[],
  approvals: ApprovalEvent[],
  metrics: MetricEvent[],
  agentRuns: AgentRun[],
  now: Date = new Date(),
): GrowthSnapshot {
  let exp = 0;

  // Tasks: 10 EXP per completed task
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE);
  exp += completedTasks.length * 10;

  // Approvals: 5 EXP per resolved low/medium, 15 per high
  for (const a of approvals) {
    if (a.status === ApprovalStatus.APPROVED) {
      if (a.riskLevel === RiskLevel.LOW || a.riskLevel === RiskLevel.MEDIUM) exp += 5;
      else if (a.riskLevel === RiskLevel.HIGH) exp += 15;
      else if (a.riskLevel === RiskLevel.CRITICAL) exp += 30;
    }
  }

  // Revenue: 1 EXP per USD (capped at 500 per event for fairness)
  for (const m of metrics) {
    if (REVENUE_TYPES.has(m.type)) {
      exp += Math.min(m.value, 500);
    } else if (m.type === MetricType.LEADS) {
      exp += m.value * 3;
    } else if (m.type === MetricType.VIEWS) {
      exp += Math.floor(m.value / 100); // 1 EXP per 100 views
    } else if (m.type === MetricType.GITHUB_COMMITS) {
      exp += m.value * 2; // 2 EXP per commit
    } else if (m.type === MetricType.PUBLISHED_CONTENT) {
      exp += m.value * 20; // 20 EXP per published piece
    }
  }

  // Agent runs: 1 EXP per successful run
  exp += agentRuns.filter((r) => r.success).length;

  // Level + stage
  const level = Math.floor(exp / 100) + 1;
  const stage = stageForLevel(level);

  // Hunger: stale tasks + pending approvals (over 24h)
  const staleTaskCount = tasks.filter(
    (t) =>
      t.status !== TaskStatus.DONE &&
      hoursAgo(t.createdAt, now) > 24,
  ).length;
  const stalePendingApprovals = approvals.filter(
    (a) =>
      a.status === ApprovalStatus.PENDING &&
      hoursAgo(a.createdAt, now) > 24,
  ).length;
  const hunger = clamp((staleTaskCount + stalePendingApprovals) * 10);

  // Energy: completed work in last 24h
  const recentDone = tasks.filter(
    (t) =>
      t.status === TaskStatus.DONE &&
      t.completedAt &&
      hoursAgo(t.completedAt, now) <= 24,
  ).length;
  const energy = clamp(recentDone * 15);

  // Focus score: ratio of in_progress/done vs blocked
  const blocked = tasks.filter((t) => t.status === TaskStatus.BLOCKED).length;
  const active = tasks.filter(
    (t) => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.DONE,
  ).length;
  const focusScore = clamp((active / Math.max(active + blocked, 1)) * 100);

  // Business health: revenue trajectory + leads
  const totalRevenue = metrics
    .filter((m) => REVENUE_TYPES.has(m.type))
    .reduce((sum, m) => sum + m.value, 0);
  const businessHealthScore = clamp(Math.log10(totalRevenue + 1) * 25);

  // Mood — revenue + recent activity takes priority over tired
  let mood: PetMood = PetMood.HAPPY;
  if (blocked > 0) mood = PetMood.BLOCKED;
  else if (hunger > 50) mood = PetMood.HUNGRY;
  else if (totalRevenue > 0 && recentDone > 0) mood = PetMood.CELEBRATING;
  else if (active > 0) mood = PetMood.FOCUSED;
  else if (energy < 20) mood = PetMood.TIRED;

  // Next evolution
  const nextThreshold = nextEvolutionThreshold(level);
  const nextEvolutionRequirement =
    level >= 21
      ? "Max stage reached. Keep building!"
      : `${nextThreshold.exp - exp} more EXP to reach level ${nextThreshold.level}`;

  return {
    exp,
    level,
    stage,
    mood,
    hunger,
    energy,
    focusScore,
    businessHealthScore,
    nextEvolutionRequirement,
  };
}
