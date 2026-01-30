"use client";

import { useState } from "react";
import { Signal } from "@/lib/types";
import { TagPill } from "@/components/TagPill";
import { useLocale } from "@/components/LocalizationProvider";
// Using Next.js API routes (no direct backend calls)

interface SignalFeedProps {
  initialSignals: Signal[];
  botNameMap: Map<number, string>;
}

export function SignalFeed({ initialSignals, botNameMap }: SignalFeedProps) {
  const { t } = useLocale();
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [busySignalId, setBusySignalId] = useState<number | null>(null);

  const handleTrade = async (signal: Signal, side: "buy" | "sell") => {
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
          side: side,
          price: (signal.payload as any).price || 0,
          amount: 1.0,
        }),
      });
      alert(t("simulatedOrderPlaced", "Simulated order placed successfully!"));
    } catch (err) {
      console.error("Trade failed:", err);
      alert(t("simulatedOrderFailed", "Failed to place simulated trade."));
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
    <ul className="space-y-4">
      {signals.map((signal) => (
        <li key={signal.id} className="group relative border border-slate-800 rounded-xl bg-slate-950 hover:bg-slate-900/80 transition-all hover:shadow-lg hover:shadow-indigo-500/10 overflow-hidden">
          {/* Left accent bar based on signal type */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${signal.type === 'buy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Signal Info */}
            <div className="flex-1 space-y-2">
               <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-white tracking-tight">{botNameMap.get(signal.bot_id) ?? `Bot #${signal.bot_id}`}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-widest font-semibold">
                    {getModeLabel(signal.mode)}
                  </span>
               </div>
               
               {/* Robot Recommendation Badge */}
               <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-300 font-medium uppercase tracking-wider">{t("robotRecommendation", "Robot Recommendation")}:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      signal.type === 'buy' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                      {signal.type.toUpperCase()}
                  </span>
               </div>

               <div className="text-xs text-slate-500 font-mono bg-black/40 p-2.5 rounded-lg border border-white/5 truncate max-w-lg">
                 {JSON.stringify(signal.payload)}
               </div>
            </div>
            
            {/* Actions & Timestamp */}
            <div className="flex flex-col items-end gap-3 min-w-[140px]">
              <span className="text-[10px] text-slate-500 font-mono" suppressHydrationWarning>
                  {new Date(signal.emitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>

              <div className="flex items-center gap-2 w-full justify-end">
                  {/* Always show the recommended action prominently */}
                  {signal.type === "buy" ? (
                    <button
                      onClick={() => handleTrade(signal, "buy")}
                      disabled={busySignalId === signal.id}
                      className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busySignalId === signal.id ? t("loading", "Loading...") : t("buyBtn", "🛒 Buy")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTrade(signal, "sell")}
                      disabled={busySignalId === signal.id}
                      className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-rose-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {busySignalId === signal.id ? t("loading", "Loading...") : t("sellBtn", "💰 Sell")}
                    </button>
                  )}
              </div>
            </div>

          </div>
        </li>
      ))}
      
      {signals.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
           <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3 text-2xl opacity-50">📡</div>
           <p className="text-sm">{t("noSignalsFound", "No signals found yet.")}</p>
        </div>
      )}
    </ul>
  );
}
