import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// POST /api/bots/:id/:action - Start/Stop/Pause bot
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  return proxyToBackend(request, `/api/bots/${params.id}/${params.action}`);
}
