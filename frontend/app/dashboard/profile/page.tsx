import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { fetchDashboardSummary } from "@/lib/api";
import { SectionCard } from "@/components/SectionCard";
import { LocalizedText } from "@/components/LocalizedText";
import { authOptions } from "@/lib/auth";
import { RoleEditor } from "@/components/RoleEditor";
import { AvatarUpload } from "@/components/AvatarUpload";
import { BrokerIntegrations } from "@/components/BrokerIntegrations";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
      redirect("/auth/signin");
  }

  let summary;
  try {
      summary = await fetchDashboardSummary();
  } catch (e) {
      console.error(e);
      // Fallback or empty state
  }

  // Filter bots owned by user (mock logic: all bots in summary for now, 
  // in real app fetchDashboardSummary usually returns user-scoped data or we filter by user ID)
  // Assuming the summary endpoint returns data relevant to the user context.
  const myBots = summary?.bots || [];

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold text-white">
          <LocalizedText id="profileTitle" fallback="My Profile" />
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Info */}
          <SectionCard title="Account Details" description="Personal information and settings">
              <div className="space-y-4">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <p className="text-sm text-slate-500 mb-1">Full Name</p>
                      <p className="font-medium text-white">{session.user?.name}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <p className="text-sm text-slate-500 mb-1">Email Address</p>
                      <p className="font-medium text-white">{session.user?.email}</p>
                  </div>
                  <RoleEditor />
              </div>
          </SectionCard>

          {/* Active Robots */}
          <SectionCard title="My Robots" description="Trading bots currently assigned to your account">
              {myBots.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                      No active robots found.
                  </div>
              ) : (
                  <ul className="space-y-3">
                      {myBots.map(bot => (
                          <li key={bot.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between">
                              <div>
                                  <p className="font-semibold text-white">{bot.name}</p>
                                  <p className="text-xs text-slate-400">{bot.description}</p>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-bold ${bot.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                                  {bot.status.toUpperCase()}
                              </div>
                          </li>
                      ))}
                  </ul>
              )}
          </SectionCard>

          {/* Broker Integrations */}
          <SectionCard title="Broker Webhooks" description="Connect your exchange accounts for live trading execution">
             <BrokerIntegrations />
          </SectionCard>
      </div>
    </main>
  );
}
