"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/components/LocalizationProvider";
import { TagPill } from "@/components/TagPill";
import { BotMarketplace } from "./BotMarketplace";
import { RobotArenaTable } from "./RobotArenaTable";
import { TradingViewChart, OHLCData } from "./TradingViewChart";
import { actionGetMarketData, actionGetBrokers, actionUpdateBot, BrokerConnection } from "@/lib/actions";
import type { DashboardSummary, Bot, Signal, AlpacaOrder, AlpacaPosition, AlpacaAccount } from "@/lib/types";

// Simulation types
interface SimSignalDetail {
  signal_id: number;
  name: string;
  result: boolean | null;
  inverted: boolean;
}
interface SimBotResult {
  bot_id: number;
  bot_name: string;
  symbol: string;
  recommendation: string;
  confidence: number;
  signals_passed: number;
  signals_total: number;
  latest_close: number;
  timestamp: string;
  details: SimSignalDetail[];
}
interface SimResult {
  bots: SimBotResult[];
  evaluated_at: string;
}

// Mock Data for Equity Graph - Fallback
const mockEquityData = Array.from({ length: 20 }, (_, i) => ({
  time: new Date(Date.now() - (20 - i) * 3600000).toISOString(),
  equity: 10000 + Math.random() * 2000 + (i * 100),
  cash: 5000 + Math.random() * 500
}));

const TIMEFRAMES = [
  { label: '1M', range: '1d', interval: '1m' },
  { label: '5M', range: '5d', interval: '5m' },
  { label: '15M', range: '5d', interval: '15m' },
  { label: '1H', range: '1mo', interval: '1h' },
  { label: '1D', range: '1y', interval: '1d' },
  { label: '1W', range: '5y', interval: '1wk' },
  { label: '1Mo', range: 'max', interval: '1mo' },
];

const SYMBOLS = [
  "BTC-USD",
  "ETH-USD",
  "AAPL",
  "TSLA",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META"
];

