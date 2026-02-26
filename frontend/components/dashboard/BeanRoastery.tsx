"use client";

import React, { useState } from "react";
import { Bot } from "@/lib/types";
import { RobotArenaTable } from "@/components/dashboard/RobotArenaTable";

/* ───────────────────────── helpers ───────────────────────── */

const DIFY_BASE = "https://dify.imaginos.ai/app";

function beanStatus(bot: Bot): "roasted" | "draft" | "active" | "paused" | "canvas" | "seedling" {
  if (bot.wasm_size_bytes && bot.wasm_size_bytes > 0) {
    if (bot.live_trading) return "active";
    if (bot.status === "paused" || bot.status === "stopped") return "paused";
    return "roasted";
  }
  // Bots from imaginOS Studio Canvas
  if (bot.dify_app_id) {
    // Python-validated = Green Bean, otherwise Seedling
    return bot.python_validated ? "canvas" : "seedling";
  }
  return "draft";
}

const STATUS_BADGES: Record<string, { label: string; color: string; icon: string; tooltip: string }> = {
  draft:    { label: "DRAFT",      color: "bg-slate-700 text-slate-300",        icon: "📝", tooltip: "Strategy exists but hasn't been planted in Canvas yet" },
  seedling: { label: "CHERRY",    color: "bg-red-900/60 text-red-300",         icon: "🍒", tooltip: "Cereza de café — fresh from Canvas, needs Python validation before processing" },
  canvas:   { label: "GREEN BEAN", color: "bg-green-900/60 text-green-300",     icon: "🫘", tooltip: "Python-validated! Ready to be roasted through Rust 🦀" },
  roasted:  { label: "ROASTED 🦀", color: "bg-amber-900/60 text-amber-300",    icon: "☕", tooltip: "Rusted & Roasted! Canvas → Rust → WebAssembly. Ready to brew!" },
  active:   { label: "BREWING",    color: "bg-emerald-900/60 text-emerald-300", icon: "🟢", tooltip: "Live brewing — this bean is actively trading" },
  paused:   { label: "ON ICE",     color: "bg-cyan-900/60 text-cyan-300",      icon: "🧊", tooltip: "Cold brew — compiled and connected but chilling" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/* ───────────────────────── component ───────────────────────── */

export function BeanRoastery({ bots }: { bots: Bot[] }) {
  const [roasting, setRoasting] = useState<Record<number, boolean>>({});
  const [localBots, setLocalBots] = useState(bots);
  const [isRoastingAll, setIsRoastingAll] = useState(false);

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
        const msg = `☕ Roast failed for "${bot.name}":\n${err}`;
        let copied = false;
        try { await navigator.clipboard.writeText(msg); copied = true; } catch {}
        alert(msg + (copied ? "\n\n✅ Copied to clipboard" : ""));
      }
    } catch (e) {
      const msg = `☕ Roast failed for "${bot.name}". Check console.`;
      alert(msg);
    } finally {
      setRoasting((prev) => ({ ...prev, [bot.id]: false }));
    }
  };

  const handleValidate = async (bot: Bot) => {
    setRoasting((prev) => ({ ...prev, [bot.id]: true }));
    try {
      const res = await fetch(`/api/bots/${bot.id}/validate`, {
        method: "POST",
      });
      if (res.ok) {
        setLocalBots((prev) =>
          prev.map((b) =>
            b.id === bot.id ? { ...b, python_validated: true } : b
          )
        );
      } else {
        const err = await res.text();
        const msg = `🌱 Validation failed for "${bot.name}":\n${err}`;
        let copied = false;
        try { await navigator.clipboard.writeText(msg); copied = true; } catch {}
        alert(msg + (copied ? "\n\n✅ Copied to clipboard" : ""));
      }
    } catch (e) {
      console.error(e);
      alert(`🌱 Validation failed for "${bot.name}". Check console.`);
    } finally {
      setRoasting((prev) => ({ ...prev, [bot.id]: false }));
    }
  };

  const handleValidateAll = async () => {
    const seedlings = sortedBots.filter((b) => beanStatus(b) === "seedling");
    if (seedlings.length === 0) {
      alert("No seedlings to validate! All beans are already green or roasted ☕");
      return;
    }
    setIsRoastingAll(true);
    const results: string[] = [];
    const batchStart = Date.now();
    for (const bot of seedlings) {
      const t0 = Date.now();
      try {
        const res = await fetch(`/api/bots/${bot.id}/validate`, { method: "POST" });
        if (res.ok) {
          setLocalBots((prev) => prev.map((b) => b.id === bot.id ? { ...b, python_validated: true } : b));
          results.push(`✅ ${bot.name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
        } else {
          const err = await res.text();
          results.push(`❌ ${bot.name} (${((Date.now() - t0) / 1000).toFixed(1)}s): ${err}`);
        }
      } catch {
        results.push(`❌ ${bot.name}: Network error`);
      }
    }
    setIsRoastingAll(false);
    const elapsed = ((Date.now() - batchStart) / 1000).toFixed(1);
    const ok = results.filter((r) => r.startsWith("✅")).length;
    const msg = `🍒 Validate All Results (${ok}/${seedlings.length} in ${elapsed}s):\n\n${results.join("\n")}`;
    try { await navigator.clipboard.writeText(msg); } catch {}
    alert(msg);
  };

  const handleRoastAll = async () => {
    const roastable = sortedBots.filter((b) => b.dify_app_id);
    if (roastable.length === 0) {
      alert("No Canvas bots to roast!");
      return;
    }
    setIsRoastingAll(true);
    const results: string[] = [];
    const batchStart = Date.now();
    for (const bot of roastable) {
      setRoasting((prev) => ({ ...prev, [bot.id]: true }));
      const t0 = Date.now();
      try {
        const res = await fetch(`/api/bots/${bot.id}/compile/wasm`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setLocalBots((prev) => prev.map((b) =>
            b.id === bot.id ? { ...b, wasm_size_bytes: data.wasm_size_bytes || data.size, status: "roasted" } : b
          ));
          results.push(`☕ ${bot.name} — ROASTED 🦀 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
        } else {
          const err = await res.text();
          results.push(`❌ ${bot.name} (${((Date.now() - t0) / 1000).toFixed(1)}s): ${err}`);
        }
      } catch {
        results.push(`❌ ${bot.name}: Network error`);
      }
      setRoasting((prev) => ({ ...prev, [bot.id]: false }));
    }
    setIsRoastingAll(false);
    const elapsed = ((Date.now() - batchStart) / 1000).toFixed(1);
    const ok = results.filter((r) => r.startsWith("☕")).length;
    const msg = `🔥 Roast All Results (${ok}/${roastable.length} in ${elapsed}s):\n\n${results.join("\n")}`;
    try { await navigator.clipboard.writeText(msg); } catch {}
    alert(msg);
  };

  /* ─── stats bar ─── */
  const totalBeans = localBots.length;
  const roastedCount = localBots.filter((b) => ["roasted", "active", "paused"].includes(beanStatus(b))).length;
  const activeCount = localBots.filter((b) => beanStatus(b) === "active").length;
  const totalWasmKB = localBots.reduce((sum, b) => sum + (b.wasm_size_bytes || 0), 0);

  return (
    <div className="space-y-6">
      {/* ═══════ Header Stats ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Bots" value={totalBeans} icon="🤖" />
        <StatCard label="Green Beans" value={localBots.filter((b) => b.python_validated).length} icon="🫘" accent="green" />
        <StatCard label="Roasted" value={roastedCount} icon="☕" accent="amber" />
        <StatCard label="Brewing" value={activeCount} icon="🟢" accent="emerald" />
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
              Compiled WASM strategies from imaginOS Studio
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleValidateAll}
              disabled={isRoastingAll}
              title="Validate ALL seedling workflows with Python in one batch"
              className="bg-lime-600 hover:bg-lime-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all hover:shadow-[0_0_15px_rgba(132,204,22,0.4)] flex items-center gap-2"
            >
              {isRoastingAll ? "Validating…" : "🌱 Validate All"}
            </button>
            <button
              onClick={handleRoastAll}
              disabled={isRoastingAll}
              title="Compile ALL unroasted Canvas workflows to Rust → WASM in one batch"
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all hover:shadow-[0_0_15px_rgba(217,119,6,0.4)] flex items-center gap-2"
            >
              {isRoastingAll ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Roasting…
                </>
              ) : (
                <>🔥 Roast All</>  
              )}
            </button>
            <a
              href={DIFY_BASE}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center gap-2"
            >
              <span>✨</span> Open imaginOS Studio
            </a>
          </div>
        </div>

        {sortedBots.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-slate-900/50">
            <span className="text-5xl mb-4">☕</span>
            <p className="text-slate-400 font-bold text-lg">No beans yet.</p>
            <p className="text-slate-500 text-sm mt-1">
              Create a strategy in imaginOS Studio, then roast it here.
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
                      className={`${badge.color} text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ml-2 shrink-0 cursor-help`}
                      title={badge.tooltip}
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
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-mono font-bold flex items-center gap-1" title="WASM binary size">
                            💎 {formatBytes(bot.wasm_size_bytes)}
                          </span>
                          <span 
                            className="text-slate-500 font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50 cursor-help"
                            title={`WASM fingerprint: ${bot.wasm_hash || "—"}`}
                          >
                            🔑 {bot.wasm_hash || "—"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono flex items-center gap-1">🍒 Unroasted</span>
                      )}
                      {bot.dify_app_id && (
                        <a
                          href={`${DIFY_BASE}/${bot.dify_app_id}/workflow`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                          title="Edit in imaginOS Studio"
                        >
                          ✏️
                        </a>
                      )}
                    </div>

                    {/* Roast button */}
                    <button
                      onClick={() => status === "seedling" ? handleValidate(bot) : handleRoast(bot)}
                      disabled={isRoasting}
                      title={status === "seedling" 
                        ? "Validate this Canvas workflow with Python — check the logic before Rust compilation" 
                        : "Compile this Canvas workflow into Rust → WebAssembly for lightning-fast execution"}
                      className={`${status === "seedling" ? "bg-lime-600 hover:bg-lime-500" : "bg-amber-600/80 hover:bg-amber-500"} disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all hover:shadow-[0_0_12px_rgba(217,119,6,0.4)] flex items-center gap-1.5`}
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
                        <>{status === "roasted" || status === "active" || status === "paused" ? "🔄 Re-Roast" : status === "canvas" ? "☕ Roast Bean" : "🍒 Validate"}</>
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
