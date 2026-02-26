"use client";
import React, { useState } from "react";
import { Bot } from "@/lib/types";

import { SUPPORTED_ASSETS } from "@/lib/constants";

export function RobotArenaTable({ bots }: { bots: Bot[] }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
        const res = await fetch(`/api/bots/refresh_arena_all`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        if (res.ok) {
            alert("Global Matrix Backtest Queued. Refresh the page in a few minutes to see updated results across all assets and robots.");
        } else {
            alert("Failed to queue global refresh.");
        }
    } catch(e) {
        console.error(e);
    } finally {
        setIsRefreshing(false);
    }
  };

  // Filter bots: Only show bots that have at least one valid, non-zero return for the selected timeframe.
  // (A bot with all 0.00% returns across all assets means it didn't trade or has no data, so we hide it).
  const validArenaBots = bots.filter(bot => {
      let metrics = bot.live_metrics as any;
      if (typeof metrics === 'string') {
          try { metrics = JSON.parse(metrics); } catch (e) { return false; }
      }
      
      if (!metrics) return false;

      let hasValidData = false;
      for (const asset of SUPPORTED_ASSETS) {
          const targetMetrics = metrics?.[asset]?.[selectedTimeframe];
          if (targetMetrics && targetMetrics.total_return !== 0) {
              hasValidData = true;
              break;
          }
      }
      return hasValidData;
  });

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
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Queuing...
                        </>
                    ) : (
                        <>
                            <span>⚡</span> RECALCULATE MATRIX
                        </>
                    )}
                </button>
            </div>
        </div>

        {sortedArenaBots.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50">
                <span className="text-4xl mb-3">📡</span>
                <p className="text-slate-400 font-bold">No robots found in the arena.</p>
            </div>
        ) : (
            <div className="overflow-x-auto relative custom-scrollbar">
                <table className="w-full text-left text-sm text-slate-400 min-w-max border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-20 bg-slate-950 p-4 border-b border-r border-slate-800 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)] font-black text-indigo-400 uppercase tracking-widest text-xs">
                                Robot \ Asset
                            </th>
                            {SUPPORTED_ASSETS.map(asset => (
                                <th key={asset} className="p-4 bg-slate-950/80 border-b border-r border-slate-800/50 text-center font-mono text-xs text-slate-300 font-bold tracking-wider">
                                    {asset}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedArenaBots.map(bot => (
                            <tr key={bot.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group/row">
                                <td className="sticky left-0 z-10 bg-slate-900 p-4 font-bold text-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.5)] border-r border-slate-800 max-w-[250px] truncate group-hover/row:bg-slate-800 transition-colors" title={bot.name}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="truncate">{bot.name}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-1 ml-4 truncate">
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
                                        return (
                                            <td key={`${bot.id}-${asset}`} className="p-0 border-r border-slate-800/30">
                                                <div className="h-full w-full p-4 flex items-center justify-center bg-transparent text-slate-700 font-mono text-xs">
                                                    -
                                                </div>
                                            </td>
                                        );
                                    }

                                    const ret = targetMetrics.total_return;
                                    const sharpe = targetMetrics.sharpe;
                                    
                                    // Heatmap Color Logic
                                    // We use a scale based on Total Return percentage
                                    let bgColor = "bg-slate-800";
                                    let textColor = "text-slate-400";
                                    
                                    if (ret >= 50) { bgColor = "bg-emerald-400"; textColor = "text-emerald-950 font-black"; }
                                    else if (ret >= 20) { bgColor = "bg-emerald-500"; textColor = "text-white font-black"; }
                                    else if (ret >= 10) { bgColor = "bg-emerald-600"; textColor = "text-white font-bold"; }
                                    else if (ret >= 5) { bgColor = "bg-emerald-700"; textColor = "text-emerald-50"; }
                                    else if (ret > 0) { bgColor = "bg-emerald-900/60"; textColor = "text-emerald-400 font-medium"; }
                                    else if (ret === 0) { bgColor = "bg-slate-800/50"; textColor = "text-slate-500"; }
                                    else if (ret <= -50) { bgColor = "bg-rose-500"; textColor = "text-white font-black"; }
                                    else if (ret <= -20) { bgColor = "bg-rose-600"; textColor = "text-white font-bold"; }
                                    else if (ret <= -10) { bgColor = "bg-rose-700"; textColor = "text-rose-50"; }
                                    else if (ret <= -5) { bgColor = "bg-rose-800"; textColor = "text-rose-200"; }
                                    else if (ret < 0) { bgColor = "bg-rose-950/60"; textColor = "text-rose-400 font-medium"; }
                                    
                                    return (
                                        <td key={`${bot.id}-${asset}`} className={`p-0 border-r border-slate-800/30 align-middle relative`}>
                                            <div className={`h-16 w-full px-2 py-3 flex flex-col items-center justify-center ${bgColor} ${textColor} transition-all hover:brightness-125 cursor-help group relative hover:z-30 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:scale-105 hover:rounded-md`}>
                                                <span className="text-sm tracking-tight tabular-nums">
                                                    {ret === 0 ? "0.0%" : `${ret > 0 ? "+" : ""}${ret.toFixed(1)}%`}
                                                </span>
                                                {/* Tooltip */}
                                                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-slate-700 pointer-events-none w-56 z-50 transition-opacity whitespace-normal text-left">
                                                    <div className="font-bold border-b border-slate-700 pb-2 mb-3 text-sm flex justify-between items-center text-indigo-300">
                                                        <span>{asset}</span>
                                                        <span className="text-slate-400 text-[10px] bg-slate-800 px-2 py-0.5 rounded">{selectedTimeframe}</span>
                                                    </div>
                                                    <div className="flex justify-between mb-1.5"><span className="text-slate-400 font-medium">Total Return:</span> <span className={`font-mono font-bold ${ret > 0 ? "text-emerald-400" : ret < 0 ? "text-rose-400" : "text-slate-400"}`}>{ret === 0 ? "0.0%" : `${ret > 0 ? "+" : ""}${ret.toFixed(1)}%`}</span></div>
                                                    <div className="flex justify-between mb-1.5"><span className="text-slate-400">Win Rate:</span> <span className="font-mono">{(targetMetrics.win_rate || 0).toFixed(1)}%</span></div>
                                                    <div className="flex justify-between mb-1.5"><span className="text-slate-400">Max DD:</span> <span className="font-mono text-rose-400">{(targetMetrics.max_drawdown || 0).toFixed(1)}%</span></div>
                                                    <div className="flex justify-between pt-2 mt-2 border-t border-slate-800"><span className="text-slate-400 font-bold">Sharpe Ratio:</span> <span className={`font-mono font-black ${(sharpe || 0) >= 1.0 ? "text-cyan-400" : "text-slate-300"}`}>{(sharpe || 0).toFixed(2)}</span></div>
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
