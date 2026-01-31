import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// GET /api/health - Health check (proxies to backend /health)
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/health", { requireAuth: false });
}
