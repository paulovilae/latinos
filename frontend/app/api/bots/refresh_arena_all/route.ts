import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// POST /api/bots/refresh_arena_all - Global matrix recalculation
export async function POST(request: NextRequest) {
  return proxyToBackend(request, `/api/bots/refresh_arena_all`);
}
