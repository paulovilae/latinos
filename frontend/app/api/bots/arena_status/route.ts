import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// GET /api/bots/arena_status - Live progress of Arena recalculation
export async function GET(request: NextRequest) {
  return proxyToBackend(request, `/api/bots/arena_status`);
}
