import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

// PUT /api/users/:id - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToBackend(request, `/users/${params.id}`);
}

// DELETE /api/users/:id - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return proxyToBackend(request, `/users/${params.id}`);
}
