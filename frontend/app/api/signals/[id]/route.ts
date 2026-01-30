import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// DELETE /api/signals/:id - Delete signal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToBackend(request, `/api/signals/${params.id}`);
}

// PUT /api/signals/:id - Update signal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToBackend(request, `/api/signals/${params.id}`);
}
