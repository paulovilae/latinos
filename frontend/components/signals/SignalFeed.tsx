"use client";

import { useState } from "react";
import { Signal, Bot } from "@/lib/types";
import { TagPill } from "@/components/TagPill";
// Using Next.js API routes (no direct backend calls)

interface SignalFeedProps {
  initialSignals: Signal[];
  botNameMap: Map<number, string>;
}

export function SignalFeed({ initialSignals, botNameMap }: SignalFeedProps) {
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [busySignalId, setBusySignalId] = useState<number | null>(null);

  const handleBuy = async (signal: Signal) => {
    setBusySignalId(signal.id);
    try {
      // Record a trade in the new trades table
      await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_id: signal.bot_id,
          signal_id: signal.id,
          symbol: "BTC-USD", // Default or extract from payload if available
          side: "buy",
          price: (signal.payload as any).price || 0,
          amount: 1.0,
        }),
      });
      alert("Simulated Buy order placed successfully!");
    } catch (err) {
      console.error("Trade failed:", err);
      alert("Failed to place simulated trade.");
    } finally {
      setBusySignalId(null);
    }
  };

  const getModeLabel = (mode: string) => {
    const m = mode.toLowerCase();
    if (m === "paper" || m === "simulation") return "Simulation (Entrenamiento)";
    return mode.toUpperCase();
  };

  return (
    <ul className="space-y-3">
      {signals.map((signal) => (
        <li key={signal.id} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                 <p className="font-semibold text-white">{botNameMap.get(signal.bot_id) ?? `Bot #${signal.bot_id}`}</p>
                 <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-tight">
                    {getModeLabel(signal.mode)}
                 </span>
              </div>
              <p className="text-xs text-slate-400 font-mono bg-black/30 p-2 rounded border border-white/5 truncate max-w-md">
                {JSON.stringify(signal.payload)}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-3 ml-4">
              <div className="flex gap-2 items-center">
                <TagPill 
                  label={signal.type.toUpperCase()} 
                  tone={signal.type === "buy" ? "success" : "warning"} 
                />
                <span className="text-[10px] text-slate-500 whitespace-nowrap" suppressHydrationWarning>
                  {new Date(signal.emitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </span>
              </div>

              {signal.type === "buy" && (
                <button
                  onClick={() => handleBuy(signal)}
                  disabled={busySignalId === signal.id}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {busySignalId === signal.id ? "..." : "🛒 Buy"}
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
      {signals.length === 0 && (
        <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
           No signals found yet.
        </div>
      )}
    </ul>
  );
}
