"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useLocale } from "@/components/LocalizationProvider";
// Using Next.js API routes (no direct backend calls)

interface Signal {
  id: number;
  type: string;
  payload: { name?: string; code?: string };
}

interface SavedRobot {
  id: number;
  name: string;
  signal_ids: number[];
  status: "running" | "paused" | "draft" | "stopped";
}

export function StackBuilder() {
  const { t } = useLocale();
  const [availableSignals, setAvailableSignals] = useState<Signal[]>([]);
  const [stack, setStack] = useState<Signal[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  
  // Robot save state
  const [robotName, setRobotName] = useState("");
  const [savedRobots, setSavedRobots] = useState<SavedRobot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Selection for backtest
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedPeriod, setSelectedPeriod] = useState("1y");
  const [initialCapital, setInitialCapital] = useState(10000);
  const [takeProfit, setTakeProfit] = useState(5.0);
  const [stopLoss, setStopLoss] = useState(3.0);

  useEffect(() => {
    // Load signals to choose from
    fetch("/api/signals")
      .then(res => res.json())
      .then((data: Signal[]) => {
        // Deduplicate by name on client side to be safe
        const unique = Object.values(
          data.reduce((acc, sig) => {
            const name = sig.payload?.name || `Sig ${sig.id}`;
            if (!acc[name]) acc[name] = sig;
            return acc;
          }, {} as Record<string, Signal>)
        );
        setAvailableSignals(unique);
      })
      .catch(console.error);
    // Load saved robots
    loadRobots();
  }, []);

  const loadRobots = async () => {
    try {
      const res = await fetch("/api/bots");
      const bots = await res.json();
      setSavedRobots(bots.map((b: any) => ({
        id: b.id,
        name: b.name,
        signal_ids: b.signals?.map((s: any) => s.id) || [],
        status: b.status || "draft"
      })));
    } catch (e) {
      console.error("Failed to load robots", e);
    }
  };

  const toggleBotStatus = async (robot: SavedRobot, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = robot.status === "running" ? "pause" : "deploy";
    try {
      await fetch(`/api/bots/${robot.id}/${newStatus}`, { method: "POST" });
      loadRobots();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const deleteBot = async (robot: SavedRobot, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t("confirmDelete", `Are you sure you want to delete robot "${robot.name}"?`))) return;
    try {
      await fetch(`/api/bots/${robot.id}`, { method: "DELETE" });
      loadRobots();
    } catch (err) {
      alert("Failed to delete robot");
    }
  };

  const addToStack = (signal: Signal) => {
    setStack(prev => [...prev, signal]);
  };

  const removeFromStack = (index: number) => {
    setStack(prev => prev.filter((_, i) => i !== index));
  };

  const runBacktest = async () => {
    if (stack.length === 0) {
      alert(t("emptyStack", "Please add at least one signal to the stack."));
      return;
    }
    setIsRunning(true);
    setBacktestResult(null);
    try {
      const res = await fetch("/api/signals/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          range: selectedPeriod,
          market: selectedSymbol,
          stack: stack.map(s => s.id), // Pass IDs
          initial_capital: Number(initialCapital),
          take_profit: Number(takeProfit),
          stop_loss: Number(stopLoss)
        })
      });
      const result = await res.json();
      setBacktestResult(result);
    } catch (e) {
      console.error(e);
      alert(t("error", "Backtest failed"));
    } finally {
      setIsRunning(false);
    }
  };

  const saveRobot = async () => {
    if (!robotName.trim() || stack.length === 0) {
      alert(t("error", "Please enter a robot name and add at least one signal."));
      return;
    }
    setIsSaving(true);
    try {
      await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: robotName,
          signal_ids: stack.map(s => s.id)
        })
      });
      alert(`${t("success", "Success")}: Robot "${robotName}" saved!`);
      setRobotName("");
      loadRobots();
    } catch (e) {
      console.error(e);
      alert(t("error", "Failed to save robot"));
    } finally {
      setIsSaving(false);
    }
  };

  const loadRobot = (robot: SavedRobot) => {
    // Load signals into current stack
    const signalsToLoad = robot.signal_ids
      .map(id => availableSignals.find(s => s.id === id))
      .filter(Boolean) as Signal[];
    setStack(signalsToLoad);
    setRobotName(robot.name);
  };

  return (
    <div className="space-y-8">
      
  // Signal Search
  const [signalSearch, setSignalSearch] = useState("");

  const filteredSignals = availableSignals.filter(s => 
    (s.payload?.name || "").toLowerCase().includes(signalSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      
      {/* Step 1: Add Signals */}
      <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/50">1</div>
                <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">{t("step1Guide", "Step 1: Add a Signal")}</h3>
            </div>
            <div className="text-xs text-slate-500">
                {availableSignals.length} available
            </div>
          </div>
          
          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
             {/* Search Input */}
             <input 
                type="text" 
                placeholder="Search signals..." 
                value={signalSearch}
                onChange={(e) => setSignalSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none mb-3"
             />

             {/* Scrollable Signal List */}
             <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredSignals.length === 0 ? (
                    <div className="text-slate-500 text-xs italic py-2 w-full text-center">
                        {availableSignals.length === 0 ? t("noSignalsYet", "No signals available.") : "No matching signals."}
                    </div>
                ) : (
                    filteredSignals.map(sig => (
                        <button
                            key={sig.id}
                            className="flex-shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs text-slate-300 rounded-lg border border-slate-700 transition-all active:scale-95 flex items-center gap-2 group"
                            onClick={() => addToStack(sig)}
                        >
                            <span>+</span>
                            <span className="font-medium">{sig.payload?.name || `Sig ${sig.id}`}</span>
                        </button>
                    ))
                )}
             </div>
             <div className="mt-2 text-[10px] text-slate-600 text-center border-t border-slate-800/50 pt-2">
                {t("availableSignals", "Tap to add to your strategy stack")}
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* The Stack Visualization */}
        <div className="relative border border-slate-700 rounded-xl bg-slate-950/50 p-6 min-h-[400px] flex flex-col">
            <div className="absolute top-4 right-4 text-xs text-slate-500 font-mono hidden sm:block">FLOW: SEQUENTIAL (AND)</div>
            
            <div className="flex flex-col items-center space-y-2 flex-1">
                
                {/* Market Input Node */}
                 <div className="w-48 py-2 text-center bg-slate-800 rounded border border-slate-600 text-slate-400 text-xs font-mono mb-2">
                    MARKET DATA (1D)
                 </div>
                 <div className="h-6 w-0.5 bg-slate-600"></div>

                 {/* Stack Items */}
                 {stack.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center mb-4 text-slate-600 text-2xl">
                            +
                        </div>
                        <p className="text-slate-400 font-medium">{t("emptyStack", "Stack is empty.")}</p>
                        <p className="text-slate-600 text-sm mt-1">{t("step1Guide", "Add signals from Step 1 above.")}</p>
                    </div>
                 )}

                 {stack.map((sig, idx) => (
                    <div key={idx} className="flex flex-col items-center animate-in slide-in-from-top-2 duration-300">
                        <div className="relative group w-64 p-3 bg-slate-900 border border-indigo-500/50 rounded-lg shadow-lg shadow-indigo-500/10 flex items-center justify-between hover:border-indigo-400 transition-colors">
                             <div className="flex flex-col gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    disabled={idx === 0}
                                    onClick={() => {
                                        const newStack = [...stack];
                                        [newStack[idx], newStack[idx-1]] = [newStack[idx-1], newStack[idx]];
                                        setStack(newStack);
                                    }}
                                    className="text-slate-600 hover:text-white disabled:opacity-30"
                                >
                                    ▲
                                </button>
                                <button 
                                    disabled={idx === stack.length - 1}
                                    onClick={() => {
                                        const newStack = [...stack];
                                        [newStack[idx], newStack[idx+1]] = [newStack[idx+1], newStack[idx]];
                                        setStack(newStack);
                                    }}
                                    className="text-slate-600 hover:text-white disabled:opacity-30"
                                >
                                    ▼
                                </button>
                             </div>

                             <span className="font-semibold text-white flex-1 text-center truncate px-2">{sig.payload?.name || `Signal ${sig.id}`}</span>
                             
                             <button onClick={() => removeFromStack(idx)} className="text-slate-500 hover:text-red-400 ml-2 p-1">×</button>
                             
                             {/* Traffic Light Logic Visualization */}
                             <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 bg-slate-950 p-1.5 rounded-full border border-slate-800">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <div className="w-2 h-2 rounded-full bg-rose-900/50"></div>
                             </div>
                        </div>
                        
                        {/* Connector or End */}
                        {idx < stack.length - 1 ? (
                             <div className="h-6 w-0.5 bg-emerald-500/50"></div>
                        ) : (
                            <div className="h-8 w-0.5 bg-emerald-500"></div>
                        )}
                    </div>
                 ))}

                 {stack.length > 0 && (
                     <div className="w-48 py-3 text-center bg-emerald-900/20 border border-emerald-500 rounded-lg text-emerald-400 font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-in zoom-in duration-300">
                        {t("actionBuyShort", "ACTION: BUY / SHORT")}
                     </div>
                 )}

            </div>
        </div>

        {/* Step 2: Controls & Results */}
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/50">2</div>
                    <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">{t("step2Guide", "Step 2: Run Simulation")}</h3>
                </div>

                <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-xl">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <span>📊 {t("simulationTitle", "Simulation & Training")}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-black">History</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">{t("tickerPlaceholder", "Symbol")}</label>
                            <select 
                                value={selectedSymbol}
                                onChange={(e) => setSelectedSymbol(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                            >
                                <option value="AAPL">AAPL</option>
                                <option value="BTC-USD">BTC-USD</option>
                                <option value="NVDA">NVDA</option>
                                <option value="SPY">SPY</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">{t("tableStatus", "Period")}</label>
                            <select 
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                            >
                                <option value="1y">1 Year</option>
                                <option value="6mo">6 Months</option>
                                <option value="3mo">3 Months</option>
                                <option value="30d">30 Days</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1 uppercase">Capital ($)</label>
                            <input
                                type="number"
                                value={initialCapital}
                                onChange={(e) => setInitialCapital(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-emerald-400 font-mono focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1 uppercase">Take Profit %</label>
                            <input
                                type="number"
                                step="0.1"
                                value={takeProfit}
                                onChange={(e) => setTakeProfit(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-emerald-300 font-mono focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1 uppercase">Stop Loss %</label>
                            <input
                                type="number"
                                step="0.1"
                                value={stopLoss}
                                onChange={(e) => setStopLoss(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-rose-300 font-mono focus:border-rose-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={runBacktest}
                        disabled={isRunning || stack.length === 0}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isRunning ? t("runningSimulation", "🚀 Running...") : t("runSimulationBtn", "▶️ Run Simulation")}
                    </button>
                    
                    {stack.length === 0 && (
                        <p className="text-center text-xs text-rose-400 mt-2 animate-pulse">{t("emptyStack", "Add signals before running simulation.")}</p>
                    )}
                </div>
            </div>

            {backtestResult && (
                 <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                    <h4 className="font-semibold text-white mb-4 border-b border-slate-800 pb-2">{t("success", "Results")}</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                            <div className="relative z-10 text-center">
                                <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{t("totalPnL", "Total PnL")}</div>
                                <div className={`text-xl md:text-2xl font-mono font-bold ${(backtestResult.results?.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ${(backtestResult.results?.pnl || 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-emerald-500/10 to-transparent"></div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                            <div className="relative z-10 text-center">
                                <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{t("winRate", "Win Rate")}</div>
                                <div className="text-xl md:text-2xl font-mono font-bold text-white">
                                    {(backtestResult.results?.win_rate || 0).toFixed(1)}%
                                </div>
                            </div>
                            <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-violet-500/50 transition-colors">
                            <div className="relative z-10 text-center">
                                <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{t("totalReturn", "Total Return")}</div>
                                <div className={`text-xl md:text-2xl font-mono font-bold ${(backtestResult.results?.total_return_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {(backtestResult.results?.total_return_pct || 0).toFixed(2)}%
                                </div>
                            </div>
                             <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-violet-500/10 to-transparent"></div>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden group hover:border-rose-500/50 transition-colors">
                            <div className="relative z-10 text-center">
                                <div className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{t("maxDrawdown", "Max Drawdown")}</div>
                                <div className="text-xl md:text-2xl font-mono font-bold text-rose-400">
                                    -{(backtestResult.results?.max_drawdown || 0).toFixed(2)}%
                                </div>
                            </div>
                            <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-rose-500/10 to-transparent"></div>
                        </div>
                    </div>

                    {/* Equity Curve Chart */}
                    {backtestResult.results?.equity_curve?.length > 0 && (
                        <div className="h-64 mb-6 bg-slate-950 p-4 rounded-lg border border-slate-800">
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={backtestResult.results.equity_curve}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis 
                                        dataKey="timestamp" 
                                        tickFormatter={(t) => new Date(t).toLocaleDateString()} 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        tick={{fill: '#64748b'}}
                                    />
                                    <YAxis 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        domain={['auto', 'auto']}
                                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                                        tick={{fill: '#64748b'}}
                                    />
                                    <Tooltip 
                                        labelFormatter={(t) => new Date(t).toLocaleDateString()}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                        formatter={(val: any) => [`$${(val || 0).toFixed(2)}`, 'Equity']}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="equity" 
                                        stroke="#10b981" 
                                        strokeWidth={2} 
                                        dot={false} 
                                        activeDot={{ r: 4, fill: '#10b981' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                     {/* Trade History Table */}
                    {backtestResult.results?.history?.length > 0 && (
                        <div className="mt-4 border border-slate-800 rounded-lg overflow-hidden">
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-2 bg-slate-950">Date</th>
                                            <th className="px-3 py-2 bg-slate-950">Type</th>
                                            <th className="px-3 py-2 text-right bg-slate-950">Price</th>
                                            <th className="px-3 py-2 text-right bg-slate-950">PnL</th>
                                            <th className="px-3 py-2 text-right bg-slate-950">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                                        {backtestResult.results.history.map((trade: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                                <td className="px-3 py-2 text-slate-300 text-xs whitespace-nowrap">
                                                    {new Date(trade.time).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex flex-col">
                                                        <span className={`w-fit px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                                            trade.type === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                        }`}>
                                                            {trade.type}
                                                        </span>
                                                        {trade.reason && <span className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
                                                            {trade.reason}
                                                        </span>}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-300 font-mono text-xs">
                                                    ${trade.price.toFixed(2)}
                                                </td>
                                                <td className={`px-3 py-2 text-right font-mono font-bold text-xs ${
                                                    (trade.pnl || 0) > 0 ? 'text-emerald-400' : (trade.pnl || 0) < 0 ? 'text-rose-400' : 'text-slate-500'
                                                }`}>
                                                    {trade.pnl ? `$${trade.pnl.toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-400 font-mono text-xs">
                                                    {trade.balance ? `$${trade.balance.toFixed(0)}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Save Robot Section */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-white mb-4">{t("saveRobotTitle", "Save as Robot")}</h4>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder={t("robotNamePlaceholder", "Enter robot name...")}
                        value={robotName}
                        onChange={(e) => setRobotName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder:text-slate-500"
                    />
                    <button
                        onClick={saveRobot}
                        disabled={isSaving || stack.length === 0 || !robotName.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSaving ? t("saving", "Saving...") : t("saveBtn", "💾 Save")}
                    </button>
                </div>
            </div>

            {/* Saved Robots */}
            {savedRobots.length > 0 && (
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <h4 className="font-semibold text-white mb-4">{t("myRobotsTitle", "My Robots")}</h4>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {/* 1. New Signal Stacks */}
                        <div>
                             <h5 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">{t("signalStacks", "Signal Stacks")}</h5>
                             <div className="space-y-2">
                                {savedRobots.filter(r => r.signal_ids.length > 0).map(robot => (
                                    <div 
                                        key={robot.id} 
                                        className="flex justify-between items-center p-2 bg-slate-950 rounded-lg border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all"
                                        onClick={() => loadRobot(robot)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-white font-medium">{robot.name}</span>
                                            {robot.status === "running" ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{t("activeStatus", "Active")}</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700">{t("pausedStatus", "Paused")}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500">{robot.signal_ids.length} sigs</span>
                                            <button
                                               onClick={(e) => toggleBotStatus(robot, e)}
                                               className={`p-1 rounded transition-colors ${robot.status === "running" ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"}`}
                                               title={robot.status === "running" ? "Pause" : "Deploy"}
                                            >
                                                {robot.status === "running" ? "⏸" : "▶"}
                                            </button>
                                            <button
                                                onClick={(e) => deleteBot(robot, e)}
                                                className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>

                        {/* 2. Legacy Robots */}
                        {savedRobots.some(r => r.signal_ids.length === 0) && (
                            <div className="border-t border-slate-800 pt-3">
                                <h5 className="text-[10px] uppercase tracking-wider text-amber-500/70 font-bold mb-2">{t("legacyRobots", "Legacy Script Robots")}</h5>
                                <div className="space-y-2 opacity-70">
                                    {savedRobots.filter(r => r.signal_ids.length === 0).map(robot => (
                                        <div 
                                            key={robot.id} 
                                            className="flex justify-between items-center p-2 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-red-500/30 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-300 text-sm font-medium">{robot.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => deleteBot(robot, e)}
                                                    className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                    title="Delete Legacy"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
