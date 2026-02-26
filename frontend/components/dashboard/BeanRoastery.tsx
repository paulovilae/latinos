"use client";

import React, { useState } from "react";
import { Bot } from "@/lib/types";
import { RobotArenaTable } from "@/components/dashboard/RobotArenaTable";

/* ───────────────────────── helpers ───────────────────────── */

const DIFY_BASE = "https://dify.imaginos.ai/app";

function beanStatus(bot: Bot): "roasted" | "draft" | "active" | "paused" {
  if (bot.wasm_size_bytes && bot.wasm_size_bytes > 0) {
    if (bot.live_trading) return "active";
    if (bot.status === "paused" || bot.status === "stopped") return "paused";
    return "roasted";
  }
  return "draft";
}

const STATUS_BADGES: Record<string, { label: string; color: string; icon: string }> = {
  draft:   { label: "DRAFT",   color: "bg-slate-700 text-slate-300",    icon: "📝" },
  roasted: { label: "ROASTED", color: "bg-amber-900/60 text-amber-300", icon: "☕" },
  active:  { label: "ACTIVE",  color: "bg-emerald-900/60 text-emerald-300", icon: "🟢" },
  paused:  { label: "PAUSED",  color: "bg-rose-900/60 text-rose-300",   icon: "⏸" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/* ───────────────────────── component ───────────────────────── */

export function BeanRoastery({ bots }: { bots: Bot[] }) {
  const [roasting, setRoasting] = useState<Record<number, boolean>>({});
  const [localBots, setLocalBots] = useState(bots);

  const sortedBots = [...localBots].sort((a, b) => a.name.localeCompare(b.name));

  const handleRoast = async (bot: Bot) => {
    setRoasting((prev) => ({ ...prev, [bot.id]: true }));
    try {
      const res = await fetch(`/api/bots/${bot.id}/compile/wasm`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setLocalBots((prev) =>
          prev.map((b) =>
            b.id === bot.id
              ? { ...b, wasm_size_bytes: data.wasm_size_bytes || data.size, status: "roasted" }
              : b
          )
        );
      } else {
        const err = await res.text();
        alert(`Roast failed: ${err}`);
      }
    } catch (e) {
      console.error(e);
      alert("Bean roasting failed. Check console.");
    } finally {
      setRoasting((prev) => ({ ...prev, [bot.id]: false }));
    }
  };

  /* ─── stats bar ─── */
  const totalBeans = localBots.length;
  const roastedCount = localBots.filter((b) => beanStatus(b) !== "draft").length;
  const activeCount = localBots.filter((b) => beanStatus(b) === "active").length;
  const totalWasmKB = localBots.reduce((sum, b) => sum + (b.wasm_size_bytes || 0), 0);

  return (
    <div className="space-y-6">
      {/* ═══════ Header Stats ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Bots" value={totalBeans} icon="🤖" />
        <StatCard label="Roasted Beans" value={roastedCount} icon="☕" accent="amber" />
        <StatCard label="Active Trading" value={activeCount} icon="🟢" accent="emerald" />
        <StatCard
          label="Total WASM"
          value={totalWasmKB > 0 ? formatBytes(totalWasmKB) : "—"}
          icon="💎"
          accent="indigo"
        />
      </div>

      {/* ═══════ Bean Gallery ═══════ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              ☕ Bean Roastery
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Compiled WASM strategies from Dify Canvas
            </span>
          </div>
          <a
            href={DIFY_BASE}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center gap-2"
          >
            <span>✨</span> Open Dify Canvas
          </a>
        </div>

        {sortedBots.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-slate-900/50">
            <span className="text-5xl mb-4">☕</span>
            <p className="text-slate-400 font-bold text-lg">No beans yet.</p>
            <p className="text-slate-500 text-sm mt-1">
              Create a strategy in Dify Canvas, then roast it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0.5 bg-slate-800/30 p-0.5">
            {sortedBots.map((bot) => {
              const status = beanStatus(bot);
              const badge = STATUS_BADGES[status];
              const isRoasting = roasting[bot.id] || false;

              return (
                <div
                  key={bot.id}
                  className="bg-slate-900 p-5 flex flex-col gap-3 hover:bg-slate-800/70 transition-colors group"
                >
                  {/* Top row: name + badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-base truncate group-hover:text-indigo-300 transition-colors">
                        {bot.name}
                      </h4>
                      {bot.description && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate">
                          {bot.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`${badge.color} text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ml-2 shrink-0`}
                    >
                      {badge.icon} {badge.label}
                    </span>
                  </div>

                  {/* Indicator + condition */}
                  {(bot.indicator || bot.condition) && (
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-800 text-slate-300 text-xs font-mono px-2 py-1 rounded border border-slate-700">
                        {bot.indicator?.toUpperCase() || "—"}
                      </span>
                      <span className="text-slate-500 text-xs font-mono">
                        {bot.condition || "—"}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {bot.tags && bot.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {bot.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-slate-800/80 text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-700/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* WASM info bar */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-3 text-xs">
                      {bot.wasm_size_bytes && bot.wasm_size_bytes > 0 ? (
                        <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                          ☕ {formatBytes(bot.wasm_size_bytes)}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">No bean yet</span>
                      )}
                      {bot.dify_app_id && (
                        <a
                          href={`${DIFY_BASE}/${bot.dify_app_id}/workflow`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                        >
                          Edit in Dify →
                        </a>
                      )}
                    </div>

                    {/* Roast button */}
                    <button
                      onClick={() => handleRoast(bot)}
                      disabled={isRoasting}
                      className="bg-amber-600/80 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all hover:shadow-[0_0_12px_rgba(217,119,6,0.4)] flex items-center gap-1.5"
                    >
                      {isRoasting ? (
                        <>
                          <svg
                            className="animate-spin h-3 w-3 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Roasting…
                        </>
                      ) : (
                        <>☕ Roast Bean</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ Arena Matrix ═══════ */}
      <RobotArenaTable bots={localBots} />
    </div>
  );
}

/* ───────────────────────── stat card ───────────────────────── */

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: string;
}) {
  const accentMap: Record<string, string> = {
    amber: "from-amber-500/10 to-transparent border-amber-800/30",
    emerald: "from-emerald-500/10 to-transparent border-emerald-800/30",
    indigo: "from-indigo-500/10 to-transparent border-indigo-800/30",
  };
  const accentClass = accent
    ? accentMap[accent] || ""
    : "from-slate-500/10 to-transparent border-slate-800";

  return (
    <div
      className={`bg-gradient-to-br ${accentClass} border rounded-xl p-4 flex items-center gap-3`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-white font-black text-lg leading-tight">{value}</p>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
