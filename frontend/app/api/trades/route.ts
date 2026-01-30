import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// POST /api/trades - Create trade
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/trades/");
}
