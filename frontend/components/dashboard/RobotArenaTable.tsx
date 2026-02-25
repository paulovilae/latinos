"use client";
import React, { useState, Fragment } from "react";
import { Bot } from "@/lib/types";

export function RobotArenaTable({ bots }: { bots: Bot[] }) {
  const [selectedAsset, setSelectedAsset] = useState("BTC-USD");
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");
  const [expandedBotId, setExpandedBotId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (botId: number) => {
    setIsRefreshing(true);
    try {
        const res = await fetch(`/api/bots/${botId}/refresh_arena`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        if (res.ok) {
            alert("Matrix Backtest Queued. Refresh the page in a few minutes to see updated results.");
        } else {
            alert("Failed to queue refresh.");
        }
    } catch(e) {
        console.error(e);
    } finally {
        setIsRefreshing(false);
    }
  };

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

        const retA = targetA?.total_return || -999;
        const retB = targetB?.total_return || -999;
        const sharpeA = targetA?.sharpe || -999;
        const sharpeB = targetB?.sharpe || -999;
        
        // Rule 1: Positive returns ALWAYS beat negative returns
        if (retA >= 0 && retB < 0) return -1;
        if (retB >= 0 && retA < 0) return 1;
        
        // Rule 2: If BOTH are positive, rank by Sharpe Ratio (Descending)
        if (retA >= 0 && retB >= 0) {
            return sharpeB - sharpeA;
        }
        
        // Rule 3: If BOTH are negative, rank strictly by Total Return (who lost the least is better = higher number)
        // e.g., -3% is better than -8%, so -3% should appear first
        return retB - retA; 
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
                    <option value="7d">1 Week</option>
                    <option value="15d">15 Days</option>
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
                            <th className="px-6 py-4 cursor-help" title="The robot's competitive rank based on its risk-adjusted performance (Sharpe Ratio).">Rank & Robot</th>
                            <th className="px-6 py-4 cursor-help" title="Cumulative percentage profit or loss generated over the selected timeframe.">Total Return ({selectedTimeframe})</th>
                            <th className="px-6 py-4 cursor-help" title="Percentage of all executed trades that resulted in a profit.">Win Rate</th>
                            <th className="px-6 py-4 cursor-help text-rose-500/80" title="Maximum Drawdown: The largest historical peak-to-trough drop in the robot's portfolio value. Measures worst-case risk.">Max DD</th>
                            <th className="px-6 py-4 text-right cursor-help text-indigo-400/80" title="Risk-Adjusted Return. Measures how much excess return you receive for the extra volatility endured. >1.0 is Good, >2.0 is Excellent.">Sharpe Ratio</th>
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
                            const isExpanded = expandedBotId === bot.id;
                            
                            return (
                                <Fragment key={`arena-frag-${bot.id}`}>
                                <tr 
                                    key={`arena-${bot.id}`} 
                                    onClick={() => setExpandedBotId(isExpanded ? null : bot.id)}
                                    className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${isLeader ? 'bg-indigo-900/10' : ''}`}
                                >
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
                                
                                {isExpanded && (
                                    <tr className="bg-slate-900/80 border-b border-slate-800">
                                        <td colSpan={5} className="px-6 py-6">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-1">
                                                    <h4 className="text-white font-bold mb-2 text-sm uppercase tracking-wider text-indigo-400">Strategy Formula</h4>
                                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-sm text-slate-300">
                                                        {bot.name.toLowerCase().includes('golden') ? (
                                                            <div className="space-y-3">
                                                                <p className="text-yellow-500 font-bold mb-1">🪙 The Golden Goose Protocol (n8n)</p>
                                                                <ul className="list-disc pl-5 space-y-2">
                                                                    <li><strong className="text-white">Timeframe:</strong> 1-Day Candles</li>
                                                                    <li><strong className="text-white">Trend Identifier:</strong> SMA Cross (Short &gt; Long)</li>
                                                                    <li><strong className="text-white">Momentum:</strong> RSI Bullish divergence detected</li>
                                                                    <li><strong className="text-white">Volatility:</strong> MACD Histogram Reversal from negative</li>
                                                                    <li><strong className="text-white">Execution:</strong> Webhook signal dispatched at closing price crossing VWAP</li>
                                                                </ul>
                                                            </div>
                                                        ) : (
                                                            <p>{bot.description || 'No specific formula description provided for this bot.'}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-full md:w-64 flex flex-col justify-center gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                                    <p className="text-xs text-slate-500 text-center mb-1">
                                                        Matrix Backtests usually trigger nightly. You can manually force a recalculation across all Timeframes & Assets.
                                                    </p>
                                                    <button 
                                                        onClick={() => handleRefresh(bot.id)}
                                                        disabled={isRefreshing}
                                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                                                    >
                                                        {isRefreshing ? "⏳ Queuing..." : "Force Refresh Matrix"}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
}
