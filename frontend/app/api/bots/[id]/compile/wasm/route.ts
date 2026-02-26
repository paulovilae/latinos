import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// POST /api/bots/:id/compile/wasm - Compile bot strategy to WASM
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/bots/${id}/compile/wasm`);
}
