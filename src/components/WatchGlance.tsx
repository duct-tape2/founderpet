import type { WatchPayload } from "@/lib/watch-payload";

export default function WatchGlance({ payload }: { payload: WatchPayload }) {
  return (
    <section className="rounded-2xl border border-zinc-800/70 bg-zinc-900/45 p-5 backdrop-blur-xl">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">Apple Watch Glance</div>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-100">손목에서는 정보량을 줄이고 행동만 남김</h2>

      <div className="mt-5 flex justify-center">
        <div className="w-[210px] rounded-[2rem] border border-zinc-700 bg-black p-4 shadow-2xl shadow-black/50">
          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>{payload.complication.corner}</span>
              <span>{payload.pet.stage}</span>
            </div>
            <div className="mt-4 text-center">
              <div className="text-4xl">{payload.pet.stage === "DRAGON" ? "🐉" : payload.pet.stage === "GRIFFIN" ? "✨" : payload.pet.stage === "EAGLE" ? "🦅" : payload.pet.stage === "BIRD" ? "🐤" : payload.pet.stage === "CHICK" ? "🐣" : "🥚"}</div>
              <div className="mt-2 text-xl font-semibold uppercase tracking-tight text-zinc-100">{payload.complication.center}</div>
              <div className="mt-1 text-xs text-zinc-500">{payload.pulse.headline}</div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-zinc-100" style={{ width: `${payload.complication.ringPercent}%` }} />
            </div>
            <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-2 text-[11px] leading-relaxed text-amber-100">
              {payload.pulse.nextAction}
            </div>
            <div className="mt-3 text-center text-[10px] font-mono text-zinc-600">{payload.complication.footer}</div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        Native Watch 앱은 이 payload만 polling하면 됩니다. 3D 렌더가 없어도 complication/notification에 바로 쓸 수 있게 숫자와 행동을 압축했습니다.
      </p>
    </section>
  );
}
