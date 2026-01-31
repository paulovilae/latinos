"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocalizationProvider";
import { CodeEditor } from "./CodeEditor";
import { AIAssistant } from "./AIAssistant";
// Using Next.js API routes (no direct backend calls)

interface Signal {
  id: number;
  type: "FORMULA" | "PYTHON";
  payload: { code: string; name?: string; description?: string };
  mode: string;
}

export function SignalEditor() {
  const { t } = useLocale();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<"FORMULA" | "PYTHON">("FORMULA");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refreshSignals();
  }, []);

  const refreshSignals = async () => {
    try {
      const res = await fetch("/api/signals");
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSignals(data);
      } else {
        console.error("Signals data is not array:", data);
        setSignals([]);
      }
    } catch (e) {
      console.error("Failed to load signals", e);
      setSignals([]); // Fallback to empty
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (selectedSignal) {
        await fetch(`/api/signals/${selectedSignal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type,
                payload: { name, code },
                mode: selectedSignal.mode || "simulation"
            })
        });
      } else {
        await fetch("/api/signals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type,
                payload: { name, code },
                mode: "simulation"
            })
        });
      }
      await refreshSignals();
      // Show success message
      if (selectedSignal) {
        alert(t("signalSuccessUpdate", "✅ Signal updated successfully!"));
      } else {
        alert(t("signalSuccessCreate", "✅ Signal created successfully!"));
        setName("");
        setCode("");
      }
    } catch (e) {
      alert(t("signalError", "Failed to save signal"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-[500px] h-auto">
      {/* List */}
      <div className="md:col-span-1 border-r border-slate-700 pr-4 overflow-y-auto h-[300px] md:h-full">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">{t("yourSignals", "Your Signals")}</h3>
        <div className="space-y-2">
            {signals.map(sig => (
                <div 
                    key={sig.id} 
                    className="p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition flex justify-between items-center group"
                    onClick={() => {
                        setSelectedSignal(sig);
                        setName(sig.payload.name || "");
                        setType(sig.type);
                        // Fix for visible "\n" literals in legacy data
                        const cleanCode = sig.payload.code 
                            ? sig.payload.code.replace(/\\n/g, '\n') 
                            : "";
                        setCode(cleanCode);
                    }}
                >
                    <div>
                        <div className="font-medium text-white">{sig.payload.name || `Signal #${sig.id}`}</div>
                        <div className="text-xs text-slate-500">{sig.type}</div>
                    </div>
                    <button
                        className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={async (e) => {
                            e.stopPropagation();
                            if(!confirm(t("confirmDelete", "Delete this signal?"))) return;
                            try {
                                await fetch(`/api/signals/${sig.id}`, { method: "DELETE" });
                                refreshSignals();
                                if(selectedSignal?.id === sig.id) {
                                    setSelectedSignal(null);
                                    setName("");
                                    setCode("");
                                }
                            } catch(err) {
                                alert(t("signalError", "Failed to delete signal"));
                            }
                        }}
                    >
                        🗑️
                    </button>
                </div>
            ))}
             {signals.length === 0 && (
                <div className="text-sm text-slate-500 italic">{t("noSignalsYet", "No signals yet.")}</div>
            )}
        </div>
        <button 
            className="mt-4 w-full py-2 bg-indigo-600/20 text-indigo-300 rounded-lg text-sm hover:bg-indigo-600/30"
            onClick={() => {
                setSelectedSignal(null);
                setName("");
                setCode("");
            }}
        >
            + {t("newSignal", "New Signal")}
        </button>
      </div>

      {/* Editor */}
      <div className="md:col-span-2 flex flex-col gap-4">
        <div className="flex gap-4 items-center">
            <input 
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 flex-1 text-white"
                placeholder={t("signalNamePlaceholder", "Signal Name")}
                value={name}
                onChange={e => setName(e.target.value)}
            />
            <select 
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                value={type}
                onChange={e => setType(e.target.value as any)}
            >
                <option value="FORMULA">{t("mathFormula", "Math Formula")}</option>
                <option value="PYTHON">{t("pythonCode", "Python Script")}</option>
            </select>
            <AIAssistant 
                language={type === 'FORMULA' ? 'formula' : 'python'}
                onGenerate={(generated) => setCode(generated)}
            />
        </div>

        <div className="flex-1 relative h-[350px]">
            <CodeEditor 
                value={code}
                onChange={setCode}
                language={type === 'FORMULA' ? 'formula' : 'python'}
                placeholder={type === 'FORMULA' ? "close > open" : "if data.close > data.open:\n    result = True"}
            />
        </div>
        
        <div className="flex justify-end gap-3">
             <button 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 disabled:opacity-50"
                onClick={handleSave}
                disabled={isSubmitting || !code}
             >
                {selectedSignal ? t("updateSignal", "Update Signal") : t("createSignal", "Create Signal")}
             </button>
        </div>
      </div>
    </div>
  );
}
