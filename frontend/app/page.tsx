import type { ReactNode } from "react";

import { BotManager } from "@/components/BotManager";
import { FormulaWorkbench } from "@/components/FormulaWorkbench";
import { LocalizedText } from "@/components/LocalizedText";
import { MetricCard } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { TagPill } from "@/components/TagPill";
import { UserManager } from "@/components/UserManager";
import { fetchDashboardSummary, fetchUsers } from "@/lib/api";
import type { DashboardSummary, User } from "@/lib/types";

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

export default async function Home() {
  const [summary, users]: [DashboardSummary, User[]] = await Promise.all([fetchDashboardSummary(), fetchUsers()]);
  const { metrics, bots, formulas, signals, backtests, plans, market_universe } = summary;
  const botNameMap = new Map(bots.map((bot) => [bot.id, bot.name]));

  return (
    <main className="space-y-6">
      <SectionGrid>
        <MetricCard label="Users" value={metrics.users} helper="with JWT + MFA" />
        <MetricCard label="Bots" value={metrics.bots} helper="draft/running/paused" />
        <MetricCard label="Formulas" value={metrics.formulas} helper="versioned strategies" />
        <MetricCard label="Signals" value={metrics.signals} helper="live + paper feed" />
      </SectionGrid>

      <SectionCard
        id="workbench"
        title={<LocalizedText id="strategyTitle" fallback="Strategy workbench" />}
        description={
          <LocalizedText
            id="strategyDescription"
            fallback="Edit formula payloads, pick symbols, and preview real prices + plots."
          />
        }
      >
        <FormulaWorkbench bots={bots} initialUniverse={market_universe} />
      </SectionCard>

      <SectionCard
        id="bots"
        title={<LocalizedText id="botsTitle" fallback="Bots" />}
        description={
          <LocalizedText id="botsDescription" fallback="CRUD + deploy/pause flows backed by FastAPI" />
        }
      >
        <BotManager initialBots={bots} />
      </SectionCard>

      <SectionCard
        id="users"
        title={<LocalizedText id="usersTitle" fallback="User management" />}
        description={<LocalizedText id="usersDescription" fallback="Invite teammates, toggle MFA, and prune accounts." />}
      >
        <UserManager initialUsers={users} />
      </SectionCard>

      <SectionGrid>
        <SectionCard
          id="formulas"
          title={<LocalizedText id="formulasTitle" fallback="Formulas" />}
          description={
            <LocalizedText
              id="formulasDescription"
              fallback="Versioned strategy payloads with publish toggles and history"
            />
          }
        >
          <div className="space-y-3">
            {formulas.map((formula) => (
              <div key={formula.id} className="flex items-center justify-between border border-slate-800 rounded-xl p-3">
                <div>
                  <p className="font-semibold">{botNameMap.get(formula.bot_id) ?? `Bot #${formula.bot_id}`}</p>
                  <p className="text-xs text-muted">
                    v{formula.version} created {formatDate(formula.created_at)}
                  </p>
                </div>
                <TagPill label={formula.published ? "published" : "draft"} tone={formula.published ? "success" : "warning"} />
              </div>
            ))}
            <p className="text-xs text-muted">
              API: POST /bots/:id/formulas, PUT /formulas/:id, POST /formulas/:id/publish, GET /formulas/:id/history
            </p>
          </div>
        </SectionCard>

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
          <ul className="space-y-3">
            {signals.map((signal) => (
              <li key={signal.id} className="border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{botNameMap.get(signal.bot_id) ?? `Bot #${signal.bot_id}`}</p>
                    <p className="text-xs text-muted">{JSON.stringify(signal.payload)}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <TagPill label={signal.type.toUpperCase()} tone={signal.type === "buy" ? "success" : "warning"} />
                    <TagPill label={signal.mode} />
                    <span className="text-xs text-muted">{formatDate(signal.emitted_at)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </SectionGrid>

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
                <span className="text-xs text-muted">Hit rate: {Math.round((b.results?.hit_rate ?? 0) * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">API: POST /backtests, GET /backtests/:id, /ws for live progress</p>
      </SectionCard>

      <SectionGrid>
        <SectionCard
          id="billing"
          title={<LocalizedText id="billingTitle" fallback="Billing" />}
          description={<LocalizedText id="billingDescription" fallback="Stripe checkout + customer portal links" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {plans.map((plan) => (
              <div key={plan.name} className="border border-slate-800 rounded-xl p-3 space-y-2">
                <p className="font-semibold">{plan.name}</p>
                <p className="text-sm text-muted">{plan.description}</p>
                <div>
                  <p className="text-2xl font-bold">{plan.price_monthly}</p>
                  <p className="text-xs text-muted">Billed monthly</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-emerald-300">{plan.price_yearly}</p>
                  <p className="text-xs text-muted">Annual commitment</p>
                </div>
                <p className="text-sm text-muted">{plan.limits}</p>
                <ul className="text-xs text-muted space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            Backend endpoints: /billing/checkout, /billing/portal, Stripe webhooks -&gt; Celery
          </p>
        </SectionCard>

        <SectionCard
          title={<LocalizedText id="operationsTitle" fallback="Operations" />}
          description={<LocalizedText id="operationsDescription" fallback="Health, metrics, audit log observability" />}
        >
          <ul className="text-sm text-muted space-y-1">
            <li>Health check: GET /admin/health</li>
            <li>Metrics: GET /admin/metrics (users/bots/formulas/backtests/signals)</li>
            <li>Audit logs: GET /admin/audit-logs</li>
          </ul>
        </SectionCard>
      </SectionGrid>
    </main>
  );
}
