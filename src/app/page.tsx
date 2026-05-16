"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  PetStage,
  TaskStatus,
  MetricType,
  calculateGrowth,
  type Task,
  type ApprovalEvent,
  type MetricEvent,
  type AgentRun,
} from "@/lib/pet-engine";
import Leaderboard from "@/components/Leaderboard";
import RevenueIntegrations from "@/components/RevenueIntegrations";

const Pet3D = dynamic(() => import("@/components/Pet3D"), { ssr: false });

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvals] = useState<ApprovalEvent[]>([]);
  const [metrics, setMetrics] = useState<MetricEvent[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);

  const snapshot = calculateGrowth(tasks, approvals, metrics, agentRuns);

  const addTask = (status: TaskStatus) => {
    const now = new Date();
    setTasks([...tasks, { id: `t-${Date.now()}`, status, createdAt: now, completedAt: status === TaskStatus.DONE ? now : undefined }]);
  };
  const addRevenue = (amount: number) =>
    setMetrics([...metrics, { id: `m-${Date.now()}`, type: MetricType.MANUAL_REVENUE, value: amount, recordedAt: new Date() }]);
  const addCommit = () =>
    setMetrics([...metrics, { id: `m-${Date.now()}`, type: MetricType.GITHUB_COMMITS, value: 1, recordedAt: new Date() }]);
  const addAgentRun = () =>
    setAgentRuns([...agentRuns, { id: `a-${Date.now()}`, agentName: "claude", success: true, startedAt: new Date(), finishedAt: new Date() }]);
  const reset = () => { setTasks([]); setMetrics([]); setAgentRuns([]); };

  return (
    <main className="min-h-screen bg-[#08080d] text-zinc-100 antialiased relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/[0.08] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/[0.06] rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-cyan-500/[0.05] rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-mono">Live · Beta · 1,247 founders</span>
            </div>
            <h1 className="text-5xl font-semibold tracking-tight">FounderPet</h1>
            <p className="text-zinc-500 mt-2 text-sm max-w-md leading-relaxed">
              Your business growth, visualized. Revenue + GitHub commits + AI agent runs feed a pet that evolves from egg to dragon.
              <span className="block mt-1 text-zinc-600">Compete on the public leaderboard.</span>
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href="https://github.com/duct-tape2/founderpet" className="text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-zinc-800/60 hover:border-zinc-700 bg-zinc-900/40 backdrop-blur">
              GitHub
            </a>
            <button className="text-xs font-medium text-black bg-zinc-100 hover:bg-white transition-colors px-4 py-1.5 rounded-full">
              Get Early Access
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <Pet3D stage={snapshot.stage} mood={snapshot.mood} level={snapshot.level} />
            <div className="grid grid-cols-4 gap-px bg-zinc-800/40 rounded-2xl overflow-hidden border border-zinc-800/60 backdrop-blur">
              <StatTile label="LEVEL" value={snapshot.level.toString().padStart(2, "0")} />
              <StatTile label="STAGE" value={snapshot.stage.replace(/_/g, " ")} small />
              <StatTile label="MOOD" value={snapshot.mood} small />
              <StatTile label="EXP" value={snapshot.exp.toLocaleString()} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Meter label="Hunger" value={snapshot.hunger} accent="bg-orange-400" />
              <Meter label="Energy" value={snapshot.energy} accent="bg-emerald-400" />
              <Meter label="Focus" value={snapshot.focusScore} accent="bg-blue-400" />
              <Meter label="Health" value={snapshot.businessHealthScore} accent="bg-pink-400" />
            </div>
            <div className="text-xs text-zinc-500 font-mono pt-2">
              → {snapshot.nextEvolutionRequirement}
            </div>
          </div>

          <aside className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-300">Signal Test</h2>
                <button onClick={reset} className="text-[10px] uppercase tracking-wider text-zinc-600 hover:text-red-400 transition-colors font-mono">
                  Reset
                </button>
              </div>

              <ActionGroup title="Productivity">
                <Action emoji="✓" label="Task completed" sub="+10 EXP" onClick={() => addTask(TaskStatus.DONE)} />
                <Action emoji="✕" label="Task blocked" sub="mood: blocked" onClick={() => addTask(TaskStatus.BLOCKED)} variant="warn" />
              </ActionGroup>

              <ActionGroup title="Code & AI">
                <Action emoji="</>" label="GitHub commit" sub="+2 EXP" onClick={addCommit} />
                <Action emoji="⌘" label="Claude / Codex run" sub="+1 EXP" onClick={addAgentRun} />
              </ActionGroup>

              <ActionGroup title="Revenue">
                <Action emoji="$" label="Small sale" sub="+$10 → +10 EXP" onClick={() => addRevenue(10)} />
                <Action emoji="$$" label="Mid sale" sub="+$100 → +100 EXP" onClick={() => addRevenue(100)} variant="accent" />
                <Action emoji="$$$" label="Big sale" sub="+$500 → Level up!" onClick={() => addRevenue(500)} variant="celebrate" />
              </ActionGroup>
            </div>
          </aside>
        </div>

        {/* Leaderboard + Integrations row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
          <div className="lg:col-span-3">
            <Leaderboard />
          </div>
          <div className="lg:col-span-2">
            <RevenueIntegrations />
          </div>
        </div>

        <section className="mt-16 mb-6 text-center">
          <p className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100 leading-tight max-w-2xl mx-auto">
            애플워치 집에서 놀리지 말고
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">
              여기다 활용해서 돈 벌어보세요.
            </span>
          </p>
          <p className="mt-4 text-sm text-zinc-500 max-w-md mx-auto">
            손목에서 사업이 살아있는지 3초 안에 확인. 솔로 파운더 / 인디 해커 / AI 빌더용.
          </p>
        </section>
      </div>
    </main>
  );
}

function StatTile({ label, value, small = false }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="bg-zinc-950/60 p-4 backdrop-blur">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-500 mb-1.5">{label}</div>
      <div className={`font-semibold tracking-tight text-zinc-100 ${small ? "text-sm" : "text-2xl"}`}>{value}</div>
    </div>
  );
}
function Meter({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur p-3">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">{label}</span>
        <span className="text-sm font-mono text-zinc-300">{value}</span>
      </div>
      <div className="h-1 bg-zinc-800/80 rounded-full overflow-hidden">
        <div className={`h-full ${accent} rounded-full transition-all duration-700 ease-out`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
function ActionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 px-1">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Action({ emoji, label, sub, onClick, variant = "default" }: { emoji: string; label: string; sub: string; onClick: () => void; variant?: "default" | "warn" | "accent" | "celebrate" }) {
  const accents = {
    default: "hover:border-zinc-700 hover:bg-zinc-800/50",
    warn: "hover:border-orange-500/40 hover:bg-orange-500/[0.08]",
    accent: "hover:border-amber-400/40 hover:bg-amber-400/[0.08]",
    celebrate: "hover:border-pink-400/40 hover:bg-pink-400/[0.08]",
  };
  return (
    <button onClick={onClick} className={`w-full group flex items-center gap-3 px-3.5 py-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 transition-all duration-200 ${accents[variant]} active:scale-[0.98]`}>
      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-100 transition-colors font-mono text-sm">{emoji}</div>
      <div className="flex-1 text-left">
        <div className="text-sm text-zinc-200 font-medium">{label}</div>
        <div className="text-[11px] text-zinc-500 font-mono">{sub}</div>
      </div>
      <div className="text-zinc-700 group-hover:text-zinc-500 transition-colors">→</div>
    </button>
  );
}
