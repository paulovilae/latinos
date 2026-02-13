import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// POST /api/bots/:id/:action - Start/Stop/Pause bot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id, action } = await params;
  return proxyToBackend(request, `/api/bots/${id}/${action}`);
}
