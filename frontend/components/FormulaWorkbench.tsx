"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { clientApiFetch } from "@/lib/clientApi";
import { useLocale } from "@/components/LocalizationProvider";
import type { Bot, Formula, MarketUniverseItem } from "@/lib/types";

import { PricePlot } from "./PricePlot";
import { TagPill } from "./TagPill";
import { FlowEditor } from "./FlowEditor/FlowEditor";
import type { FlowState } from "./FlowEditor/types";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DEFAULT_FORMULA = {
  name: "Momentum Breakout",
  logic: {
    entry: "close > sma(close, 50) and volume > avgVolume(20)",
    exit: "close < sma(close, 20) or drawdown > 8%",
  },
  risk: {
    maxExposure: 0.2,
    stopLoss: "ATR(14) * 2",
  },
  assets: ["AAPL", "MSFT"],
  notes: "Focus on liquid mega-cap tech with tight spreads.",
};

const initialFlowState: FlowState = {
  nodes: [],
  connections: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
};

interface FormulaWorkbenchProps {
  bots: Bot[];
  initialUniverse: MarketUniverseItem[];
}

const CHART_OPTIONS = [
  { label: "1H", interval: "5m", range: "1d", fallbackLength: 60 },
  { label: "1D", interval: "15m", range: "5d", fallbackLength: 96 },
  { label: "1W", interval: "1h", range: "1mo", fallbackLength: 120 },
  { label: "1M", interval: "1d", range: "3mo", fallbackLength: 90 },
];

