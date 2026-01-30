import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// GET /api/bots - List all bots
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/bots/");
}

// POST /api/bots - Create new bot
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/bots/");
}
