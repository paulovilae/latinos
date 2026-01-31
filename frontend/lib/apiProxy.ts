import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL_PRIMARY || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Server-side Cloudflare tokens (no NEXT_PUBLIC_ prefix)
const CF_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
const CF_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || "";

/**
 * Shared API proxy helper - proxies requests to FastAPI backend with proper auth
 * Follows Builder pattern: all client requests go through Next.js API routes
 */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  options: {
    method?: string;
    requireAuth?: boolean;
  } = {}
) {
  const { method = request.method, requireAuth = true } = options;

  try {
    // Get session for authentication
    const session = requireAuth ? await getServerSession(authOptions) : null;
    
    if (requireAuth && !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = session ? (session.user as any)?.accessToken : null;

    // Prepare headers with Cloudflare Access credentials
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add Cloudflare Access headers (server-side only, never exposed to client)
    if (CF_CLIENT_ID) headers["CF-Access-Client-Id"] = CF_CLIENT_ID;
    if (CF_CLIENT_SECRET) headers["CF-Access-Client-Secret"] = CF_CLIENT_SECRET;
    
    // Add Bearer token if authenticated (or using demo fallback)
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Get request body if present
    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
      try {
        const json = await request.json();
        body = JSON.stringify(json);
      } catch (e) {
        // No body or invalid JSON
      }
    }

    // Proxy request to backend
    const response = await fetch(`${API_URL}${backendPath}`, {
      method,
      headers,
      body,
    });

    // Handle non-JSON responses (e.g., 204 No Content)
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // Get response data
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return proxied response
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
