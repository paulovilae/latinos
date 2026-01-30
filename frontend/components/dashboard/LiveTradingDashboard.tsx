"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocalizationProvider";
import { TagPill } from "@/components/TagPill";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';

interface Bot {
  id: number;
  name: string;
  description: string;
  status: string;
  owner_id: number;
}

interface Signal {
  id: number;
  bot_id: number;
  type: string;
  payload: any;
  emitted_at: string;
  mode: string;
}

// Mock Data for Equity Graph
const mockEquityData = Array.from({ length: 20 }, (_, i) => ({
  time: new Date(Date.now() - (20 - i) * 3600000).toISOString(),
  equity: 10000 + Math.random() * 2000 + (i * 100),
  cash: 5000 + Math.random() * 500
}));

export function LiveTradingDashboard() {
  const { t } = useLocale();
  const [bots, setBots] = useState<Bot[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [botsRes, signalsRes] = await Promise.all([
          fetch("/api/bots"),
          fetch("/api/signals")
        ]);
        const botsData = await botsRes.json();
        const signalsData = await signalsRes.json();
        setBots(botsData);
        setSignals(signalsData);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getLatestSignal = (botId: number) => {
    return signals
      .filter(s => s.bot_id === botId && (s.type === 'buy' || s.type === 'sell'))
      .sort((a, b) => new Date(b.emitted_at).getTime() - new Date(a.emitted_at).getTime())[0];
  };

  const activeRobots = bots.filter(b => b.status === 'running');

  return (
    <div className="space-y-8">
      
      {/* Portfolio Overview Graph */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {t("totalEquity", "Total Equity & Cash")}
                </h2>
                <div className="text-3xl font-bold text-white font-mono">$14,250.00</div>
            </div>
            <div className="flex gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-400">{t("equity", "Equity")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-slate-400">{t("cash", "Cash")}</span>
                </div>
            </div>
        </div>
        
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockEquityData}>
                    <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                        itemStyle={{ fontSize: 12 }}
                        labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="equity" stroke="#10b981" fillOpacity={1} fill="url(#colorEquity)" strokeWidth={2} />
                    <Line type="monotone" dataKey="cash" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Robots Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🤖</span> {t("activeRobots", "Active Robots")} 
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{activeRobots.length}</span>
        </h3>
        
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-900 rounded-xl"></div>)}
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeRobots.map(bot => {
                    const latestSignal = getLatestSignal(bot.id);
                    const isBuy = latestSignal?.type === 'buy';
                    
                    return (
                        <div key={bot.id} className="group relative bg-slate-900 rounded-xl border border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all overflow-hidden flex flex-col">
                            {/* Status Indicator */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50"></div>
                            
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{bot.name}</h4>
                                        <p className="text-xs text-slate-400 line-clamp-1">{bot.description}</p>
                                    </div>
                                    <div className="bg-emerald-900/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold tracking-wider animate-pulse">
                                        Running
                                    </div>
                                </div>

                                {/* Main Recommendation */}
                                <div className="flex-1 flex flex-col items-center justify-center py-6 border-y border-slate-800/50 bg-slate-950/30 rounded-lg mb-4">
                                    <span className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">Recommendation</span>
                                    {latestSignal ? (
                                        <div className={`flex flex-col items-center gap-1 ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            <span className="text-4xl font-black tracking-tighter shadow-glow">{latestSignal.type.toUpperCase()}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                {new Date(latestSignal.emitted_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-slate-600 font-mono text-sm">WAITING_FOR_SIGNAL...</div>
                                    )}
                                </div>

                                {/* Last Signal Details */}
                                {latestSignal && (
                                    <div className="text-xs text-slate-400 font-mono p-2 bg-black/20 rounded border border-white/5 truncate">
                                        {latestSignal.payload?.name || "Signal Event"} • {latestSignal.payload?.code?.substring(0, 20)}...
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="p-3 bg-slate-950 border-t border-slate-800 grid grid-cols-2 gap-2">
                                <button className="py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-bold transition-colors border border-indigo-500/20">
                                    {t("viewDetails", "View Details")}
                                </button>
                                <button className={`py-2 rounded-lg text-white text-xs font-bold transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-1 ${
                                    isBuy ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
                                }`}>
                                   {isBuy ? "🛒 " + t("buyBtn", "Buy") : "💰 " + t("sellBtn", "Sell")}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Transaction Log */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">{t("recentActivity", "Transaction Log")}</h3>
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
             {signals.length > 0 ? (
                 <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm text-slate-400">
                         <thead className="bg-slate-950 text-xs uppercase font-medium text-slate-500">
                             <tr>
                                 <th className="px-6 py-3">Time</th>
                                 <th className="px-6 py-3">Robot</th>
                                 <th className="px-6 py-3">Signal</th>
                                 <th className="px-6 py-3">Action</th>
                                 <th className="px-6 py-3 text-right">Price</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800">
                             {signals.filter(s => s.type === 'buy' || s.type === 'sell').slice(0, 10).map((sig) => {
                                 const bot = bots.find(b => b.id === sig.bot_id);
                                 const isBuy = sig.type === 'buy';
                                 return (
                                     <tr key={sig.id} className="hover:bg-slate-800/50 transition-colors">
                                         <td className="px-6 py-4 font-mono text-xs">{new Date(sig.emitted_at).toLocaleTimeString()}</td>
                                         <td className="px-6 py-4 font-medium text-white">{bot?.name || "Unknown Bot"}</td>
                                         <td className="px-6 py-4 text-xs font-mono">{sig.payload?.name || "Signal"}</td>
                                         <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                 isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                             }`}>
                                                 {sig.type}
                                             </span>
                                         </td>
                                         <td className="px-6 py-4 text-right font-mono text-white">
                                             ${(sig.payload?.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                         </td>
                                     </tr>
                                 );
                             })}
                         </tbody>
                     </table>
                 </div>
             ) : (
                <div className="p-8 text-center text-slate-500 text-sm italic">
                    {t("noRecentTrades", "No recent trades recorded.")}
                </div>
             )}
        </div>
      </div>



    </div>
  );
}
