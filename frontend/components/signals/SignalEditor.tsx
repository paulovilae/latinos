"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocalizationProvider";
import { ExternalLink, Zap, Network } from "lucide-react";

interface Signal {
  id: number;
  type: "FORMULA" | "PYTHON" | "DIFY_WASM";
  payload: { code: string; name?: string; description?: string; dify_app_id?: string };
  mode: string;
}

export function SignalEditor() {
  const { t } = useLocale();
  const [signals, setStrategies] = useState<Signal[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  useEffect(() => {
    refreshStrategies();
  }, []);

  const refreshStrategies = async () => {
    try {
      const res = await fetch("/api/signals");
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStrategies(data);
      } else {
        setStrategies([]);
      }
    } catch (e) {
      console.error("Failed to load signals", e);
      setStrategies([]);
    }
  };

  const openDifyWorkspace = () => {
    // Navigate to the Dify internal workspace IP or domain
    window.open("http://192.168.1.35/apps", "_blank");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-[500px] h-auto">
      {/* Legacy List */}
      <div className="md:col-span-1 border-r border-slate-700 pr-4 overflow-y-auto h-[250px] md:h-full">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">{t("yourStrategies", "Your Strategies")}</h3>
        <div className="space-y-2">
            {signals.map(sig => (
                <div 
                    key={sig.id} 
                    className={`p-3 rounded-lg cursor-pointer transition flex justify-between items-center group
                        ${selectedSignal?.id === sig.id ? 'bg-indigo-900/50 border border-indigo-500/50' : 'bg-slate-800 hover:bg-slate-700'}`}
                    onClick={() => setSelectedSignal(sig)}
                >
                    <div>
                        <div className="font-medium text-white">{sig.payload.name || `Signal #${sig.id}`}</div>
                        <div className="text-xs text-slate-500">{sig.type}</div>
                    </div>
                </div>
            ))}
             {signals.length === 0 && (
                <div className="text-sm text-slate-500 italic">{t("noStrategiesYet", "No signals yet.")}</div>
            )}
        </div>
      </div>

      {/* Dify Integration Panel */}
      <div className="md:col-span-2 flex flex-col items-center justify-center p-8 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-600/30 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/30 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-md">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <Network className="w-10 h-10 text-indigo-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
                Imaginos Visual Builder
            </h2>
            
            <p className="text-slate-400 mb-8 leading-relaxed">
                The legacy Python code editor has been deprecated. All quantitative signals and routing logic are now built visually using the high-performance Dify WASM compiler.
            </p>

            <div className="flex flex-col w-full gap-4">
                <button 
                    onClick={openDifyWorkspace}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all outline-none"
                >
                    <Zap className="w-5 h-5" />
                    Launch Visual Workspace
                    <ExternalLink className="w-4 h-4 opacity-70 ml-1" />
                </button>

                {selectedSignal && selectedSignal.type !== "DIFY_WASM" && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left mt-4">
                        <p className="text-sm text-amber-200 font-medium mb-1">Legacy Strategy Detected</p>
                        <p className="text-xs text-amber-200/70">
                            "{selectedSignal.payload.name || 'This signal'}" is using the deprecated {selectedSignal.type} engine. 
                            It will continue to execute, but cannot be visually edited. Please recreate it in the new Builder.
                        </p>
                    </div>
                )}
                {selectedSignal && selectedSignal.type === "DIFY_WASM" && (
                     <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left mt-4">
                        <p className="text-sm text-emerald-400 font-medium mb-1">WASM Active</p>
                        <p className="text-xs text-emerald-400/70">
                            This strategy is compiled to high-speed WebAssembly and is executing natively.
                        </p>
                     </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
