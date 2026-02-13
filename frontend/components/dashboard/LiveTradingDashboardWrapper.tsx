"use client";

import dynamic from 'next/dynamic';
import type { DashboardSummary } from "@/lib/types";

const LiveTradingDashboard = dynamic(
  () => import('@/components/dashboard/LiveTradingDashboard').then(mod => mod.LiveTradingDashboard),
  { ssr: false }
);

export function LiveTradingDashboardWrapper({ initialSummary }: { initialSummary?: DashboardSummary }) {
  return <LiveTradingDashboard initialSummary={initialSummary} />;
}
