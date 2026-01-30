import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// GET /api/users - List users (admin only on backend)
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/users");
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/users");
}
