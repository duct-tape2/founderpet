import { describe, expect, it } from "vitest";
import {
  calculateEventExp,
  calculateFromEvents,
  createFounderEvent,
  EventSource,
  FounderEventKind,
  PetMood,
  PetStage,
} from "./pet-engine";
import { buildWatchPayloadFromParts } from "./watch-payload";

const now = new Date("2026-05-16T12:00:00.000Z");

function event(kind: FounderEventKind, value = 1, overrides = {}) {
  return createFounderEvent({
    id: `${kind}-${value}-${Math.random()}`,
    userId: "demo",
    kind,
    source: EventSource.API,
    value,
    occurredAt: now,
    ...overrides,
  });
}

describe("FounderPet market-ready growth engine", () => {
  it("uses the natural Egg → Chick → Bird → Eagle → Griffin → Dragon thresholds", () => {
    expect(calculateFromEvents([], now).stage).toBe(PetStage.EGG);
    expect(calculateFromEvents([event(FounderEventKind.REVENUE, 100, { source: EventSource.STRIPE, verified: true })], now).stage).toBe(PetStage.CHICK);
    expect(calculateFromEvents([event(FounderEventKind.REVENUE, 300, { source: EventSource.STRIPE, verified: true })], now).stage).toBe(PetStage.BIRD);
    expect(calculateFromEvents([event(FounderEventKind.REVENUE, 500, { source: EventSource.STRIPE, verified: true }), event(FounderEventKind.REVENUE, 200, { source: EventSource.STRIPE, verified: true, externalId: "two" })], now).stage).toBe(PetStage.EAGLE);
    expect(calculateFromEvents([event(FounderEventKind.REVENUE, 500, { source: EventSource.STRIPE, verified: true }), event(FounderEventKind.REVENUE, 500, { source: EventSource.STRIPE, verified: true, externalId: "two" }), event(FounderEventKind.REVENUE, 300, { source: EventSource.PAYPAL, verified: true, externalId: "three" })], now).stage).toBe(PetStage.GRIFFIN);
  });

  it("caps revenue exp per event but lets verified revenue keep full trust", () => {
    const verified = event(FounderEventKind.REVENUE, 999, { source: EventSource.STRIPE, verified: true });
    expect(calculateEventExp(verified)).toBe(500);
    const snapshot = calculateFromEvents([verified], now);
    expect(snapshot.exp).toBe(500);
    expect(snapshot.verifiedRevenue).toBe(999);
    expect(snapshot.trustScore).toBeGreaterThanOrEqual(75);
  });

  it("discounts manual revenue so fake leaderboard farming is less attractive", () => {
    const manual = event(FounderEventKind.REVENUE, 100, { source: EventSource.MANUAL, verified: false, confidence: 0.65 });
    const verified = event(FounderEventKind.REVENUE, 100, { source: EventSource.STRIPE, verified: true });
    expect(calculateEventExp(manual)).toBeLessThan(calculateEventExp(verified));

    const manualSnapshot = calculateFromEvents([manual], now);
    const verifiedSnapshot = calculateFromEvents([verified], now);
    expect(manualSnapshot.trustScore).toBeLessThan(verifiedSnapshot.trustScore);
    expect(manualSnapshot.leaderboardScore).toBeLessThan(verifiedSnapshot.leaderboardScore);
  });

  it("dedupes events by user + source + externalId", () => {
    const first = event(FounderEventKind.REVENUE, 49, { source: EventSource.STRIPE, verified: true, externalId: "pi_same" });
    const duplicate = event(FounderEventKind.REVENUE, 49, { source: EventSource.STRIPE, verified: true, externalId: "pi_same", id: "different-id" });
    const snapshot = calculateFromEvents([first, duplicate], now);
    expect(snapshot.exp).toBe(49);
    expect(snapshot.eventImpacts).toHaveLength(1);
  });

  it("daily-caps spammy agent runs", () => {
    const runs = Array.from({ length: 120 }, (_, index) =>
      event(FounderEventKind.AGENT_RUN, 1, { id: `run-${index}`, source: EventSource.CLAUDE, externalId: `run-${index}` }),
    );
    const snapshot = calculateFromEvents(runs, now);
    expect(snapshot.exp).toBe(80);
    expect(snapshot.eventImpacts.some((impact) => impact.capped)).toBe(true);
  });

  it("blocked tasks dominate mood until handled", () => {
    const snapshot = calculateFromEvents([
      event(FounderEventKind.REVENUE, 49, { source: EventSource.STRIPE, verified: true }),
      event(FounderEventKind.TASK_BLOCKED, 1, { source: EventSource.MANUAL, id: "blocked-1", externalId: "blocked-1" }),
    ], now);
    expect(snapshot.mood).toBe(PetMood.BLOCKED);
    expect(snapshot.hunger).toBeGreaterThan(0);
  });

  it("gives a concrete next action when revenue is unverified", () => {
    const snapshot = calculateFromEvents([
      event(FounderEventKind.REVENUE, 100, { source: EventSource.MANUAL, verified: false, externalId: "manual-sale" }),
    ], now);
    expect(snapshot.businessPulse.nextBestAction).toContain("Stripe");
    expect(snapshot.businessPulse.riskFlags.join(" ")).toContain("manual");
  });

  it("creates compact watch payload for Apple Watch polling", () => {
    const snapshot = calculateFromEvents([
      event(FounderEventKind.REVENUE, 49, { source: EventSource.STRIPE, verified: true, externalId: "pi_watch" }),
      event(FounderEventKind.GITHUB_COMMIT, 2, { source: EventSource.GITHUB, verified: true, externalId: "push_watch" }),
    ], now);

    const payload = buildWatchPayloadFromParts(
      { id: "demo", handle: "duct-tape2", displayName: "Demo", projectName: "FounderPet", avatarEmoji: "🐉", createdAt: now.toISOString() },
      snapshot,
      [],
      now.toISOString(),
    );

    expect(payload.version).toBe(1);
    expect(payload.complication.corner).toBe(`L${snapshot.level}`);
    expect(payload.pulse.nextAction.length).toBeGreaterThan(10);
  });
});
