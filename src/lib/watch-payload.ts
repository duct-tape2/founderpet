import type { FounderEvent, GrowthSnapshot, PetMood, PetStage } from "@/lib/pet-engine";
import type { FounderProfile, PetState } from "@/lib/pet-store";

export interface WatchPayload {
  version: 1;
  userId: string;
  handle: string;
  updatedAt: string;
  pet: {
    stage: PetStage;
    mood: PetMood;
    level: number;
    exp: number;
    progressToNextStage: number;
    progressToNextLevel: number;
  };
  pulse: {
    headline: string;
    nextAction: string;
    trustScore: number;
    buildScore: number;
    outcomeScore: number;
    momentumScore: number;
    launchReadiness: number;
    riskCount: number;
  };
  today: {
    revenue: number;
    verifiedRevenue: number;
    tasksDone: number;
    commits: number;
    agentRuns: number;
    leads: number;
  };
  complication: {
    corner: string;
    center: string;
    footer: string;
    ringPercent: number;
  };
  recent: Array<{
    kind: string;
    source: string;
    value: number;
    verified: boolean;
    occurredAt: string;
  }>;
}

function money(value: number): string {
  if (value >= 1000) return `$${Math.round(value / 100) / 10}k`;
  return `$${Math.round(value)}`;
}

function headline(snapshot: GrowthSnapshot): string {
  if (snapshot.mood === "blocked") return "Blocked — unblock one task";
  if (snapshot.today.verifiedRevenue > 0) return `${money(snapshot.today.verifiedRevenue)} verified today`;
  if (snapshot.today.commits > 0) return `${snapshot.today.commits} commits shipped today`;
  if (snapshot.today.agentRuns > 0) return `${snapshot.today.agentRuns} AI runs today`;
  if (snapshot.businessPulse.riskFlags.length > 0) return "Needs one real signal today";
  return "FounderPet is stable";
}

function compactRecent(events: FounderEvent[]): WatchPayload["recent"] {
  return [...events]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 4)
    .map((event) => ({
      kind: String(event.kind),
      source: String(event.source),
      value: event.value,
      verified: Boolean(event.verified),
      occurredAt: event.occurredAt instanceof Date ? event.occurredAt.toISOString() : event.occurredAt,
    }));
}

export function buildWatchPayload(state: PetState): WatchPayload {
  const { profile, snapshot, events, updatedAt } = state;
  return buildWatchPayloadFromParts(profile, snapshot, events, updatedAt);
}

export function buildWatchPayloadFromParts(
  profile: FounderProfile,
  snapshot: GrowthSnapshot,
  events: FounderEvent[],
  updatedAt = new Date().toISOString(),
): WatchPayload {
  return {
    version: 1,
    userId: profile.id,
    handle: profile.handle,
    updatedAt,
    pet: {
      stage: snapshot.stage,
      mood: snapshot.mood,
      level: snapshot.level,
      exp: snapshot.exp,
      progressToNextStage: snapshot.progressToNextStage,
      progressToNextLevel: snapshot.progressToNextLevel,
    },
    pulse: {
      headline: headline(snapshot),
      nextAction: snapshot.businessPulse.nextBestAction,
      trustScore: snapshot.trustScore,
      buildScore: snapshot.businessPulse.buildScore,
      outcomeScore: snapshot.businessPulse.outcomeScore,
      momentumScore: snapshot.businessPulse.momentumScore,
      launchReadiness: snapshot.businessPulse.launchReadiness,
      riskCount: snapshot.businessPulse.riskFlags.length,
    },
    today: {
      revenue: snapshot.today.revenue,
      verifiedRevenue: snapshot.today.verifiedRevenue,
      tasksDone: snapshot.today.tasksDone,
      commits: snapshot.today.commits,
      agentRuns: snapshot.today.agentRuns,
      leads: snapshot.today.leads,
    },
    complication: {
      corner: `L${snapshot.level}`,
      center: snapshot.mood.toUpperCase(),
      footer: snapshot.today.verifiedRevenue > 0 ? money(snapshot.today.verifiedRevenue) : `${snapshot.progressToNextStage}% → ${snapshot.stageLabel}`,
      ringPercent: snapshot.progressToNextStage,
    },
    recent: compactRecent(events),
  };
}
