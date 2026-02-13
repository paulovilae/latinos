"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocalizationProvider";

interface TestResult {
  timestamp: string;
  close: number;
  result: boolean | null;
  logs: string[];
}

interface SignalTesterProps {
  signalId: number;
}

export function SignalTester({ signalId }: SignalTesterProps) {
  const { t } = useLocale();
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Clear previous results when signal changes
  useEffect(() => {
    setResults([]);
    setExpandedRow(null);
  }, [signalId]);

  const handleTest = async () => {
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/signals/${signalId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, days: 10 }),
      });
      
      if (!res.ok) throw new Error("Test failed");
      
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      alert(t("testError", "Failed to run test"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="flex gap-4 items-end mb-4">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">Test Symbol</label>
          <input 
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            placeholder="AAPL"
          />
        </div>
        <button
          onClick={handleTest}
          disabled={loading}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm h-[30px] disabled:opacity-50"
        >
          {loading ? "Testing..." : "▶ Run Test"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {results.map((r, idx) => (
            <div key={idx} className="bg-slate-950 rounded border border-slate-800 text-sm">
              <div 
                className="p-2 flex justify-between items-center cursor-pointer hover:bg-slate-900"
                onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
              >
                <div className="flex gap-4 items-center">
                  <span className="text-slate-400 font-mono text-xs">{new Date(r.timestamp).toLocaleDateString()}</span>
                  <span className="text-slate-300">${r.close.toFixed(2)}</span>
                </div>
                <div>
                  {r.result === true && <span className="text-green-400 font-bold">PASS (Buy)</span>}
                  {r.result === false && <span className="text-slate-500">FAIL</span>}
                  {r.result === null && <span className="text-red-400 font-bold">ERROR</span>}
                </div>
              </div>
              
              {expandedRow === idx && (
                <div className="p-2 border-t border-slate-800 bg-slate-900/50">
                  <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                    {r.logs.join("\n")}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
