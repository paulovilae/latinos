"use client";
import React, { useState, useEffect, useRef } from "react";
import { Bot } from "@/lib/types";

import { SUPPORTED_ASSETS } from "@/lib/constants";

interface ArenaStatus {
  running: boolean;
  done: number;
  total: number;
  pct: number;
  current_bot: string;
  current_asset: string;
  bots_completed: number;
  bots_total: number;
  elapsed_s: number;
  rate: number;
  eta_s: number;
}

export function RobotArenaTable({ bots }: { bots: Bot[] }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [arenaStatus, setArenaStatus] = useState<ArenaStatus | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Poll arena status when refreshing
  useEffect(() => {
    // Check if arena is already running on mount
    fetch("/api/bots/arena_status").then(r => r.json()).then((s: ArenaStatus) => {
      if (s.running) {
        setIsRefreshing(true);
        setArenaStatus(s);
        startPolling();
      }
    }).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/bots/arena_status");
        const s: ArenaStatus = await res.json();
        setArenaStatus(s);
        if (!s.running) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setIsRefreshing(false);
          // Auto-reload to show fresh data
          window.location.reload();
        }
      } catch {}
    }, 2000);
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/bots/refresh_arena_all`, { method: "POST" });
      if (res.ok) {
        startPolling();
      } else {
        alert("Failed to queue global refresh. Please ensure you are logged in.");
        setIsRefreshing(false);
      }
    } catch(e) {
      console.error(e);
      setIsRefreshing(false);
    }
  };

  // Remove the zero-return filter so newly created bots (like Golden Gooses) appear immediately
  // before their first nightly backtest finishes computing metrics.
  const validArenaBots = bots;

  // Sort bots alphabetically
  const sortedArenaBots = [...validArenaBots].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    🔥 Robot Arena Matrix
                </h3>
                <span className="text-xs font-mono text-slate-500">Global Heatmap: Strategies vs Asssets</span>
            </div>
            <div className="flex flex-wrap gap-3 items-center isolate">
                <select 
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="bg-slate-800 border-2 border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-indigo-500 outline-none cursor-pointer font-bold shadow-inner"
                >
                    <option value="7d">1 Week (7d)</option>
                    <option value="15d">15 Days (15d)</option>
                    <option value="30d">1 Month (30d)</option>
                    <option value="90d">1 Quarter (90d)</option>
                    <option value="180d">6 Months (180d)</option>
                    <option value="365d">1 Year (365d)</option>
                </select>
                
                <button 
                    onClick={handleRefreshAll}
                    disabled={isRefreshing}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black px-5 py-2 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center gap-2"
                >
                    {isRefreshing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {arenaStatus ? `${arenaStatus.pct.toFixed(0)}%` : "Queuing..."}
                        </>
                    ) : (
                        <>
                            <span>⚡</span> RECALCULATE MATRIX
                        </>
                    )}
                </button>
            </div>
            {/* Live Arena Progress Bar */}
            {isRefreshing && arenaStatus && arenaStatus.running && (
                <div className="px-5 pb-4 -mt-1">
                    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-indigo-300 font-bold font-mono">
                                🏟️ {arenaStatus.current_bot} × {arenaStatus.current_asset}
                            </span>
                            <span className="text-slate-400 font-mono">
                                {arenaStatus.done}/{arenaStatus.total} tests • {arenaStatus.rate.toFixed(1)}/s • ETA {Math.ceil(arenaStatus.eta_s)}s
                            </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${arenaStatus.pct}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>Bot {arenaStatus.bots_completed}/{arenaStatus.bots_total}</span>
                            <span>{arenaStatus.elapsed_s.toFixed(0)}s elapsed</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
        {sortedArenaBots.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50">
                <span className="text-4xl mb-3">📡</span>
                <p className="text-slate-400 font-bold">No robots found in the arena.</p>
            </div>
        ) : (
            <div className="overflow-x-auto relative custom-scrollbar">
                <table className="w-full text-left text-sm text-slate-400 border-collapse table-fixed" style={{ minWidth: `${200 + SUPPORTED_ASSETS.length * 100}px` }}>
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-20 bg-slate-950 p-4 border-b border-r border-slate-800 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)] font-black text-indigo-400 uppercase tracking-widest text-xs w-[200px]">
                                Robot \ Asset
                            </th>
                            {SUPPORTED_ASSETS.map(asset => (
                                <th key={asset} className="p-4 bg-slate-950/80 border-b border-r border-slate-800/50 text-center font-mono text-xs text-slate-300 font-bold tracking-wider w-[100px]">
                                    {asset}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedArenaBots.map(bot => (
                            <tr key={bot.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group/row">
                                <td className="sticky left-0 z-10 bg-slate-900 p-4 font-bold text-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)] border-r border-slate-800 max-w-[250px] group-hover/row:bg-slate-800 transition-colors" title={bot.name}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                                        <span className="truncate">{bot.name}</span>
                                        {bot.script && bot.script.length > 0 && (
                                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 ml-1 shrink-0" title="External Python or Webhook Strategy">EXTERNAL</span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono ml-4 truncate">
                                        {bot.description ? bot.description.substring(0, 40) + "..." : "No description"}
                                    </div>
                                </td>
                                {SUPPORTED_ASSETS.map(asset => {
                                    let metrics = bot.live_metrics as any;
                                    if (typeof metrics === 'string') {
                                        try { metrics = JSON.parse(metrics); } catch (e) {}
                                    }
                                    
                                    const targetMetrics = metrics?.[asset]?.[selectedTimeframe];
                                    
                                    if (!targetMetrics) {
                                        const isExternal = bot.script && bot.script.length > 0;
                                        return (
                                            <td key={`${bot.id}-${asset}`} className="p-0 border-r border-slate-800/30 group/empty relative cursor-help">
                                                <div className="h-full w-full p-4 flex items-center justify-center bg-transparent text-slate-700 font-mono text-xs">
                                                    -
                                                </div>
                                                <div className="absolute opacity-0 group-hover/empty:opacity-100 top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900 text-slate-300 text-[10px] p-3 rounded shadow-lg border border-slate-700 pointer-events-none w-48 z-[60] transition-opacity">
                                                    {isExternal 
                                                        ? "External script/webhook bots cannot be historically simulated. They only show data for assets they actively trade live." 
                                                        : "No trades occurred for this asset in the selected timeframe."}
                                                </div>
                                            </td>
                                        );
                                    }

                                    const ret = targetMetrics.total_return || 0;
                                    const sharpe = targetMetrics.sharpe || 0;
                                    const winRate = targetMetrics.win_rate || 0;
                                    const maxDd = targetMetrics.max_drawdown || 0;
                                    const numTrades = targetMetrics.num_trades || 0;

                                    // Only treat as empty if zero trades AND zero return
                                    if (numTrades === 0 && ret === 0) {
                                        return (
                                            <td key={`${bot.id}-${asset}`} className="p-0 border-r border-slate-800/30">
                                                <div className="h-full w-full p-4 flex items-center justify-center bg-transparent text-slate-700 font-mono text-xs">
                                                    —
                                                </div>
                                            </td>
                                        );
                                    }
                                    
                                    // Heatmap Color Logic: Continuous Interpolation
                                    // Opacity scales from 0.15 to 0.9 based on absolute return (cap at 40%)
                                    const intensity = Math.min(0.9, Math.max(0.15, Math.abs(ret) / 40));
                                    const bgStyle = ret > 0 
                                        ? `rgba(16, 185, 129, ${intensity})` // Emerald
                                        : `rgba(244, 63, 94, ${intensity})`; // Rose
                                    
                                    const textColor = intensity > 0.4 ? "text-white drop-shadow-md" : (ret > 0 ? "text-emerald-400" : "text-rose-400");
                                    
                                    // Consistent one-decimal formatting with sign
                                    const formattedRet = `${ret > 0 ? "+" : ""}${ret.toFixed(1)}%`;
                                    
                                    return (
                                        <td key={`${bot.id}-${asset}`} className={`p-0 border-r border-slate-800/30 align-middle relative`}>
                                            <div 
                                                style={{ backgroundColor: bgStyle }}
                                                className={`h-16 w-full px-2 py-3 flex flex-col items-center justify-center ${textColor} font-bold transition-all hover:brightness-125 cursor-help group relative hover:z-30 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:scale-105 hover:rounded-md`}
                                            >
                                                <span className="text-sm tracking-tight tabular-nums font-mono">
                                                    {formattedRet}
                                                </span>
                                                <span className="text-[9px] opacity-60 font-normal mt-0.5">
                                                    {numTrades}t
                                                </span>
                                                {/* Tooltip */}
                                                <div className="absolute opacity-0 group-hover:opacity-100 top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900 text-white text-xs p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-slate-700 pointer-events-none w-56 z-[60] transition-opacity whitespace-normal text-left">
                                                    <div className="font-bold border-b border-slate-700 pb-2 mb-3 text-sm flex justify-between items-center text-indigo-300">
                                                        <span>{asset}</span>
                                                        <span className="text-slate-400 text-[10px] bg-slate-800 px-2 py-0.5 rounded">{selectedTimeframe}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1.5"><span className="text-slate-400 font-medium">Total Return:</span> <span className={`font-mono font-bold ${ret > 0 ? "text-emerald-400" : ret < 0 ? "text-rose-400" : "text-slate-400"}`}>{formattedRet}</span></div>
                                                    <div className="flex justify-between mb-1.5"><span className="text-slate-400">Win Rate:</span> <span className="font-mono">{winRate.toFixed(1)}%</span></div>
                                                    <div className="flex justify-between mb-1.5"><span className="text-slate-400">Max DD:</span> <span className="font-mono text-rose-400">{maxDd.toFixed(1)}%</span></div>
                                                    <div className="flex justify-between pt-2 mt-2 border-t border-slate-800"><span className="text-slate-400 font-bold">Sharpe Ratio:</span> <span className={`font-mono font-black ${sharpe >= 1.0 ? "text-cyan-400" : "text-slate-300"}`}>{sharpe.toFixed(2)}</span></div>
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        
        {/* Custom scrollbar styling added via global css or this local style block to ensure the matrix scrolls nicely */}
        <style dangerouslySetInnerHTML={{__html: `
            .custom-scrollbar::-webkit-scrollbar {
                height: 12px;
                width: 12px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #0f172a; 
                border-top: 1px solid #1e293b;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #334155; 
                border-radius: 6px;
                border: 2px solid #0f172a;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #475569; 
            }
        `}} />
    </div>
  );
}
