import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// PUT /api/bots/:id - Update bot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/bots/${id}`);
}

// DELETE /api/bots/:id - Delete bot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/bots/${id}`);
}
