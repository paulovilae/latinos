"use client";

import { useMemo } from "react";

interface SignalData {
  signal_id: number;
  name: string;
  results: { timestamp: string; close: number; result: boolean | null }[];
}

interface SignalScannerProps {
  signals: SignalData[];
  timestamps: string[];
  symbol: string;
}

export function SignalScanner({ signals, timestamps, symbol }: SignalScannerProps) {
  // Compute confluence (% of signals passing) per timestamp
  const confluence = useMemo(() => {
    if (!signals.length || !timestamps.length) return [];
    return timestamps.map((_, colIdx) => {
      let pass = 0;
      let total = 0;
      signals.forEach(sig => {
        const r = sig.results[colIdx]?.result;
        if (r !== null && r !== undefined) {
          total++;
          if (r === true) pass++;
        }
      });
      return total > 0 ? Math.round((pass / total) * 100) : 0;
    });
  }, [signals, timestamps]);

  // Format date for display
  const formatDate = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return ts.slice(0, 10);
    }
  };

  // Determine how many columns to show based on data
  // Show last 30-60 days in the heatmap for readability
  const maxCols = Math.min(timestamps.length, 60);
  const startCol = timestamps.length - maxCols;

  const visibleTimestamps = timestamps.slice(startCol);
  const visibleConfluence = confluence.slice(startCol);

  if (!signals.length) return null;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950/50">
        <h4 className="font-semibold text-white text-sm flex items-center gap-2">
          <span>📡</span> Signal Scanner
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-black">
            {symbol}
          </span>
        </h4>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> PASS
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> FAIL
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700"></span> ERROR
          </span>
        </div>
      </div>

      {/* Scrollable Heatmap */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-max">
          {/* Date header row */}
          <div className="flex border-b border-slate-800/50">
            <div className="w-36 flex-shrink-0 px-3 py-1.5 text-[9px] text-slate-600 font-bold uppercase tracking-wider sticky left-0 bg-slate-900 z-10">
              Signal
            </div>
            {visibleTimestamps.map((ts, i) => (
              <div
                key={i}
                className="w-7 flex-shrink-0 text-center text-[8px] text-slate-600 py-1.5"
                title={ts}
              >
                {i % 5 === 0 ? formatDate(ts) : ""}
              </div>
            ))}
          </div>

          {/* Signal rows */}
          {signals.map((sig) => {
            const visibleResults = sig.results.slice(startCol);
            const passCount = visibleResults.filter(r => r.result === true).length;
            const passRate = visibleResults.length > 0
              ? Math.round((passCount / visibleResults.length) * 100)
              : 0;

            return (
              <div key={sig.signal_id} className="flex border-b border-slate-800/30 group hover:bg-slate-800/20 transition-colors">
                {/* Signal name */}
                <div className="w-36 flex-shrink-0 px-3 py-1 flex items-center justify-between sticky left-0 bg-slate-900 group-hover:bg-slate-800/50 z-10 border-r border-slate-800/30">
                  <span className="text-[11px] text-slate-300 font-medium truncate mr-1" title={sig.name}>
                    {sig.name}
                  </span>
                  <span className={`text-[9px] font-mono font-bold ${passRate >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                    {passRate}%
                  </span>
                </div>

                {/* Heatmap cells */}
                {visibleResults.map((r, i) => {
                  const bg = r.result === true
                    ? "bg-emerald-500/80"
                    : r.result === false
                    ? "bg-rose-500/60"
                    : "bg-slate-700/40";

                  return (
                    <div
                      key={i}
                      className={`w-7 h-6 flex-shrink-0 border-r border-slate-900/50 ${bg} transition-all hover:brightness-125 cursor-crosshair`}
                      title={`${sig.name} | ${formatDate(r.timestamp)} | $${r.close?.toFixed(2)} | ${r.result === true ? "PASS ✅" : r.result === false ? "FAIL ❌" : "ERROR ⚠️"}`}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Confluence bar */}
          <div className="flex border-t-2 border-indigo-500/30">
            <div className="w-36 flex-shrink-0 px-3 py-1.5 sticky left-0 bg-slate-900 z-10 border-r border-slate-800/30">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Confluence</span>
            </div>
            {visibleConfluence.map((pct, i) => {
              const intensity = pct / 100;
              const bg = pct === 100
                ? "bg-emerald-500"
                : pct >= 75
                ? "bg-emerald-500/60"
                : pct >= 50
                ? "bg-emerald-600/30"
                : pct > 0
                ? "bg-rose-500/40"
                : "bg-slate-800/30";

              return (
                <div
                  key={i}
                  className={`w-7 h-7 flex-shrink-0 border-r border-slate-900/50 ${bg} flex items-center justify-center transition-all hover:brightness-125 cursor-crosshair`}
                  title={`${formatDate(visibleTimestamps[i])} | ${pct}% signals passing`}
                >
                  {pct === 100 && (
                    <span className="text-[8px] font-black text-white">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-[10px]">
        <div className="text-slate-500">
          {signals.length} signals × {visibleTimestamps.length} candles
        </div>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400 font-bold">
            {visibleConfluence.filter(c => c === 100).length} perfect confluences
          </span>
          <span className="text-slate-400">
            Avg: {visibleConfluence.length > 0 ? Math.round(visibleConfluence.reduce((a, b) => a + b, 0) / visibleConfluence.length) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
