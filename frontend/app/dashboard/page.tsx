import { Suspense, type ReactNode } from "react";
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { fetchDashboardSummary } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
import { MetricCard } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { TagPill } from "@/components/TagPill";
import { LocalizedText } from "@/components/LocalizedText";
import { BillingPlans } from "@/components/BillingPlans";

import { SignalFeed } from "@/components/signals/SignalFeed";
import { LiveTradingDashboardWrapper } from "@/components/dashboard/LiveTradingDashboardWrapper";

function SectionGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().split("T")[0];
}

export default async function DashboardPage(props: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const searchParams = await props.searchParams;
  let summary: DashboardSummary;

  try {
    summary = await fetchDashboardSummary();
  } catch (error: any) {
    console.error("Dashboard fetch failed:", error);
    redirect("/auth/signin");
  }

  const { metrics, bots, formulas, signals, backtests, plans } = summary;
  const botNameMap = new Map(bots.map((bot) => [bot.id, bot.name]));

  return (
    <main className="space-y-6">
      <SectionGrid>
        <MetricCard label="Active Strategies" value={metrics.signals} helper="last 24h" />
        <MetricCard label="Market Data" value={summary.market_universe.length} helper="tracked symbols" />
        <MetricCard label="Formulas" value={metrics.formulas} helper="available strategies" />
        <MetricCard label="Backtests" value={metrics.backtests} helper="completed runs" />
      </SectionGrid>



      {/* Live Trading Section */}
      <SectionCard
        id="live-trading"
        title={<LocalizedText id="signalsTitle" fallback="Live Trading" />}
        description={
            <LocalizedText
              id="signalsDescription"
              fallback="Monitor your active trading robots and real-time performance."
            />
        }
      >
          <div className="mt-4">
             {/* Pass real data to the client component */}
             <Suspense fallback={<div className="h-64 animate-pulse bg-slate-900 rounded-xl"></div>}>
                <LiveTradingDashboardWrapper initialSummary={summary} />
             </Suspense>
          </div>
      </SectionCard>

      <SectionGrid>
        <SectionCard
          id="billing"
          title={<LocalizedText id="billingTitle" fallback="Billing" />}
          description={<LocalizedText id="billingDescription" fallback="Stripe checkout + customer portal links" />}
        >
          <div className="mt-2">
             <BillingPlans 
                plans={plans} 
                currentTier={summary.subscription_tier} 
                mockPortalActive={searchParams?.portal === "mock_session_active"}
             />
          </div>
        </SectionCard>

        <SectionCard
          title={<LocalizedText id="operationsTitle" fallback="Operations" />}
          description={<LocalizedText id="operationsDescription" fallback="Health, metrics, audit log observability" />}
        >
           <div className="space-y-4">
             <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
               <p className="text-emerald-400 font-semibold mb-1">System Status: Operational</p>
               <p className="text-xs text-slate-400">All systems functioning normally.</p>
             </div>
             <ul className="text-sm text-muted space-y-1">
               <li>Market Data: Connected (Yahoo Finance)</li>
               <li>Signal Engine: Active</li>
               <li>Worker Nodes: 3/3 Online</li>
             </ul>
           </div>
        </SectionCard>
      </SectionGrid>
    </main>
  );
}
