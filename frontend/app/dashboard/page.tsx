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
import { DashboardChartWrapper } from "./DashboardChartWrapper";
import { SignalFeed } from "@/components/signals/SignalFeed";

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

export default async function DashboardPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
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
        <MetricCard label="Active Signals" value={metrics.signals} helper="last 24h" />
        <MetricCard label="Market Data" value={summary.market_universe.length} helper="tracked symbols" />
        <MetricCard label="Formulas" value={metrics.formulas} helper="available strategies" />
        <MetricCard label="Backtests" value={metrics.backtests} helper="completed runs" />
      </SectionGrid>

      {/* Main Chart Section - Loads asynchronously */}
      <SectionCard 
        id="chart" 
        title={<LocalizedText id="chartTitle" fallback="Market Overview" />}
        description={<LocalizedText id="chartDesc" fallback="Real-time price feed for BTC-USD" />}
      >
         <Suspense fallback={
           <div className="h-80 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-800 animate-pulse">
             <div className="text-center text-slate-500">
               <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
               <p className="text-sm">Loading market data...</p>
             </div>
           </div>
         }>
           <DashboardChartWrapper signals={signals} />
         </Suspense>
      </SectionCard>

      <SectionGrid>
        <SectionCard
          id="signals"
          title={<LocalizedText id="signalsTitle" fallback="Signals" />}
          description={
            <LocalizedText
              id="signalsDescription"
              fallback="Websocket-friendly feed for buy/sell/info events with delivery state"
            />
          }
        >
          <SignalFeed initialSignals={signals} botNameMap={botNameMap} />
        </SectionCard>

         <SectionCard
          id="backtests"
          title={<LocalizedText id="backtestsTitle" fallback="Backtests" />}
          description={
            <LocalizedText
              id="backtestsDescription"
              fallback="Celery workers process submissions; results stream back to dashboard"
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {backtests.map((b) => (
              <div key={b.id} className="border border-slate-800 rounded-xl p-4 space-y-1">
                <p className="font-semibold">{botNameMap.get(b.bot_id) ?? `Bot #${b.bot_id}`}</p>
                <p className="text-xs text-muted">Range: {b.range}</p>
                <div className="flex items-center gap-2">
                  <TagPill label={b.status} tone={b.status === "completed" ? "success" : "warning"} />
                  <span className="text-xs text-muted">PnL: {`${b.results?.pnl ?? "N/A"}`}</span>
                  <span className="text-xs text-muted">Hit rate: {Math.round(((b.results?.hit_rate as number) ?? 0) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </SectionGrid>

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
