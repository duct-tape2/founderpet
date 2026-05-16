"use client";

const integrations = [
  { name: "Stripe", icon: "💳", status: "ready", desc: "Auto-track every charge" },
  { name: "Gumroad", icon: "🛒", status: "ready", desc: "Webhook on sale" },
  { name: "Polar.sh", icon: "⚡", status: "ready", desc: "Open-source friendly" },
  { name: "Lemon Squeezy", icon: "🍋", status: "ready", desc: "Global merchant of record" },
  { name: "PayPal", icon: "📨", status: "ready", desc: "Manual or webhook" },
  { name: "Toss / 카카오페이", icon: "🇰🇷", status: "beta", desc: "한국 결제 통합" },
  { name: "GitHub Sponsors", icon: "💖", status: "ready", desc: "Monthly recurring" },
  { name: "Manual entry", icon: "✍️", status: "ready", desc: "For everything else" },
];

export default function RevenueIntegrations() {
  return (
    <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Revenue → Pet Growth</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">Every dollar in feeds your pet automatically.</p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-400/80 font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          Auto-Sync
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-zinc-800/40">
        {integrations.map((i) => (
          <div key={i.name} className="bg-zinc-950/60 p-3.5 hover:bg-zinc-900/60 transition-colors group cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg group-hover:border-zinc-700 transition-colors">
                {i.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-zinc-200 font-medium">{i.name}</span>
                  {i.status === "beta" && (
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">
                      beta
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">{i.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer explainer */}
      <div className="px-5 py-3.5 border-t border-zinc-800/60 bg-zinc-950/40">
        <div className="text-[11px] text-zinc-500 leading-relaxed font-mono">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-emerald-400">$1</span>
            <span className="text-zinc-600">→</span>
            <span className="text-zinc-400">+1 EXP</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">capped at $500 / event</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-pink-400">first sale</span>
            <span className="text-zinc-600">→</span>
            <span className="text-zinc-400">mood: celebrating 🎉 24h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