export function FormulaWorkbench({ bots, initialUniverse }: FormulaWorkbenchProps) {
  const [flowState, setFlowState] = useState<FlowState>(initialFlowState);

  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(DEFAULT_FORMULA.assets);
  const [universe, setUniverse] = useState<MarketUniverseItem[]>(initialUniverse);
  const [activeSymbol, setActiveSymbol] = useState<string>(DEFAULT_FORMULA.assets[0]);
  const [universeLoading, setUniverseLoading] = useState(true);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState(CHART_OPTIONS[1]);
  const [newSymbol, setNewSymbol] = useState({ symbol: "", name: "", sector: "" });
  const [targetBot, setTargetBot] = useState<number | null>(bots[0]?.id ?? null);
  const [saveState, setSaveState] = useState<{ status: "idle" | "saving" | "success" | "error"; message?: string }>({
    status: "idle",
  });
  const { t } = useLocale();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Add toggle function
  const toggleEditorMode = () => {
    setEditorMode(prev => prev === 'visual' ? 'json' : 'visual');
  };

  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');

  useEffect(() => {
    async function loadUniverse() {
      setUniverseLoading(true);
      try {
        const response = await fetch(`${apiBase}/market-data/universe`);
        if (!response.ok) {
          throw new Error("Failed to fetch universe");
        }
        const payload = await response.json();
        setUniverse(payload.universe);
      } catch (_) {
        setUniverse(initialUniverse.length ? initialUniverse : [
          { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
          { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology" },
        ]);
      } finally {
        setUniverseLoading(false);
      }
    }
    loadUniverse();
  }, [initialUniverse]);

  useEffect(() => {
    if (!activeSymbol) {
      return;
    }
    let timer: NodeJS.Timeout | null = null;
    let cancelled = false;

    const loadSeries = async (showSpinner: boolean) => {
      if (showSpinner) {
        setSeriesLoading(true);
      }
      setSeriesError(null);
      try {
        const response = await fetch(
          `${apiBase}/market-data/${activeSymbol}?interval=${timeframe.interval}&range=${timeframe.range}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch market data");
        }
        const payload = await response.json();
        if (!cancelled) {
          setLastUpdated(new Date().toISOString());
        }
      } catch (error) {
        if (!cancelled) {
          setSeriesError(t("marketDataError", "Unable to reach market data API. Showing cached curve."));
          setLastUpdated(new Date().toISOString());
        }
      } finally {
        if (!cancelled && showSpinner) {
          setSeriesLoading(false);
        }
      }
    };

    loadSeries(true);
    timer = setInterval(() => loadSeries(false), 15000);

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [activeSymbol, timeframe, t]);

  const handleAssetToggle = (symbol: string) => {
    setSelectedSymbols((current) => {
      const next = current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol];
      const resolved = next.length ? next : current; // prevent empty selection
      if (!resolved.includes(activeSymbol)) {
        setActiveSymbol(next[0] || activeSymbol);
      }
      return resolved;
    });
  };

  const handleAddSymbol = async (event: FormEvent) => {
    event.preventDefault();
    if (!newSymbol.symbol || !newSymbol.name) {
      return;
    }
    try {
      const payload = {
        symbol: newSymbol.symbol.toUpperCase(),
        name: newSymbol.name,
        sector: newSymbol.sector || "Custom",
      };
      const created = await clientApiFetch<MarketUniverseItem>("/market-data/universe", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUniverse((items) => [...items.filter((item) => item.symbol !== created.symbol), created]);
      setNewSymbol({ symbol: "", name: "", sector: "" });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSymbol = async (symbol: string) => {
    try {
      await clientApiFetch(`/market-data/universe/${symbol}`, { method: "DELETE" });
      setUniverse((items) => items.filter((item) => item.symbol !== symbol));
      setSelectedSymbols((assets) => assets.filter((asset) => asset !== symbol));
      if (activeSymbol === symbol && selectedSymbols.length > 1) {
        setActiveSymbol(selectedSymbols.find((asset) => asset !== symbol) || "");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Simplify persistFormula - visual mode only
  const persistFormula = async () => {
    if (!targetBot) {
      setSaveState({ status: "error", message: "Pick a bot." });
      return;
    }
    setSaveState({ status: "saving" });
    try {
      const payload = {
        name: "Visual Flow Strategy",
        logic: { entry: "visual_graph", exit: "visual_graph" },
        risk: { maxExposure: 0.2 },
        assets: selectedSymbols,
        notes: `Visual flow (${flowState.nodes.length} nodes)`,
        graph: flowState,
      };
      const createResp = await clientApiFetch<Formula>(`/bots/${targetBot}/formulas`, {
        method: "POST",
        body: JSON.stringify({
          payload,
          assets: selectedSymbols,
          notes: payload.notes,
        }),
      });
      await clientApiFetch(`/formulas/${createResp.id}/publish`, { method: "POST", body: JSON.stringify({ published: true }) });
      setSaveState({ status: "success", message: `Saved v${createResp.version}` });
    } catch (error) {
      setSaveState({ status: "error", message: error instanceof Error ? error.message : "Save failed" });
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'w-full'} flex flex-col bg-slate-950`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Visual Formula Flow</h1>
          <p className="text-slate-400 mt-1">Node-based strategy builder - drag nodes, connect ports, build step-by-step signals</p>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          title="Toggle fullscreen"
        >
          {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
      </div>

      {/* Main editor area - full height */}
      <div className={`${isFullscreen ? 'flex-1' : 'flex-1'} p-6 overflow-hidden`}>
        <div className="h-full border border-slate-800 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
          <FlowEditor onExport={setFlowState} />
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{flowState.nodes.length} nodes • {flowState.connections.length} connections</span>
          <label className="text-sm text-slate-300">
            Target Bot:
            <select
              className="ml-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1"
              value={targetBot ?? ""}
              onChange={(e) => setTargetBot(Number(e.target.value))}
            >
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={persistFormula}
            disabled={!targetBot || saveState.status === "saving"}
            className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 px-8 py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 transition-all"
          >
            {saveState.status === "saving" ? "Saving..." : "🚀 Save & Publish"}
          </button>
          {saveState.status !== "idle" && (
            <span className={`text-sm px-4 py-2 rounded-lg font-medium ${
              saveState.status === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}>
              {saveState.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
