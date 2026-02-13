import { fetchMarketData } from "@/lib/api";
import { Signal } from "@/lib/types";
import { InteractiveChart } from "@/components/InteractiveChart";

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
