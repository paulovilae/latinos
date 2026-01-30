import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// POST /api/backtests - Create backtest
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/backtests");
}
