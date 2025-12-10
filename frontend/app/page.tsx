import type { ReactNode } from "react";

import { MetricCard } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { TagPill } from "@/components/TagPill";
import { backtests, bots, formulas, metrics, plans, signals } from "@/lib/sampleData";

function SectionGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

export default function Home() {
  return (
    <main className="space-y-6">
      <SectionGrid>
        <MetricCard label="Users" value={metrics.users} helper="with JWT + MFA" />
        <MetricCard label="Bots" value={metrics.bots} helper="draft/running/paused" />
        <MetricCard label="Formulas" value={metrics.formulas} helper="versioned strategies" />
        <MetricCard label="Signals" value={metrics.signals} helper="live + paper feed" />
      </SectionGrid>

      <SectionCard id="bots" title="Bots" description="CRUD + deploy/pause flows backed by FastAPI">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted">
              <tr className="text-left">
                <th className="py-2">Name</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {bots.map((bot) => (
                <tr key={bot.id} className="hover:bg-slate-900/40">
                  <td className="py-3 font-semibold">{bot.name}</td>
                  <td>
                    <TagPill
                      label={bot.status}
                      tone={bot.status === "running" ? "success" : bot.status === "paused" ? "warning" : "neutral"}
                    />
                  </td>
                  <td className="space-x-2">
                    {bot.tags.map((tag) => (
                      <TagPill key={tag} label={tag} />
                    ))}
                  </td>
                  <td>{bot.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionGrid>
        <SectionCard
          id="formulas"
          title="Formulas"
          description="Versioned strategy payloads with publish toggles and history"
        >
          <div className="space-y-3">
            {formulas.map((formula) => (
              <div key={formula.id} className="flex items-center justify-between border border-slate-800 rounded-xl p-3">
                <div>
                  <p className="font-semibold">{formula.bot}</p>
                  <p className="text-xs text-muted">v{formula.version} created {formula.created}</p>
                </div>
                <TagPill label={formula.published ? "published" : "draft"} tone={formula.published ? "success" : "warning"} />
              </div>
            ))}
            <p className="text-xs text-muted">API: POST /bots/:id/formulas, POST /formulas/:id/publish, GET /formulas/:id/history</p>
          </div>
        </SectionCard>

        <SectionCard
          id="signals"
          title="Signals"
          description="Websocket-friendly feed for buy/sell/info events with delivery state"
        >
          <ul className="space-y-3">
            {signals.map((signal) => (
              <li key={signal.id} className="border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{signal.bot}</p>
                    <p className="text-xs text-muted">{signal.payload}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <TagPill label={signal.type.toUpperCase()} tone={signal.type === "buy" ? "success" : "warning"} />
                    <TagPill label={signal.mode} />
                    <span className="text-xs text-muted">{signal.emitted}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </SectionGrid>

      <SectionCard
        id="backtests"
        title="Backtests"
        description="Celery workers process submissions; results stream back to dashboard"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {backtests.map((b) => (
            <div key={b.id} className="border border-slate-800 rounded-xl p-4 space-y-1">
              <p className="font-semibold">{b.bot}</p>
              <p className="text-xs text-muted">Range: {b.range}</p>
              <div className="flex items-center gap-2">
                <TagPill label={b.status} tone={b.status === "completed" ? "success" : "warning"} />
                <span className="text-xs text-muted">PnL: {b.pnl}%</span>
                <span className="text-xs text-muted">Hit rate: {Math.round(b.hitRate * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">API: POST /backtests, GET /backtests/:id, /ws for live progress</p>
      </SectionCard>

      <SectionGrid>
        <SectionCard id="billing" title="Billing" description="Stripe checkout + customer portal links">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plans.map((plan) => (
              <div key={plan.name} className="border border-slate-800 rounded-xl p-3 space-y-2">
                <p className="font-semibold">{plan.name}</p>
                <p className="text-2xl">{plan.price}</p>
                <p className="text-sm text-muted">{plan.limits}</p>
                <ul className="text-xs text-muted space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">Backend endpoints: /billing/checkout, /billing/portal, Stripe webhooks -> Celery</p>
        </SectionCard>

        <SectionCard title="Operations" description="Health, metrics, audit log observability">
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
