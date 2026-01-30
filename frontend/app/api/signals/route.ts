import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// GET /api/signals - List all signals
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/signals/");
}

// POST /api/signals - Create new signal
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/signals/");
}
