import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// GET /api/brokers - List all brokers
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/brokers/");
}

// POST /api/brokers - Create new broker
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/brokers/");
}