export function LiveTradingDashboard({ initialSummary }: { initialSummary?: DashboardSummary }) {
  const { t } = useLocale();
  const [bots, setBots] = useState<Bot[]>(initialSummary?.bots || []);
  const [signals, setStrategies] = useState<Signal[]>(initialSummary?.signals || []);
  const [alpacaAccount, setAlpacaAccount] = useState<AlpacaAccount | null | undefined>(initialSummary?.alpaca_account);
  const [alpacaOrders, setAlpacaOrders] = useState<AlpacaOrder[]>(initialSummary?.alpaca_orders || []);
  const [alpacaPositions, setAlpacaPositions] = useState<AlpacaPosition[]>(initialSummary?.alpaca_positions || []);
  const [loading, setLoading] = useState(!initialSummary);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  
  // TradingView state
  const [selectedSymbol, setSelectedSymbol] = useState("BTC-USD");
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[4]); // Default 1D
  const [chartData, setChartData] = useState<OHLCData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Configuration Modal State
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
  const [configBot, setConfigBot] = useState<Bot | null>(null);
  const [configLiveTrading, setConfigLiveTrading] = useState(false);
  const [configBrokerId, setConfigBrokerId] = useState<number | "">("");
  const [savingConfig, setSavingConfig] = useState(false);

  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'marketplace' | 'arena'>('marketplace');

  useEffect(() => {
    actionGetBrokers().then(data => {
        if(data) setBrokerConnections(data);
    }).catch(console.error);
  }, []);

  const handleSaveConfig = async () => {
      if(!configBot) return;
      setSavingConfig(true);
      try {
          await actionUpdateBot(configBot.id, {
              live_trading: configLiveTrading,
              live_trading_connection_id: configBrokerId === "" ? null : configBrokerId
          });
          window.location.reload();
      } catch (err: any) {
          alert(err.message || "Failed to update configuration");
      } finally {
          setSavingConfig(false);
      }
  };

  // Fetch chart data
  useEffect(() => {
    async function loadChartData() {
      setChartLoading(true);
      try {
        const res = await actionGetMarketData(selectedSymbol, selectedTimeframe.range, selectedTimeframe.interval);
        if (res && res.points && res.points.length > 0) {
          const formatted = res.points.map((p: any) => {
             // Handle yfinance timestamp formats (iso string or dict with milliseconds)
             const ts = typeof p.timestamp === 'string' ? new Date(p.timestamp).getTime() / 1000 : 
                        p.timestamp?.['$date'] ? p.timestamp['$date'] / 1000 : 
                        new Date().getTime() / 1000;
                        
             return {
                time: ts as any,
                open: Number(p.open),
                high: Number(p.high),
                low: Number(p.low),
                close: Number(p.close)
             };
          });
          setChartData(formatted);
        } else {
          setChartData([]); // Clear on no data
        }
      } catch (err) {
        console.error("Failed to load chart data", err);
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    }
    loadChartData();
  }, [selectedSymbol, selectedTimeframe]);

  const runSimulation = useCallback(async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/bots/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data: SimResult = await res.json();
        setSimResult(data);
      }
    } catch (e) {
      console.error("Simulation failed", e);
    } finally {
      setSimulating(false);
    }
  }, []);

  useEffect(() => {
    if (initialSummary) return; // Skip if we have initial data

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
  }, [initialSummary]);

  const getLatestSignal = (botId: number) => {
    return signals
      .filter(s => s.bot_id === botId && (s.type === 'buy' || s.type === 'sell'))
      .sort((a, b) => new Date(b.emitted_at).getTime() - new Date(a.emitted_at).getTime())[0];
  };

  const activeRobots = bots.filter(b => b.status === 'running');

  // Use real Alpaca metrics if available
  const totalEquity = alpacaAccount ? `$${parseFloat(alpacaAccount.equity).toLocaleString()}` : "$14,250";
  const invested = alpacaAccount ? `$${(parseFloat(alpacaAccount.equity) - parseFloat(alpacaAccount.cash)).toLocaleString()}` : "$9,250";
  const availableCash = alpacaAccount ? `$${parseFloat(alpacaAccount.cash).toLocaleString()}` : "$5,000";
  const pnlValue = alpacaAccount ? (parseFloat(alpacaAccount.equity) - 10000).toLocaleString() : "1,250"; // Assuming 10k start

  return (
    <div className="space-y-8">
      
      {/* Alpaca Account Banner if connected */}
      {alpacaAccount && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
               🦙
             </div>
             <div>
               <h4 className="text-sm font-bold text-white">Alpaca Account Connected</h4>
               <p className="text-xs text-slate-400 font-mono">Real-time balances and orders synced.</p>
             </div>
           </div>
           <TagPill label="LIVE" tone="success" />
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <div className="p-4 md:p-6 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
              <div className="relative z-10">
                  <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">{t("totalEquity", "Total Balance")}</div>
                  <div className="text-xl md:text-3xl font-mono font-bold text-white">{totalEquity}</div>
              </div>
              <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
          </div>

          <div className="p-4 md:p-6 bg-slate-900 border border-slate-800 rounded-xl group hover:border-emerald-500/50 transition-colors">
              <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">{t("equity", "Invested")}</div>
              <div className="text-xl md:text-3xl font-mono font-bold text-emerald-400">{invested}</div>
              <div className="text-[10px] md:text-xs text-emerald-500/50 mt-1 font-mono">Active Exposure</div>
          </div>

          <div className="p-4 md:p-6 bg-slate-900 border border-slate-800 rounded-xl group hover:border-blue-500/50 transition-colors">
              <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">{t("cash", "Available")}</div>
              <div className="text-xl md:text-3xl font-mono font-bold text-blue-400">{availableCash}</div>
              <div className="text-[10px] md:text-xs text-blue-500/50 mt-1 font-mono">{t("readyToDeploy", "Ready to deploy")}</div>
          </div>

          <div className="p-4 md:p-6 bg-slate-900 border border-slate-800 rounded-xl group hover:border-violet-500/50 transition-colors">
              <div className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">{t("pnl", "P&L")}</div>
              <div className="text-xl md:text-3xl font-mono font-bold text-emerald-400">{pnlValue.startsWith('-') ? pnlValue : '+' + pnlValue}</div>
              <div className="text-[10px] md:text-xs text-emerald-500/50 mt-1 font-mono">Performance Estimate</div>
          </div>
      </div>

      {/* Main TradingView Chart Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col mb-8">
           <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                   Market Asset
                 </h3>
                 <div className="flex gap-2 bg-slate-900 p-0.5 rounded border border-slate-800">
                    {SYMBOLS.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSymbol(s)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          selectedSymbol === s
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <select
                       className="bg-transparent text-xs text-slate-400 font-medium px-2 outline-none hover:text-white cursor-pointer"
                       value={SYMBOLS.includes(selectedSymbol) && SYMBOLS.indexOf(selectedSymbol) < 5 ? "" : selectedSymbol}
                       onChange={(e) => setSelectedSymbol(e.target.value)}
                    >
                       <option value="" disabled>More...</option>
                       {SYMBOLS.slice(5).map(s => (
                          <option key={s} value={s} className="bg-slate-900 text-slate-200">{s}</option>
                       ))}
                    </select>
                 </div>
               </div>
               <div className="flex gap-2">
                   <button className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 bg-indigo-500/10 rounded">Candles</button>
                   <button className="text-[10px] text-slate-400 hover:text-slate-300 transition-colors px-2 py-1 hover:bg-slate-800 rounded mr-4">Projections</button>
                   
                   {/* Timeframes */}
                   <div className="flex bg-slate-900 rounded border border-slate-800 p-0.5">
                     {TIMEFRAMES.map((tf) => (
                       <button
                         key={tf.label}
                         onClick={() => setSelectedTimeframe(tf)}
                         className={`text-[10px] px-2 py-1 rounded transition-colors ${
                           selectedTimeframe.label === tf.label
                             ? 'bg-slate-800 text-white font-bold shadow-sm'
                             : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                         }`}
                       >
                         {tf.label}
                       </button>
                     ))}
                   </div>
               </div>
           </div>
           <div className="p-4 relative">
               {chartLoading ? (
                  <div className="h-[400px] flex flex-col gap-4 items-center justify-center bg-slate-950/50 rounded-xl border border-slate-800 animate-pulse">
                      <span className="text-slate-500 font-mono text-sm">Loading market data...</span>
                      <span className="text-indigo-500 font-bold text-xs">{selectedTimeframe.label} timeframe</span>
                  </div>
               ) : chartData.length > 0 ? (
                  <TradingViewChart data={chartData} height={400} />
               ) : (
                  <div className="h-[400px] flex items-center justify-center bg-slate-950/50 rounded-xl border border-slate-800">
                      <span className="text-slate-500 font-mono text-sm">No data available for this timeframe.</span>
                  </div>
               )}
               {/* Overlay bot signals as a projection test in future */}
           </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Real Positions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Real Positions (Alpaca)
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">{alpacaPositions.length} Assets</span>
              </div>
              <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto">
                  {alpacaPositions.length > 0 ? (
                      <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/50 text-slate-500 sticky top-0">
                              <tr>
                                  <th className="px-4 py-2 font-medium">Asset</th>
                                  <th className="px-4 py-2 font-medium">Qty</th>
                                  <th className="px-4 py-2 font-medium">Price</th>
                                  <th className="px-4 py-2 text-right">P&L</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                              {alpacaPositions.map(pos => (
                                  <tr key={pos.symbol} className="hover:bg-slate-800/30 transition-colors">
                                      <td className="px-4 py-3">
                                          <div className="font-bold text-white">{pos.symbol}</div>
                                          <div className="text-[10px] text-slate-500">Avg: ${parseFloat(pos.avg_entry_price).toFixed(2)}</div>
                                      </td>
                                      <td className="px-4 py-3 font-mono text-slate-300">{parseFloat(pos.qty).toFixed(2)}</td>
                                      <td className="px-4 py-3 font-mono text-slate-300">${parseFloat(pos.current_price).toFixed(2)}</td>
                                      <td className={`px-4 py-3 text-right font-mono font-bold ${parseFloat(pos.unrealized_pl) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {parseFloat(pos.unrealized_pl) >= 0 ? '+' : ''}{parseFloat(pos.unrealized_pl).toFixed(2)}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 italic text-sm p-8 text-center">
                          No real positions found in Alpaca.
                      </div>
                  )}
              </div>
          </div>

          {/* Real Order Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Recent Real Orders
                  </h3>
                  <button className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">Refresh</button>
              </div>
              <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto">
                  {alpacaOrders.length > 0 ? (
                      <div className="divide-y divide-slate-800/50">
                          {alpacaOrders.map(order => (
                              <div key={order.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-[10px] ${
                                          order.side === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                      }`}>
                                          {order.side.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                          <div className="font-bold text-white flex items-center gap-2">
                                              {order.symbol}
                                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-tighter">
                                                  {order.type}
                                              </span>
                                          </div>
                                          <div className="text-[10px] text-slate-500">
                                              {new Date(order.created_at).toLocaleString()}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded inline-block ${
                                          order.status === 'filled' ? 'bg-emerald-500 text-emerald-950' : 
                                          order.status === 'canceled' ? 'bg-slate-700 text-slate-300' : 
                                          'bg-blue-600 text-white'
                                      }`}>
                                          {order.status}
                                      </div>
                                      <div className="text-xs font-mono text-slate-300 mt-1">
                                          {order.filled_qty}/{order.qty} @ {order.filled_avg_price ? '$' + parseFloat(order.filled_avg_price).toFixed(2) : '-'}
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 italic text-sm p-8 text-center">
                          No recent orders found.
                      </div>
                  )}
              </div>
          </div>
      </div>

        {/* Robots/Marketplace Section */}
        <div>
            {/* Tab Controls (Visible to everyone) */}
            <div className="flex items-center justify-between mb-6 mt-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>🤖</span> {initialSummary?.subscription_tier === "admin" ? t("activeRobots", "Active Robots") : "Bot Marketplace"}
                </h3>
            
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                <button 
                    onClick={() => setActiveTab('marketplace')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'marketplace' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    🛒 Bot Marketplace
                </button>
                <button 
                    onClick={() => setActiveTab('arena')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'arena' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    ⚔️ Robot Arena
                </button>
            </div>
        </div>

        {/* Tab Content Router */}
        <div className="mb-12">
            {activeTab === 'marketplace' ? (
                <BotMarketplace 
                    bots={initialSummary?.bots || []} 
                    user={{ id: 0, role: 'user', email: '', name: '', mfa_enabled: false, subscription_tier: 'free' } as any} 
                    userBots={activeRobots} 
                />
            ) : (
                <RobotArenaTable 
                    bots={(initialSummary?.bots || []).filter(b => b.status === "running")} 
                />
            )}
        </div>

        {/* My Subscribed Bots (or Admin Active Bots) */}
        {activeRobots.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🤖</span> My Subscribed Bots
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{activeRobots.length}</span>
              </h3>
              <button
                onClick={runSimulation}
                disabled={simulating}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold shadow-lg shadow-orange-900/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {simulating ? (
                  <><span className="animate-spin">⏳</span> {t("simulating", "Simulating...")}</>
                ) : (
                  <><span>⚡</span> {t("simulate", "Simulate")}</>
                )}
              </button>
            </div>
        )}


        
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-900 rounded-xl"></div>)}
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeRobots.map(bot => {
                    const latestSignal = getLatestSignal(bot.id);
                    const sim = simResult?.bots.find(b => b.bot_id === bot.id);
                    
                    const isBuy = sim ? (sim.recommendation === 'BUY') : (latestSignal?.type === 'buy');
                    const isSell = sim ? (sim.recommendation === 'SELL') : (latestSignal?.type === 'sell');
                    
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
                                    <span className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">{t("recommendation", "Recommendation")}</span>
                                    {(() => {
                                        if (sim) {
                                            const recColor = sim.recommendation === 'BUY' ? 'text-emerald-400' : sim.recommendation === 'SELL' ? 'text-rose-400' : 'text-amber-400';
                                            return (
                                                <div className={`flex flex-col items-center gap-1 ${recColor}`}>
                                                    <span className="text-4xl font-black tracking-tighter">{sim.recommendation}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-mono text-slate-400">{sim.symbol} ${sim.latest_close.toFixed(2)}</span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sim.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-400' : sim.confidence >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                            {sim.confidence}% ({sim.signals_passed}/{sim.signals_total})
                                                        </span>
                                                    </div>
                                                    {sim.details.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2 justify-center">
                                                            {sim.details.map((d, i) => (
                                                                <span key={`bot-${bot.id}-sig-${d.signal_id}-${i}`} className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${d.result === true ? 'bg-emerald-500/10 text-emerald-400' : d.result === false ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                                                                    {d.result === true ? '✓' : d.result === false ? '✗' : '?'} {d.name.substring(0, 15)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } else if (latestSignal) {
                                            return (
                                                <div className={`flex flex-col items-center gap-1 ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    <span className="text-4xl font-black tracking-tighter shadow-glow">{latestSignal.type.toUpperCase()}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {new Date(latestSignal.emitted_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            );
                                        } else {
                                            return <div className="text-slate-600 font-mono text-sm">{t("waitingForSignal", "WAITING_FOR_SIGNAL...")}</div>;
                                        }
                                    })()}
                                </div>

                                {/* Last Signal Details */}
                                {latestSignal && (
                                    <div className="text-xs text-slate-400 font-mono p-2 bg-black/20 rounded border border-white/5 truncate">
                                        {(latestSignal.payload as any)?.name || t("signalEvent", "Signal Event")} • {((latestSignal.payload as any)?.code as string)?.substring(0, 20)}...
                                    </div>
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="p-3 bg-slate-950 border-t border-slate-800 grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => {
                                        setConfigBot(bot);
                                        setConfigLiveTrading(bot.live_trading || false);
                                        setConfigBrokerId(bot.live_trading_connection_id || "");
                                    }}
                                    className="py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-bold transition-colors border border-indigo-500/20 flex justify-center items-center gap-1"
                                >
                                    ⚙️ Configure
                                </button>
                                {isBuy ? (
                                    <button className="py-2 rounded-lg text-white text-xs font-bold transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20">
                                       🛒 {t("buyBtn", "Buy")}
                                    </button>
                                ) : isSell ? (
                                    <button className="py-2 rounded-lg text-white text-xs font-bold transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-500 shadow-rose-900/20">
                                       💰 {t("sellBtn", "Sell")}
                                    </button>
                                ) : (
                                    <button disabled className="py-2 rounded-lg text-amber-500 text-xs font-bold bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-1 cursor-not-allowed">
                                       ✋ HOLD
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Transaction Log */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">{t("recentActivity", "Simulation Log")}</h3>
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
             {signals.length > 0 ? (
                 <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm text-slate-400">
                         <thead className="bg-slate-950 text-xs uppercase font-medium text-slate-500">
                             <tr>
                                 <th className="px-6 py-3">{t("tableTime", "Time")}</th>
                                 <th className="px-6 py-3">{t("tableRobot", "Robot")}</th>
                                 <th className="px-6 py-3">{t("tableSignal", "Signal")}</th>
                                 <th className="px-6 py-3">{t("tableAction", "Action")}</th>
                                 <th className="px-6 py-3 text-right">{t("tablePrice", "Price")}</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800">
                             {signals.filter(s => s.type === 'buy' || s.type === 'sell').slice(0, 10).map((sig) => {
                                 const bot = bots.find(b => b.id === sig.bot_id);
                                 const isBuy = sig.type === 'buy';
                                 return (
                                     <tr key={sig.id} className="hover:bg-slate-800/50 transition-colors">
                                         <td className="px-6 py-4 font-mono text-xs">{new Date(sig.emitted_at).toLocaleTimeString()}</td>
                                         <td className="px-6 py-4 font-medium text-white">{bot?.name || t("unknownBot", "Unknown Bot")}</td>
                                         <td className="px-6 py-4 text-xs font-mono">{(sig.payload as any)?.name || t("unknownSignal", "Signal")}</td>
                                         <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                 isBuy ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                             }`}>
                                                 {sig.type}
                                             </span>
                                         </td>
                                         <td className="px-6 py-4 text-right font-mono text-white">
                                             ${((sig.payload as any)?.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

      {/* Configuration Modal */}
      {configBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        ⚙️ Configure Bot
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">{configBot.name}</p>
                </div>
                <button 
                    onClick={() => setConfigBot(null)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
                
                {/* Live Trading Toggle */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center cursor-pointer" onClick={() => setConfigLiveTrading(!configLiveTrading)}>
                    <div>
                        <h4 className="font-bold text-white text-sm">Live Trading</h4>
                        <p className="text-xs text-slate-500 mt-1">Allow this bot to execute trades automatically.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${configLiveTrading ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all ${configLiveTrading ? 'left-7' : 'left-1'}`}></div>
                    </div>
                </div>

                {/* Broker Connection Dropdown */}
                {configLiveTrading && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Broker Connection
                        </label>
                        <select
                            value={configBrokerId}
                            onChange={(e) => setConfigBrokerId(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">-- Select an API Connection --</option>
                            {brokerConnections.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.broker_name.charAt(0).toUpperCase() + b.broker_name.slice(1)} ({b.is_paper ? 'Paper' : 'Live'}) - Connection #{b.id}
                                </option>
                            ))}
                        </select>
                        {brokerConnections.length === 0 && (
                            <p className="text-xs text-amber-500 mt-2">
                                No broker connections found. Add one in your Profile.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                <button
                    onClick={() => setConfigBot(null)}
                    disabled={savingConfig}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSaveConfig}
                    disabled={savingConfig || (configLiveTrading && configBrokerId === "")}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {savingConfig ? (
                        <span className="animate-spin text-lg">↻</span>
                    ) : (
                        "💾 Save Configuration"
                    )}
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
