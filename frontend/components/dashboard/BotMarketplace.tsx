import { useState, useCallback } from "react";
import { useLocale } from "@/components/LocalizationProvider";
import { TagPill } from "@/components/TagPill";
import { actionSubscribeToBot } from "@/lib/actions";
import type { Bot, User } from "@/lib/types";

export function BotMarketplace({ 
  bots, 
  user,
  userBots
}: { 
  bots: Bot[]; 
  user: User;
  userBots: Bot[];
}) {
  const { t } = useLocale();
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [viewingBot, setViewingBot] = useState<Bot | null>(null);

  const isSubscribed = useCallback((masterBotId: number) => {
    // In a real implementation, we'd check if the user has a "child" bot linked to the master
    // For now, checking if a bot with the exact same name exists for this user
    return userBots.some(ub => ub.name === bots.find(b => b.id === masterBotId)?.name);
  }, [bots, userBots]);

  const handleSubscribe = async (botId: number) => {
    setSubscribing(botId);
    try {
        await actionSubscribeToBot(botId);
        window.location.reload(); // Refresh the dashboard to show the new bot in Live Trading
    } catch (e: any) {
        console.error("Failed to subscribe", e);
        alert(e.message || "Failed to subscribe to bot.");
    } finally {
        setSubscribing(null);
    }
  };

  // Only show bots created by admins that are published/running
  // In the current schema, we assume any bot available in this list (fetched by normal users)
  // that doesn't belong to them is an admin "Marketplace" bot.
  const marketplaceBots = bots.filter(b => b.owner_id !== user.id && b.status === "running");

  if (marketplaceBots.length === 0) {
      return (
          <div className="flex items-center justify-center p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
              <p className="text-slate-500 text-sm">No master bots available in the marketplace yet.</p>
          </div>
      );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {marketplaceBots.map(bot => {
          const active = isSubscribed(bot.id);
          return (
            <div key={bot.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors flex flex-col">
              <div className="p-5 border-b border-slate-800/50 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">
                      {bot.name}
                    </h4>
                    {bot.live_metrics?.trailing_30d?.sharpe > 1.0 && (
                        <span className="text-xs bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30 flex items-center gap-1">
                            🔥 Trending
                        </span>
                    )}
                  </div>
                  {active && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                      SUBSCRIBED
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {bot.description || "Automated trading strategy"}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {bot.tags?.map((tag) => (
                    <TagPill key={tag} label={tag} />
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="block text-slate-500 mb-1">Target</span>
                        <span className="font-mono text-white font-bold">{bot.tags?.[0] || 'MULTI'}</span>
                    </div>
                     <div className="bg-slate-950 p-2 rounded border border-slate-800">
                        <span className="block text-slate-500 mb-1">Capital</span>
                        <span className="font-mono text-emerald-400 font-bold">Auto</span>
                    </div>
                </div>
              </div>
              
              <div className="p-3 bg-slate-950 border-t border-slate-800">
                {user.role === "admin" ? (
                   <button disabled className="w-full py-2 bg-slate-800 text-slate-500 rounded font-bold text-sm cursor-not-allowed">
                       Admin Master Bot
                   </button>
                ) : active ? (
                    <button disabled className="w-full py-2 bg-emerald-900/30 text-emerald-500 border border-emerald-900/50 rounded font-bold text-sm">
                       Manage in Live Trading
                   </button>
                ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setViewingBot(bot)}
                            className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-sm transition-colors"
                        >
                            Details
                        </button>
                        <button 
                            onClick={() => handleSubscribe(bot.id)}
                            disabled={subscribing === bot.id}
                            className="w-2/3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            {subscribing === bot.id ? "Subscribing..." : "Subscribe"}
                        </button>
                    </div>
                )}
              </div>
            </div>
          );
      })}

      {/* Bot Details Modal */}
      {viewingBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-black text-white">{viewingBot.name}</h3>
                        <p className="text-sm text-cyan-400 font-mono mt-1">Quantitative Strategy • Algorithmic Execution</p>
                    </div>
                    <button onClick={() => setViewingBot(null)} className="text-slate-500 hover:text-white pb-2">&times; Close</button>
                </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
                        <span className="block text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">Target</span>
                        <span className="text-lg font-mono text-white">{viewingBot.live_metrics?.trailing_30d?.symbol || viewingBot.tags?.[0] || 'MULTI'}</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center" title="Trailing 30-day Sharpe Ratio">
                        <span className="block text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">30D Sharpe</span>
                        <span className="text-lg font-mono text-emerald-400">
                            {viewingBot.live_metrics?.trailing_30d?.sharpe !== undefined 
                                ? viewingBot.live_metrics.trailing_30d.sharpe.toFixed(2) 
                                : "N/A"}
                        </span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center" title="Maximum Drawdown over 30 days">
                        <span className="block text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">Max DD</span>
                        <span className="text-lg font-mono text-emerald-400">
                            {viewingBot.live_metrics?.trailing_30d?.max_drawdown !== undefined 
                                ? `${(viewingBot.live_metrics.trailing_30d.max_drawdown * 100).toFixed(1)}%` 
                                : "N/A"}
                        </span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center" title="Win Rate over 30 days">
                        <span className="block text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">Win Rate</span>
                        <span className="text-lg font-mono text-emerald-400">
                            {viewingBot.live_metrics?.trailing_30d?.win_rate !== undefined 
                                ? `${(viewingBot.live_metrics.trailing_30d.win_rate * 100).toFixed(0)}%` 
                                : "N/A"}
                        </span>
                    </div>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">🧠 Investment Thesis</h4>
                    <p className="text-sm text-slate-400 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                        {viewingBot.description || "A proprietary trading algorithm developed by our quantitative analysts."}
                        <br/><br/>
                        For the <strong>Golden Goose</strong>, the strategy identifies explosive momentum breakouts combined with extreme oversold conditions. It filters out market noise using highly sensitive Moving Average crossovers (Fast MA vs Slow MA) and confirms trade entry probability by executing only when the RSI indicates the asset has been aggressively shorted beyond normal standard deviations.
                    </p>
                </div>
                
                <div>
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">⚙️ Operational Mechanics</h4>
                    <ul className="text-sm text-slate-400 space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 list-inside list-disc">
                        <li>Evaluates tick data on 1D/4H specific timeframes depending on configuration.</li>
                        <li>Generates 1 to 3 highly confident signals per month per asset.</li>
                        <li>Executes instantly across connected Paper or Live Broker webhooks.</li>
                        <li>Rebalances exit conditions autonomously via trailing Take-Profit signals.</li>
                    </ul>
                </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                 <button 
                    onClick={() => setViewingBot(null)}
                    className="px-6 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => {
                        handleSubscribe(viewingBot.id);
                        setViewingBot(null);
                    }}
                    disabled={subscribing === viewingBot.id}
                    className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors disabled:opacity-50"
                >
                    {subscribing === viewingBot.id ? "Subscribing..." : "Subscribe to Strategy"}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
