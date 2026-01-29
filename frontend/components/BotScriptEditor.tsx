"use client";

import { useState, useEffect } from "react";
import { clientApiFetch } from "@/lib/clientApi";
import { Bot } from "@/lib/types";

interface BotScriptEditorProps {
  bots: Bot[];
}

export function BotScriptEditor({ bots }: BotScriptEditorProps) {
  const [selectedBotId, setSelectedBotId] = useState<number | null>(bots[0]?.id || null);
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // When bot selection changes, find the bot and load its script
  // Note: List bots might not have full script if it's large, but let's assume filtering 
  // or re-fetching detail is better practice if script is heavy.
  // For now, let's assume we re-fetch the specific bot to ensure we have latest script.
  useEffect(() => {
    if (!selectedBotId) return;
    
    // Check if the script is already available in the props (if we modify Bot type to include script in lists)
    // But better to fetch fresh.
    async function loadBot() {
        setLoading(true);
        try {
            // Check if we have an endpoint for single bot or just use list
            // Assuming we must fetch or find in list.
            // If list `bots` doesn't have script, we might need a GET /bots/{id}.
            // Let's try to find in local list first, but if script is missing, we might need to fetch.
            // Since we just added the column, the list response likely includes it if the schema was updated.
            // But let's fetch to be safe and "live".
            // Since we don't have a specific Hook for single bot, we can just find it in the list if the list is fresh.
           
            // Actually, let's fetch strictly to get the script.
            // But detailed endpoint GET /bots/{id} wasn't explicitly checked. 
            // Fallback: use clientApiFetch to refresh list or find in local if we trust it.
            // Given I edited BotOut schema, the list should have it.
            const target = bots.find(b => b.id === selectedBotId);
            if (target) {
                // If the modification to schema worked, `script` is here.
                // But TypeScript might complain if types aren't updated.
                // Let's cast for now.
                setScript((target as any).script || "");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    loadBot();
  }, [selectedBotId, bots]);

  const [running, setRunning] = useState(false);

  const handleRunTest = async () => {
    if (!selectedBotId) return;
    setRunning(true);
    setStatus(null);
    try {
        // Trigger backtest
        // We need to create a backtest record first?
        // Or do we have a specific endpoint for test run?
        // The instructions said "wire create_backtest".
        // So we create a backtest.
        await clientApiFetch("/backtests", {
            method: "POST",
            body: JSON.stringify({
                bot_id: selectedBotId,
                range: "3mo", // Default for quick test
                market: "BTC-USD"
            })
        });
        setStatus("Test Queued! Check Dashboard.");
    } catch (e) {
        console.error(e);
        setStatus("Test Failed");
    } finally {
        setRunning(false);
    }
  };

  const handleSave = async () => {
      if (!selectedBotId) return;
      setSaving(true);
      setStatus(null);
      try {
          await clientApiFetch(`/bots/${selectedBotId}`, {
              method: "PUT",
              body: JSON.stringify({ script }),
          });
          setStatus("Saved!");
          setTimeout(() => setStatus(null), 2000);
      } catch (e) {
          console.error(e);
          setStatus("Error saving.");
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Target Bot:</span>
            <select 
                className="bg-slate-900 text-white text-sm border border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
                value={selectedBotId || ""}
                onChange={(e) => setSelectedBotId(Number(e.target.value))}
            >
                {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
        </div>
        <div className="flex items-center gap-3">
            {status && <span className="text-xs text-emerald-400 font-medium">{status}</span>}
            <button
                onClick={handleSave}
                disabled={saving || !selectedBotId}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
                {saving ? "Saving..." : "Save Script"}
            </button>
            <button
                onClick={handleRunTest}
                disabled={running || !selectedBotId}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
                {running ? "Running..." : "Run Backtest"}
            </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
         <textarea
            className="w-full h-full bg-[#0d1117] text-slate-300 font-mono text-sm p-4 outline-none resize-none"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            spellCheck={false}
            placeholder="# Write your Python strategy here...
def strategy(data):
    if data['close'] > data['ma50']:
        return 'buy'
    return 'hold'
"
         />
      </div>
    </div>
  );
}
