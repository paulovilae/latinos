import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// POST /api/signals/scan - Scan multiple signals
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/signals/scan");
}
