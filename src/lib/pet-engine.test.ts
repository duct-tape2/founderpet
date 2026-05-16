/**
 * Pet engine tests. Run with: npm test
 * (Add `vitest` to dev dependencies first.)
 */

import { describe, it, expect } from "vitest";
import {
  calculateGrowth,
  stageForLevel,
  PetStage,
  PetMood,
  TaskStatus,
  ApprovalStatus,
  RiskLevel,
  MetricType,
} from "./pet-engine";

describe("stageForLevel", () => {
  it("level 1 → EGG", () => expect(stageForLevel(1)).toBe(PetStage.EGG));
  it("level 2-3 → CHICK", () => {
    expect(stageForLevel(2)).toBe(PetStage.CHICK);
    expect(stageForLevel(3)).toBe(PetStage.CHICK);
  });
  it("level 4-7 → BIRD", () => {
    expect(stageForLevel(4)).toBe(PetStage.BIRD);
    expect(stageForLevel(7)).toBe(PetStage.BIRD);
  });
  it("level 8-12 → WORKER_BIRD", () => expect(stageForLevel(10)).toBe(PetStage.WORKER_BIRD));
  it("level 13-20 → FOUNDER_BIRD", () => expect(stageForLevel(15)).toBe(PetStage.FOUNDER_BIRD));
  it("level 21+ → DRAGON_OR_PHOENIX", () => expect(stageForLevel(25)).toBe(PetStage.DRAGON_OR_PHOENIX));
});

describe("calculateGrowth - EXP rules", () => {
  it("empty input → 0 EXP, level 1, EGG, tired", () => {
    const s = calculateGrowth([], [], [], []);
    expect(s.exp).toBe(0);
    expect(s.level).toBe(1);
    expect(s.stage).toBe(PetStage.EGG);
    expect(s.mood).toBe(PetMood.TIRED);
  });

  it("each completed task adds 10 EXP", () => {
    const now = new Date();
    const tasks = [
      { id: "1", status: TaskStatus.DONE, createdAt: now, completedAt: now },
      { id: "2", status: TaskStatus.DONE, createdAt: now, completedAt: now },
    ];
    const s = calculateGrowth(tasks, [], [], []);
    expect(s.exp).toBe(20);
  });

  it("revenue event adds USD as EXP (capped at 500)", () => {
    const metrics = [
      { id: "1", type: MetricType.MANUAL_REVENUE, value: 100, recordedAt: new Date() },
      { id: "2", type: MetricType.MANUAL_REVENUE, value: 1000, recordedAt: new Date() }, // capped to 500
    ];
    const s = calculateGrowth([], [], metrics, []);
    expect(s.exp).toBe(600); // 100 + 500
  });

  it("github commits add 2 EXP each", () => {
    const metrics = [
      { id: "g1", type: MetricType.GITHUB_COMMITS, value: 5, recordedAt: new Date() },
    ];
    const s = calculateGrowth([], [], metrics, []);
    expect(s.exp).toBe(10);
  });

  it("agent runs add 1 EXP if successful", () => {
    const runs = [
      { id: "a1", agentName: "claude", success: true, startedAt: new Date() },
      { id: "a2", agentName: "claude", success: false, startedAt: new Date() },
    ];
    const s = calculateGrowth([], [], [], runs);
    expect(s.exp).toBe(1);
  });

  it("approved high-risk approval adds 15 EXP", () => {
    const approvals = [
      { id: "ap1", status: ApprovalStatus.APPROVED, riskLevel: RiskLevel.HIGH, createdAt: new Date() },
    ];
    const s = calculateGrowth([], approvals, [], []);
    expect(s.exp).toBe(15);
  });
});

describe("calculateGrowth - mood rules", () => {
  it("blocked task → mood: blocked", () => {
    const now = new Date();
    const tasks = [{ id: "1", status: TaskStatus.BLOCKED, createdAt: now }];
    const s = calculateGrowth(tasks, [], [], []);
    expect(s.mood).toBe(PetMood.BLOCKED);
  });

  it("recent revenue + recent done → celebrating", () => {
    const now = new Date();
    const tasks = [{ id: "1", status: TaskStatus.DONE, createdAt: now, completedAt: now }];
    const metrics = [{ id: "m1", type: MetricType.MANUAL_REVENUE, value: 100, recordedAt: now }];
    const s = calculateGrowth(tasks, [], metrics, []);
    expect(s.mood).toBe(PetMood.CELEBRATING);
  });
});

describe("calculateGrowth - level progression", () => {
  it("200 EXP → level 3 (CHICK)", () => {
    const metrics = [{ id: "m1", type: MetricType.MANUAL_REVENUE, value: 200, recordedAt: new Date() }];
    const s = calculateGrowth([], [], metrics, []);
    expect(s.level).toBe(3);
    expect(s.stage).toBe(PetStage.CHICK);
  });

  it("2000 EXP → level 21 DRAGON", () => {
    const metrics = Array.from({ length: 4 }, (_, i) => ({
      id: `m${i}`,
      type: MetricType.MANUAL_REVENUE,
      value: 500,
      recordedAt: new Date(),
    }));
    const s = calculateGrowth([], [], metrics, []);
    expect(s.exp).toBe(2000);
    expect(s.level).toBe(21);
    expect(s.stage).toBe(PetStage.DRAGON_OR_PHOENIX);
  });
});

describe("calculateGrowth - hunger/energy", () => {
  it("stale tasks (>24h old, not done) → hunger goes up", () => {
    const past = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30h ago
    const tasks = [
      { id: "1", status: TaskStatus.PENDING, createdAt: past },
      { id: "2", status: TaskStatus.PENDING, createdAt: past },
    ];
    const s = calculateGrowth(tasks, [], [], []);
    expect(s.hunger).toBeGreaterThan(0);
  });

  it("recent done tasks → energy up", () => {
    const recent = new Date();
    const tasks = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i}`,
      status: TaskStatus.DONE,
      createdAt: recent,
      completedAt: recent,
    }));
    const s = calculateGrowth(tasks, [], [], []);
    expect(s.energy).toBeGreaterThan(50);
  });
});
