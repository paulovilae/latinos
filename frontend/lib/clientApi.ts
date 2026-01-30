"use client";

const PRIMARY_API = process.env.NEXT_PUBLIC_API_URL_PRIMARY || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SECONDARY_API = process.env.NEXT_PUBLIC_API_URL_SECONDARY || "";
const CF_CLIENT_ID = process.env.NEXT_PUBLIC_CF_ACCESS_CLIENT_ID || "";
const CF_CLIENT_SECRET = process.env.NEXT_PUBLIC_CF_ACCESS_CLIENT_SECRET || "";
const TEST_API_KEY = process.env.NEXT_PUBLIC_TEST_API_KEY || "prueba123%";
const DEMO_TOKEN = process.env.NEXT_PUBLIC_DEMO_TOKEN ?? "demo-admin-token";

export async function clientApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const tryFetch = async (baseUrl: string) => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${DEMO_TOKEN}`,
        "Content-Type": "application/json",
        "X-API-Key": TEST_API_KEY,
        ...(CF_CLIENT_ID ? { "CF-Access-Client-Id": CF_CLIENT_ID } : {}),
        ...(CF_CLIENT_SECRET ? { "CF-Access-Client-Secret": CF_CLIENT_SECRET } : {}),
        ...(init?.headers || {}),
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with ${response.status}`);
    }
    
    if (response.status === 204) return null as T;
    return (await response.json()) as T;
  };

  try {
    return await tryFetch(PRIMARY_API);
  } catch (err: any) {
    // If it's a network error (Connection Refused / Timeout) and we have a secondary
    if (SECONDARY_API && (err.name === "TypeError" || err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
      console.warn(`Primary API (${PRIMARY_API}) unreachable. Falling back to ${SECONDARY_API}...`);
      return await tryFetch(SECONDARY_API);
    }
    throw err;
  }
}
