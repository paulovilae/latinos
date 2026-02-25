import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// DELETE /api/brokers/[id] - Delete a broker connection
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(request, `/api/brokers/${id}`);
}
