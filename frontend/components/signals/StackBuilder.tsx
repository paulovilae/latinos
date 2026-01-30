"use client";

import { useState, useEffect } from "react";
import { clientApiFetch } from "@/lib/clientApi";

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

  useEffect(() => {
    // Load signals to choose from
    clientApiFetch<Signal[]>("/api/signals/").then(setAvailableSignals).catch(console.error);
    // Load saved robots
    loadRobots();
  }, []);

  const loadRobots = async () => {
    try {
      const bots = await clientApiFetch<any[]>("/api/bots/");
      setSavedRobots(bots.map(b => ({
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
      await clientApiFetch(`/api/bots/${robot.id}/${newStatus}`, { method: "POST" });
      loadRobots();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const deleteBot = async (robot: SavedRobot, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete robot "${robot.name}"?`)) return;
    try {
      await clientApiFetch(`/api/bots/${robot.id}`, { method: "DELETE" });
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
    if (stack.length === 0) return;
    setIsRunning(true);
    setBacktestResult(null);
    try {
      const result = await clientApiFetch("/api/signals/backtest", {
        method: "POST",
        body: JSON.stringify({
          range: selectedPeriod,
          market: selectedSymbol,
          stack: stack.map(s => s.id) // Pass IDs
        })
      });
      setBacktestResult(result);
    } catch (e) {
      console.error(e);
      alert("Backtest failed");
    } finally {
      setIsRunning(false);
    }
  };

  const saveRobot = async () => {
    if (!robotName.trim() || stack.length === 0) {
      alert("Please enter a robot name and add at least one signal.");
      return;
    }
    setIsSaving(true);
    try {
      await clientApiFetch("/api/bots/", {
        method: "POST",
        body: JSON.stringify({
          name: robotName,
          signal_ids: stack.map(s => s.id)
        })
      });
      alert(`Robot "${robotName}" saved successfully!`);
      setRobotName("");
      loadRobots();
    } catch (e) {
      console.error(e);
      alert("Failed to save robot");
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
    <div className="space-y-6">
      
      {/* Valid Signals List (Drag source equivalent) */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
        {availableSignals.map(sig => (
            <button
                key={sig.id}
                className="flex-shrink-0 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-full border border-slate-700 transition"
                onClick={() => addToStack(sig)}
            >
                + {sig.payload?.name || `Sig ${sig.id}`}
            </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* The Stack Visualization */}
        <div className="relative border border-slate-700 rounded-xl bg-slate-950/50 p-6 min-h-[300px]">
            <div className="absolute top-4 right-4 text-xs text-slate-500 font-mono">FLOW: SEQUENTIAL (AND)</div>
            
            <div className="flex flex-col items-center space-y-2">
                
                {/* Market Input Node */}
                 <div className="w-48 py-2 text-center bg-slate-800 rounded border border-slate-600 text-slate-400 text-xs font-mono">
                    MARKET DATA (1D)
                 </div>
                 <div className="h-6 w-0.5 bg-slate-600"></div>

                 {/* Stack Items */}
                 {stack.map((sig, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                        <div className="relative group w-64 p-3 bg-slate-900 border border-indigo-500/50 rounded-lg shadow-lg shadow-indigo-500/10 flex items-center justify-between">
                             <div className="flex flex-col gap-1 mr-2">
                                <button 
                                    disabled={idx === 0}
                                    onClick={() => {
                                        const newStack = [...stack];
                                        [newStack[idx], newStack[idx-1]] = [newStack[idx-1], newStack[idx]];
                                        setStack(newStack);
                                    }}
                                    className="text-slate-600 hover:text-white disabled:opacity-30 disabled:hover:text-slate-600"
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
                                    className="text-slate-600 hover:text-white disabled:opacity-30 disabled:hover:text-slate-600"
                                >
                                    ▼
                                </button>
                             </div>

                             <span className="font-semibold text-white flex-1 text-center">{sig.payload?.name || `Signal ${sig.id}`}</span>
                             
                             <button onClick={() => removeFromStack(idx)} className="text-slate-500 hover:text-red-400 ml-2">×</button>
                             
                             {/* Traffic Light Logic Visualization */}
                             <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1">
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

                 {stack.length === 0 && (
                    <div className="py-12 text-slate-600 text-sm italic">
                        Empty stack. Add signals from top bar.
                    </div>
                 )}

                 {stack.length > 0 && (
                     <div className="w-48 py-2 text-center bg-emerald-900/30 border border-emerald-500 rounded text-emerald-300 font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        ACTION: BUY / SHORT
                     </div>
                 )}

            </div>
        </div>

        {/* Controls & Results */}
        <div className="space-y-6">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                   <span>📊 Simulation (Entrenamiento)</span>
                   <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-black">History</span>
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Symbol</label>
                        <select 
                            value={selectedSymbol}
                            onChange={(e) => setSelectedSymbol(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                        >
                            <option value="AAPL">AAPL</option>
                            <option value="BTC-USD">BTC-USD</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Period</label>
                        <select 
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                        >
                            <option value="1y">1 Year</option>
                            <option value="30d">30 Days</option>
                        </select>
                    </div>
                </div>
                <button 
                    onClick={runBacktest}
                    disabled={isRunning || stack.length === 0}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                    {isRunning ? "🚀 Running Simulation..." : "▶️ Run Simulation (Entrenamiento)"}
                </button>
            </div>

            {backtestResult && (
                 <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                    <h4 className="font-semibold text-white mb-4 border-b border-slate-800 pb-2">Results</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                            <div className="text-xs text-slate-400 uppercase tracking-wider">Total PnL</div>
                            <div className={`text-xl font-mono font-bold ${backtestResult.results.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ${backtestResult.results.pnl.toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                            <div className="text-xs text-slate-400 uppercase tracking-wider">Win Rate</div>
                            <div className="text-xl font-mono font-bold text-white">
                                {(backtestResult.results.win_rate * 100).toFixed(1)}%
                            </div>
                        </div>
                         <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center col-span-2">
                            <div className="text-xs text-slate-400 uppercase tracking-wider">Total Trades</div>
                            <div className="text-xl font-mono font-bold text-white">
                                {backtestResult.results.total_trades}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Robot Section */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-white mb-4">Save as Robot</h4>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Enter robot name..."
                        value={robotName}
                        onChange={(e) => setRobotName(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder:text-slate-500"
                    />
                    <button
                        onClick={saveRobot}
                        disabled={isSaving || stack.length === 0 || !robotName.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSaving ? "Saving..." : "💾 Save"}
                    </button>
                </div>
            </div>

            {/* Saved Robots */}
            {savedRobots.length > 0 && (
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <h4 className="font-semibold text-white mb-4">My Robots</h4>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                        {/* 1. New Signal Stacks */}
                        <div>
                             <h5 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Signal Stacks</h5>
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
                                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700">Paused</span>
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
                                <h5 className="text-[10px] uppercase tracking-wider text-amber-500/70 font-bold mb-2">Legacy Script Robots</h5>
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
