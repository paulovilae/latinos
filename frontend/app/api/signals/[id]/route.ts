import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// DELETE /api/signals/:id - Delete signal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/signals/${id}`);
}

// PUT /api/signals/:id - Update signal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/signals/${id}`);
}
