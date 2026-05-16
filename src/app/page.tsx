"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  calculateFromEvents,
  createFounderEvent,
  EventSource,
  FounderEventKind,
  type FounderEvent,
} from "@/lib/pet-engine";
import type { FounderProfile } from "@/lib/pet-store";
import { buildWatchPayloadFromParts } from "@/lib/watch-payload";
import BusinessPulse from "@/components/BusinessPulse";
import EventFeed from "@/components/EventFeed";
import LaunchChecklist from "@/components/LaunchChecklist";
import Leaderboard from "@/components/Leaderboard";
import RevenueIntegrations from "@/components/RevenueIntegrations";
import WatchGlance from "@/components/WatchGlance";

const Pet3D = dynamic(() => import("@/components/Pet3D"), { ssr: false });

const DEMO_PROFILE: FounderProfile = {
  id: "demo",
  handle: "duct-tape2",
  displayName: "Duct Tape Founder",
  projectName: "FounderPet",
  avatarEmoji: "🐉",
  createdAt: "2026-05-16T00:00:00.000Z",
};

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function initialEvents(): FounderEvent[] {
  return [
    createFounderEvent({
      id: "demo_verified_sale",
      userId: "demo",
      kind: FounderEventKind.REVENUE,
      source: EventSource.STRIPE,
      value: 49,
      currency: "USD",
      verified: true,
      externalId: "pi_demo_early_access_49",
      occurredAt: hoursAgo(7),
      metadata: { product: "FounderPet Early Access" },
    }),
    createFounderEvent({
      id: "demo_commit_batch",
      userId: "demo",
      kind: FounderEventKind.GITHUB_COMMIT,
      source: EventSource.GITHUB,
      value: 4,
      verified: true,
      externalId: "push_demo_phase2",
      occurredAt: hoursAgo(3),
      metadata: { repo: "duct-tape2/founderpet" },
    }),
    createFounderEvent({
      id: "demo_agent_run",
      userId: "demo",
      kind: FounderEventKind.AGENT_RUN,
      source: EventSource.CLAUDE,
      value: 1,
      confidence: 0.85,
      externalId: "claude_market_audit_1",
      occurredAt: hoursAgo(2),
    }),
    createFounderEvent({
      id: "demo_task_done",
      userId: "demo",
      kind: FounderEventKind.TASK_DONE,
      source: EventSource.MANUAL,
      value: 1,
      confidence: 0.8,
      externalId: "task_market_ready_patch",
      occurredAt: hoursAgo(1),
    }),
    createFounderEvent({
      id: "demo_leads",
      userId: "demo",
      kind: FounderEventKind.LEAD,
      source: EventSource.API,
      value: 3,
      confidence: 0.75,
      externalId: "lead_batch_3",
      occurredAt: hoursAgo(12),
    }),
  ];
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function Home() {
  const [events, setEvents] = useState<FounderEvent[]>(() => initialEvents());
  const snapshot = useMemo(() => calculateFromEvents(events), [events]);
  const watchPayload = useMemo(() => buildWatchPayloadFromParts(DEMO_PROFILE, snapshot, events), [events, snapshot]);

  const addEvent = (kind: FounderEventKind, value = 1, source: EventSource | string = EventSource.MANUAL, verified = false) => {
    const now = new Date();
    setEvents((previous) => [
      ...previous,
      createFounderEvent({
        userId: "demo",
        kind,
        source,
        value,
        verified,
        confidence: verified ? 1 : source === EventSource.MANUAL ? 0.65 : 0.85,
        currency: kind === FounderEventKind.REVENUE ? "USD" : undefined,
        externalId: `${source}-${kind}-${now.getTime()}`,
        occurredAt: now,
      }),
    ]);
  };

  const reset = () => setEvents(initialEvents());

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080d] text-zinc-100 antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/[0.08] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-purple-500/[0.06] blur-[100px]" />
        <div className="absolute left-0 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Live · Market-ready patch · Founder signals</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">FounderPet</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
              Revenue, GitHub commits, AI agent runs, leads, and tasks feed a pet that evolves from egg to dragon — with trust scoring so the leaderboard does not become fake.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/duct-tape2/founderpet"
              className="rounded-full border border-zinc-800/70 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400 backdrop-blur transition-colors hover:border-zinc-700 hover:text-white"
            >
              GitHub
            </a>
            <a
              href="/api/watch?userId=demo"
              className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white"
            >
              Watch JSON
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <Pet3D stage={snapshot.stage} mood={snapshot.mood} level={snapshot.level} />

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-800/40 backdrop-blur md:grid-cols-4">
              <StatTile label="LEVEL" value={snapshot.level.toString().padStart(2, "0")} />
              <StatTile label="STAGE" value={snapshot.stageLabel} small />
              <StatTile label="MOOD" value={snapshot.mood} small />
              <StatTile label="EXP" value={snapshot.exp.toLocaleString()} />
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Meter label="Hunger" value={snapshot.hunger} accent="bg-orange-400" />
              <Meter label="Energy" value={snapshot.energy} accent="bg-emerald-400" />
              <Meter label="Focus" value={snapshot.focusScore} accent="bg-blue-400" />
              <Meter label="Health" value={snapshot.businessHealthScore} accent="bg-pink-400" />
            </div>

            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3 text-xs font-mono text-zinc-500">
                <span>Next evolution</span>
                <span>{snapshot.progressToNextStage}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-pink-300 transition-all duration-700" style={{ width: `${snapshot.progressToNextStage}%` }} />
              </div>
              <p className="mt-2 text-xs text-zinc-500">→ {snapshot.nextEvolutionRequirement}</p>
            </div>
          </div>

          <aside className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/45 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-zinc-300">Signal Test</h2>
                  <p className="mt-1 text-xs text-zinc-500">이제 버튼도 감사 로그와 trust score에 반영됩니다.</p>
                </div>
                <button onClick={reset} className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 transition-colors hover:text-red-400">
                  Reset
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <ActionGroup title="Productivity">
                  <Action emoji="✓" label="Task completed" sub="+10 EXP" onClick={() => addEvent(FounderEventKind.TASK_DONE)} />
                  <Action emoji="✕" label="Task blocked" sub="mood: blocked" onClick={() => addEvent(FounderEventKind.TASK_BLOCKED)} variant="warn" />
                </ActionGroup>
                <ActionGroup title="Code & AI">
                  <Action emoji="</>" label="GitHub commit" sub="verified · +2 EXP" onClick={() => addEvent(FounderEventKind.GITHUB_COMMIT, 1, EventSource.GITHUB, true)} />
                  <Action emoji="⌘" label="Claude / Codex run" sub="+1 EXP" onClick={() => addEvent(FounderEventKind.AGENT_RUN, 1, EventSource.CLAUDE)} />
                </ActionGroup>
                <ActionGroup title="Revenue">
                  <Action emoji="$" label="Manual sale" sub="$100 · discounted trust" onClick={() => addEvent(FounderEventKind.REVENUE, 100)} />
                  <Action emoji="⚡" label="Verified Stripe sale" sub="$49 · full trust" onClick={() => addEvent(FounderEventKind.REVENUE, 49, EventSource.STRIPE, true)} variant="celebrate" />
                </ActionGroup>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Verified" value={money(snapshot.verifiedRevenue)} />
              <MiniStat label="Trust" value={`${snapshot.trustScore}`} />
              <MiniStat label="Streak" value={`${snapshot.streakDays}d`} />
            </div>

            <LaunchChecklist snapshot={snapshot} />
          </aside>
        </div>

        <div className="mt-8">
          <BusinessPulse snapshot={snapshot} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <EventFeed events={events} snapshot={snapshot} />
          </div>
          <div className="lg:col-span-2">
            <WatchGlance payload={watchPayload} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Leaderboard />
          </div>
          <div className="lg:col-span-2">
            <RevenueIntegrations />
          </div>
        </div>

        <section className="mb-6 mt-16 text-center">
          <p className="mx-auto max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-zinc-100 md:text-3xl">
            애플워치 집에서 놀리지 말고
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">여기다 활용해서 돈 벌어보세요.</span>
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm text-zinc-500">손목에서 사업이 살아있는지 3초 안에 확인. 이제 mock이 아니라 idempotent event + trust-weighted leaderboard 기반입니다.</p>
        </section>
      </div>
    </main>
  );
}

