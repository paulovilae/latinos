import { useState, useCallback } from "react";
import { useLocale } from "@/components/LocalizationProvider";
import { TagPill } from "@/components/TagPill";
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

  const isSubscribed = useCallback((masterBotId: number) => {
    // In a real implementation, we'd check if the user has a "child" bot linked to the master
    // For now, checking if a bot with the exact same name exists for this user
    return userBots.some(ub => ub.name === bots.find(b => b.id === masterBotId)?.name);
  }, [bots, userBots]);

  const handleSubscribe = async (botId: number) => {
    setSubscribing(botId);
    try {
        // Implementation for Phase 1 Subscriptions will go here
        await new Promise(res => setTimeout(res, 1000));
        alert("Bot subscription workflow will be connected here!");
    } catch (e) {
        console.error("Failed to subscribe", e);
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
                  <h4 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">
                    {bot.name}
                  </h4>
                  {active && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
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
                    <button 
                        onClick={() => handleSubscribe(bot.id)}
                        disabled={subscribing === bot.id}
                        className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-sm transition-colors disabled:opacity-50"
                    >
                        {subscribing === bot.id ? "Subscribing..." : "Subscribe & Activate"}
                    </button>
                )}
              </div>
            </div>
          );
      })}
    </div>
  );
}
