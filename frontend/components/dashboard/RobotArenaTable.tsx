"use client";
import { useState } from "react";
import { Bot } from "@/lib/types";

export function RobotArenaTable({ bots }: { bots: Bot[] }) {
  const [selectedAsset, setSelectedAsset] = useState("BTC-USD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");

  // Sort bots for the arena leaderboard
  const sortedArenaBots = [...bots]
    .filter(b => {
        let metrics = b.live_metrics as any;
        if (typeof metrics === 'string') {
            try { metrics = JSON.parse(metrics); } catch (e) { return false; }
        }
        let targetMetrics = metrics?.[selectedAsset]?.[selectedTimeframe];
        if (!targetMetrics && selectedTimeframe === "30d" && (selectedAsset === "BTC-USD" || selectedAsset === metrics?.trailing_30d?.symbol)) {
            targetMetrics = metrics?.trailing_30d;
        }
        return !!targetMetrics;
    })
    .sort((a, b) => {
        let metricsA = a.live_metrics as any;
        if (typeof metricsA === 'string') {
            try { metricsA = JSON.parse(metricsA); } catch(e) {}
        }
        let metricsB = b.live_metrics as any;
        if (typeof metricsB === 'string') {
            try { metricsB = JSON.parse(metricsB); } catch(e) {}
        }
        
        let targetA = metricsA?.[selectedAsset]?.[selectedTimeframe];
        if (!targetA && selectedTimeframe === "30d" && (selectedAsset === "BTC-USD" || selectedAsset === metricsA?.trailing_30d?.symbol)) targetA = metricsA?.trailing_30d;
        
        let targetB = metricsB?.[selectedAsset]?.[selectedTimeframe];
        if (!targetB && selectedTimeframe === "30d" && (selectedAsset === "BTC-USD" || selectedAsset === metricsB?.trailing_30d?.symbol)) targetB = metricsB?.trailing_30d;

        const sharpeA = targetA?.sharpe || -999;
        const sharpeB = targetB?.sharpe || -999;
        return sharpeB - sharpeA; // Descending
    });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    ⚔️ Robot Arena Leaderboard
                </h3>
                <span className="text-xs font-mono text-slate-500">Benchmark bots against global assets</span>
            </div>
            <div className="flex gap-2 isolate">
                <select 
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none"
                >
                    <option value="BTC-USD">Bitcoin (BTC-USD)</option>
                    <option value="ETH-USD">Ethereum (ETH-USD)</option>
                    <option value="AAPL">Apple (AAPL)</option>
                    <option value="NVDA">Nvidia (NVDA)</option>
                    <option value="SPY">S&P 500 (SPY)</option>
                </select>
                <select 
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none"
                >
                    <option value="30d">30 Days</option>
                    <option value="90d">90 Days</option>
                    <option value="180d">180 Days</option>
                    <option value="365d">1 Year</option>
                </select>
            </div>
        </div>

        {sortedArenaBots.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50">
                <span className="text-4xl mb-3">📡</span>
                <p className="text-slate-400 font-bold">No data for this combination.</p>
                <p className="text-slate-500 text-sm mt-1">Matrix backtests run nightly across all assets.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950/50 text-xs uppercase font-medium text-slate-500 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Rank & Robot</th>
                            <th className="px-6 py-4">Total Return ({selectedTimeframe})</th>
                            <th className="px-6 py-4">Win Rate</th>
                            <th className="px-6 py-4">Max DD</th>
                            <th className="px-6 py-4 text-right">Sharpe Ratio</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {sortedArenaBots.map((bot, idx) => {
                            let metrics = bot.live_metrics as any;
                            if (typeof metrics === 'string') {
                                try { metrics = JSON.parse(metrics); } catch (e) {}
                            }
                            
                            let targetMetrics = metrics?.[selectedAsset]?.[selectedTimeframe];
                            if (!targetMetrics && selectedTimeframe === "30d" && (selectedAsset === "BTC-USD" || selectedAsset === metrics?.trailing_30d?.symbol)) {
                                targetMetrics = metrics?.trailing_30d;
                            }
                            
                            const isLeader = idx === 0;
                            return (
                                <tr key={`arena-${bot.id}`} className={`hover:bg-slate-800/50 transition-colors ${isLeader ? 'bg-indigo-900/10' : ''}`}>
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-black ${isLeader ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' : idx === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' : 'bg-slate-800 text-slate-500'}`}>
                                        #{idx + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-base flex items-center gap-2">
                                            {bot.name}
                                            {isLeader && <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Champion</span>}
                                        </div>
                                        <div className="text-xs font-mono text-slate-500 mt-0.5">{targetMetrics?.symbol || selectedAsset}</div>
                                    </div>
                                </td>
                                <td className={`px-6 py-4 font-mono font-bold ${targetMetrics?.total_return > 0 ? "text-emerald-400" : targetMetrics?.total_return < 0 ? "text-rose-400" : "text-slate-400"}`}>
                                    {targetMetrics?.total_return > 0 ? "+" : ""}{(targetMetrics?.total_return || 0).toFixed(2)}%
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    {(targetMetrics?.win_rate || 0).toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 font-mono text-rose-400">
                                    {(targetMetrics?.max_drawdown || 0).toFixed(2)}%
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`text-lg font-black font-mono ${(targetMetrics?.sharpe || 0) >= 1.0 ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "text-slate-300"}`}>
                                        {(targetMetrics?.sharpe || 0).toFixed(2)}
                                    </span>
                                </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
}
