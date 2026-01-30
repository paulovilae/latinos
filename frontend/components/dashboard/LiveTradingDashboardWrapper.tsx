"use client";

import dynamic from 'next/dynamic';

const LiveTradingDashboard = dynamic(
  () => import('@/components/dashboard/LiveTradingDashboard').then(mod => mod.LiveTradingDashboard),
  { ssr: false }
);

export function LiveTradingDashboardWrapper() {
  return <LiveTradingDashboard />;
}
