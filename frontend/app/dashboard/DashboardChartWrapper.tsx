import dynamic from "next/dynamic";
import { fetchMarketData } from "@/lib/api";
import { Signal } from "@/lib/types";

const InteractiveChart = dynamic(() => import("@/components/InteractiveChart").then(mod => mod.InteractiveChart), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-slate-900/50 animate-pulse rounded-xl" />
});

export async function DashboardChartWrapper({ signals }: { signals?: Signal[] }) {
  // Default to BTC-USD for dashboard overview
  let chartData;
  try {
    chartData = await fetchMarketData("BTC-USD");
  } catch (e) {
      console.error("Failed to fetch chart data", e)
      chartData = { symbol: "BTC-USD", points: [] }
  }

  return <InteractiveChart initialData={chartData} signals={signals} />;
}