function StatTile({ label, value, small = false }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="bg-zinc-950/60 p-4 backdrop-blur">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">{label}</div>
      <div className={`font-semibold tracking-tight text-zinc-100 ${small ? "text-sm" : "text-2xl"}`}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/45 p-3 backdrop-blur">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">{label}</div>
      <div className="mt-1 font-mono text-sm text-zinc-200">{value}</div>
    </div>
  );
}

function Meter({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-3 backdrop-blur">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="font-mono text-sm text-zinc-300">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-zinc-800/80">
        <div className={`h-full ${accent} rounded-full transition-all duration-700 ease-out`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ActionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="px-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Action({
  emoji,
  label,
  sub,
  onClick,
  variant = "default",
}: {
  emoji: string;
  label: string;
  sub: string;
  onClick: () => void;
  variant?: "default" | "warn" | "accent" | "celebrate";
}) {
  const accents = {
    default: "hover:border-zinc-700 hover:bg-zinc-800/50",
    warn: "hover:border-orange-500/40 hover:bg-orange-500/[0.08]",
    accent: "hover:border-amber-400/40 hover:bg-amber-400/[0.08]",
    celebrate: "hover:border-pink-400/40 hover:bg-pink-400/[0.08]",
  };

  return (
    <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-xl border border-zinc-800/70 bg-zinc-950/40 px-3.5 py-3 transition-all duration-200 active:scale-[0.98] ${accents[variant]}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm">{emoji}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-medium text-zinc-200">{label}</span>
        <span className="block text-xs text-zinc-500">{sub}</span>
      </span>
      <span className="text-zinc-600 transition-colors group-hover:text-zinc-300">→</span>
    </button>
  );
}
