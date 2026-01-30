import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// POST /api/signals/backtest - Run backtest
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/signals/backtest");
}
