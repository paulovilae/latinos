
import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy"; // Assuming helper exists based on other routes

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Forward to backend /api/signals/:id/test
  return proxyToBackend(request, `/api/signals/${id}/test`);
}
