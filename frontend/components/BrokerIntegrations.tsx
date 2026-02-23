"use client";

import { useEffect, useState } from "react";
import { actionGetBrokers, actionCreateBroker, actionDeleteBroker, BrokerConnection } from "@/lib/actions";
import { Plus, Trash2, Key, Link as LinkIcon, AlertCircle } from "lucide-react";

export function BrokerIntegrations() {
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [brokerName, setBrokerName] = useState("alpaca");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isPaper, setIsPaper] = useState(true);

  const fetchConnections = async () => {
    try {
      setIsLoading(true);
      const data = await actionGetBrokers();
      setConnections(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load broker connections.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) {
      setError("API Key and Secret are required.");
      return;
    }
    
    try {
      setIsLoading(true);
      await actionCreateBroker({ broker_name: brokerName, api_key: apiKey, api_secret: apiSecret, is_paper: isPaper });
      await fetchConnections();
      setIsAdding(false);
      setApiKey("");
      setApiSecret("");
    } catch (err: any) {
      setError(err.message || "Failed to connect broker.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to disconnect this broker? Active live bots might fail.")) return;
    try {
      setIsLoading(true);
      await actionDeleteBroker(id);
      await fetchConnections();
    } catch (err: any) {
      setError(err.message || "Failed to disconnect broker.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 flex items-center gap-2 rounded-xl text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {connections.length > 0 ? (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div key={conn.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  conn.broker_name === 'alpaca' ? 'bg-yellow-500/20 text-yellow-500' : 
                  conn.broker_name === 'tradingview' ? 'bg-blue-500/20 text-blue-500' :
                  conn.broker_name === 'interactivebrokers' ? 'bg-red-500/20 text-red-500' :
                  'bg-orange-500/20 text-orange-500'
                }`}>
                  <LinkIcon size={20} />
                </div>
                <div>
                  <h4 className="text-white font-medium capitalize">{conn.broker_name} {conn.is_paper ? "(Paper)" : "(Live)"}</h4>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-1">
                    <Key size={12} />
                    ••••••••••••• Connected
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(conn.id)}
                disabled={isLoading}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !isLoading && !isAdding && (
          <div className="text-center py-6 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
            No active broker connections.
          </div>
        )
      )}

      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add Broker Connection
        </button>
      ) : (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Broker</label>
            <select
              value={brokerName}
              onChange={(e) => setBrokerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="alpaca">Alpaca Markets</option>
              <option value="tradingview">TradingView</option>
              <option value="interactivebrokers">Interactive Brokers</option>
              <option value="binance">Binance</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_paper"
              checked={isPaper}
              onChange={(e) => setIsPaper(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="is_paper" className="text-sm text-slate-300">This is a Paper Trading API key</label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">API Key</label>
            <input
              type="text"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. PKXG... "
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">API Secret</label>
            <input
              type="password"
              required
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="••••••••••••••••••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Instructions Box */}
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 mt-2">
            <h5 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <AlertCircle size={14}/> Setup Instructions
            </h5>
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
              {brokerName === 'alpaca' && (
                  <p>Create a free account at Alpaca Markets. Go to your <a href="https://app.alpaca.markets/paper/dashboard/overview" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Paper Trading Dashboard</a> to generate your API Key and Secret. Ensure 'Paper Trading' is checked above to use virtual funds.</p>
              )}
              {brokerName === 'binance' && (
                  <p>Log in to Binance and go to <a href="https://www.binance.com/en/my/settings/api-management" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">API Management</a>. Create a new API Key for Spot & Margin trading. Set up a <a href="https://testnet.binance.vision/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Testnet account</a> for Paper trading.</p>
              )}
              {brokerName === 'tradingview' && (
                  <p>Go to your <a href="https://www.tradingview.com/chart/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">TradingView Chart</a>. Create an Alert using Webhooks, input your Latinos webhook URL, and enter your secure Webhook Passphrase as the API Secret to link your alerts.</p>
              )}
              {brokerName === 'interactivebrokers' && (
                  <p>Log in to the <a href="https://www.interactivebrokers.com/sso/resolver?action=Settings" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">IBKR Client Portal Settings</a>. Navigate to Settings &gt; Account Settings &gt; Interactive Brokers API to configure and generate your Paper Trading keys.</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-sm transition-colors"
            >
              {isLoading ? "Connecting..." : "Connect Broker"}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
