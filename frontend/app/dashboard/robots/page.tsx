import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { fetchDashboardSummary } from "@/lib/api";
import { BotManager } from "@/components/BotManager";
import { BotScriptEditor } from "@/components/BotScriptEditor";
import { LocalizedText } from "@/components/LocalizedText";
import { SectionCard } from "@/components/SectionCard";

export default async function RobotsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const user = session.user as any; 
  // Allow access to Starter plan (Free), relying on backend limits
  // if (user.role !== "admin" && user.plan !== "pro") {
  //    redirect("/dashboard?upgrade=required");
  // }

  // Fetch summary to pass existing bots to components
  let summary = await fetchDashboardSummary();
  const { bots } = summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white"><LocalizedText id="botsTitle" fallback="Robot Studio" /></h1>
        <p className="text-slate-400">Develop and backtest high-frequency trading algorithms in Python.</p>
      </div>

      <SectionCard
        id="code-editor"
        title="Strategy Editor"
        description="Write your trading logic in Python. Use `data` dataframe to generate `buy`, `sell`, or `hold` signals."
      >
        <div className="h-[600px]">
           <BotScriptEditor bots={bots} />
        </div>
      </SectionCard>

      <SectionCard
        id="bots"
        title={<LocalizedText id="botsTitle" fallback="Fleet Management" />}
        description={
          <LocalizedText id="botsDescription" fallback="Deploy, monitor, and pause your active trading robots." />
        }
      >
        <BotManager initialBots={bots} userPlan={user.plan} isPro={user.role === "admin" || user.plan === "pro"} />
      </SectionCard>
    </div>
  );
}
