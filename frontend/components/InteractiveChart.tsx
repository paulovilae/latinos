"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { actionGetMarketData } from "@/lib/actions";

const PriceChart = dynamic(() => import("./PriceChart").then(mod => mod.PriceChart), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-slate-900/50 animate-pulse rounded-xl" />
});

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

import { Signal } from "@/lib/types";

interface InteractiveChartProps {
  initialData: { symbol: string; points: any[] };
  signals?: Signal[];
}

export function InteractiveChart({ initialData, signals = [] }: InteractiveChartProps) {
  const [symbol, setSymbol] = useState(initialData.symbol);
  const [data, setData] = useState(initialData.points);
  const [isPending, startTransition] = useTransition();
  const [showSMA, setShowSMA] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  function handleSymbolChange(newSymbol: string) {
    if (newSymbol === symbol) return;
    setSymbol(newSymbol);
    startTransition(async () => {
      try {
        const res = await actionGetMarketData(newSymbol);
        setData(res.points);
      } catch (e) {
        console.error("Failed to swap symbol", e);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Symbol Selector */}
        <div className="flex items-center gap-4">
            <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {SYMBOLS.slice(0, 5).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSymbolChange(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    symbol === s
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {s}
                </button>
              ))}
              <select
                 className="bg-transparent text-xs text-slate-400 font-medium px-2 outline-none hover:text-white cursor-pointer"
                 value={SYMBOLS.includes(symbol) && SYMBOLS.indexOf(symbol) < 5 ? "" : symbol}
                 onChange={(e) => handleSymbolChange(e.target.value)}
              >
                 <option value="" disabled>More...</option>
                 {SYMBOLS.slice(5).map(s => (
                    <option key={s} value={s} className="bg-slate-900 text-slate-200">{s}</option>
                 ))}
              </select>
            </div>
            
            <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                   onClick={() => setShowSMA(!showSMA)}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                       showSMA ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-white"
                   }`}
                >
                    SMA
                </button>
                <button
                   onClick={() => setShowVolume(!showVolume)}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                       showVolume ? "bg-violet-500/20 text-violet-400" : "text-slate-400 hover:text-white"
                   }`}
                >
                    Vol
                </button>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)]">
            Buy {symbol}
          </button>
          <button className="flex-1 md:flex-none px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)] hover:shadow-[0_0_20px_-3px_rgba(244,63,94,0.5)]">
            Sell {symbol}
          </button>
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}>
        <PriceChart 
            symbol={symbol} 
            data={data} 
            signals={signals} 
            showSMA={showSMA}
            showVolume={showVolume}
        />
      </div>
    </div>
  );
}
