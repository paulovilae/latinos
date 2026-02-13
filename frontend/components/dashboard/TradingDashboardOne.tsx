"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocalizationProvider";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

interface Bot {
  id: number;
  name: string;
  description: string;
  status: string;
}

interface Signal {
  id: number;
  bot_id: number;
  type: string;
  payload: any;
  emitted_at: string;
}

// Mock Data for Equity Graph - in a real app this would come from an API
const mockEquityData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  value: 10000 + Math.random() * 2500 + (i * 100),
}));

export function TradingDashboardOne() {
  const { t } = useLocale();
  const [bots, setBots] = useState<Bot[]>([]);
  const [signals, setStrategies] = useState<Signal[]>([]);
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
        setStrategies(signalsData);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeRobots = bots.filter(b => b.status === 'running');
  const recentStrategies = signals.slice(0, 3); // Top 3 signals

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark transition-colors duration-200 font-display">
      {/* TopAppBar - Mobile Only */}
      <div className="md:hidden flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex size-12 shrink-0 items-center">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary" data-alt="User profile avatar" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAD9etcAYaZNJVCqyDsIDo6qvSEMpZI-pVt9JowcxqdzR5mqFVOFo0YY_zNxEsFiZsXAVGJ3Nh5Yc97iMSdAxx7Uy_gxuBOo7HA92Y_UwsYm53g93UxTpMjvvuCLZi_2C9E257wyAzP0L64zbL9Txl5Gsc6yyVIpFGkas0MGt3CdiXwV8BNkFF0ncC1DZP1ldh9RF3IIg1Qj12YZKkyRSbwnRGa5vM_DCoiR6ungacm9WglMOX2HZ87WMiWX446sVzvgqk0GrOiZNY")'}}></div>
        </div>
        <div className="flex flex-col items-center flex-1">
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">{t("dashboardTitle", "Trading Dashboard")}</h2>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-market-up animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">{t("connectionStatus", "Live Connection")}</span>
          </div>
        </div>
        <div className="flex w-12 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-12 md:gap-6 md:p-6">
        {/* Main Content Column (Chart + Stats) */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-6">
          {/* Portfolio Summary & Chart */}
          <div className="px-4 py-6 md:rounded-2xl md:border md:border-slate-200 md:dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-background-dark">
            <div className="flex flex-col gap-1 mb-4">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t("totalValue", "Total Portfolio Value")}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-slate-900 dark:text-white tracking-tight text-4xl font-bold leading-tight">$12,450.00</p>
                <p className="text-market-up text-sm font-bold bg-market-up/10 px-2 py-0.5 rounded-full">+4.2%</p>
              </div>
            </div>
            
            {/* Recharts Sparkline */}
            <div className="flex min-h-[140px] md:min-h-[300px] flex-col gap-4">
               <div className="h-[120px] md:h-[280px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={mockEquityData}>
                     <defs>
                       <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#137fec" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <Tooltip content={<></>} cursor={{ stroke: '#137fec', strokeWidth: 1 }} />
                     <Area type="monotone" dataKey="value" stroke="#137fec" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
               
               <div className="flex justify-between px-2">
                 <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold">12am</p>
                 <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold">6am</p>
                 <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold">12pm</p>
                 <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold">6pm</p>
                 <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold">Now</p>
               </div>
            </div>
          </div>

          {/* Section: Active Bots */}
          <div className="py-2">
            <div className="flex items-center justify-between px-4 pb-3 pt-5 md:px-0">
               <h2 className="text-slate-900 dark:text-white text-[20px] font-bold leading-tight tracking-[-0.015em]">{t("activeRobots", "Active Bots")}</h2>
               <button className="text-primary text-sm font-bold">{t("viewAll", "View All")}</button>
            </div>
            
            <div className="flex overflow-x-auto pb-4 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:overflow-visible">
              <div className="flex items-stretch px-4 gap-4 md:contents">
                {loading ? (
                    <div className="flex gap-4 md:contents">
                      {[1,2,3].map(i => <div key={i} className="h-40 w-40 md:w-full bg-slate-800 rounded-xl animate-pulse"></div>)}
                    </div>
                ) : activeRobots.length > 0 ? (
                    activeRobots.map(bot => (
                      <div key={bot.id} className="flex h-full flex-col gap-3 rounded-xl min-w-[160px] md:min-w-0 bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                        <div className="w-full bg-slate-100 dark:bg-slate-700 aspect-square rounded-lg flex items-center justify-center overflow-hidden">
                          <span className="material-symbols-outlined text-primary text-4xl">smart_toy</span>
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white text-sm font-bold leading-tight truncate">{bot.name}</p>
                          <div className="flex items-center justify-between mt-1">
                             <p className="text-market-up text-xs font-bold">+0.0%</p>
                             <span className="bg-market-up/20 text-market-up text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Run</span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                    <div className="text-slate-500 text-sm px-4 italic col-span-full">No active bots found.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column (Live Activity) */}
        <div className="md:col-span-4 lg:col-span-3">
          {/* Section: Live Activity */}
          <div className="px-4 py-4 mb-20 md:mb-0 md:p-0">
             <h2 className="text-slate-900 dark:text-white text-[20px] font-bold leading-tight tracking-[-0.015em] mb-4">{t("liveActivity", "Live Activity")}</h2>
             <div className="space-y-3">
                {loading ? (
                   <div className="h-16 bg-slate-800 rounded-xl animate-pulse"></div>
                ) : recentStrategies.length > 0 ? (
                   recentStrategies.map(signal => {
                     const isBuy = signal.type === 'buy';
                     const bot = bots.find(b => b.id === signal.bot_id);
                     return (
                       <div key={signal.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${isBuy ? 'bg-market-up/10' : 'bg-market-down/10'}`}>
                                <span className={`material-symbols-outlined ${isBuy ? 'text-market-up' : 'text-market-down'}`}>
                                    {isBuy ? 'trending_up' : 'trending_down'}
                                </span>
                             </div>
                             <div>
                                <p className="text-sm font-bold capitalize">{signal.type} {signal.payload?.symbol || 'Asset'}</p>
                                <p className="text-xs text-slate-500">Robot: {bot?.name || 'Unkown'} • {new Date(signal.emitted_at).toLocaleTimeString()}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={`text-sm font-bold ${isBuy ? 'text-market-up' : 'text-market-down'}`}>
                               {isBuy ? '+' : '-'}${Math.abs(signal.payload?.pnl || 0).toFixed(2)}
                             </p>
                             <p className="text-xs text-slate-400">@ ${signal.payload?.price || '0.00'}</p>
                          </div>
                       </div>
                     );
                   })
                ) : (
                   <div className="text-center text-slate-500 py-4 italic">No recent activity</div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Tab Bar - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50">
         <button className="flex flex-col items-center gap-1 text-primary">
            <span className="material-symbols-outlined font-bold">dashboard</span>
            <span className="text-[10px] font-bold">Home</span>
         </button>
         <button className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined">bar_chart</span>
            <span className="text-[10px] font-bold">Market</span>
         </button>
         <div className="relative -top-6">
            <button className="flex items-center justify-center bg-primary text-white size-14 rounded-full shadow-lg shadow-primary/40 border-4 border-background-light dark:border-background-dark">
              <span className="material-symbols-outlined text-2xl">add</span>
            </button>
         </div>
         <button className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined">smart_toy</span>
            <span className="text-[10px] font-bold">Bots</span>
         </button>
         <button className="flex flex-col items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-[10px] font-bold">Setup</span>
         </button>
      </div>
    </div>
  );
}
