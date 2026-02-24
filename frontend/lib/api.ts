import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { DashboardSummary, Formula, User } from "./types";

const PRIMARY_API = process.env.NEXT_PUBLIC_API_URL_PRIMARY || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const SECONDARY_API = process.env.NEXT_PUBLIC_API_URL_SECONDARY || "";

const CF_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
const CF_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || "";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;

  const tryFetch = async (baseUrl: string) => {
    // Headers setup
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(CF_CLIENT_ID ? { "CF-Access-Client-Id": CF_CLIENT_ID } : {}),
      ...(CF_CLIENT_SECRET ? { "CF-Access-Client-Secret": CF_CLIENT_SECRET } : {}),
      ...(init?.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else if (process.env.NEXT_PUBLIC_DEMO_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_DEMO_TOKEN}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }
    if (response.status === 204) return null as T;
    
    const textBody = await response.text();
    try {
        return JSON.parse(textBody) as T;
    } catch (parseErr) {
        console.error(`Failed to parse API response as JSON from ${path}. Response:`, textBody.substring(0, 200));
        throw new Error(`API returned invalid JSON (Status: ${response.status}). Response excerpt: ${textBody.substring(0, 100)}...`);
    }
  };

  try {
    return await tryFetch(PRIMARY_API);
  } catch (err: any) {
    if (SECONDARY_API && (err.name === "TypeError" || err.message.includes("fetch") || err.message.includes("NetworkError"))) {
      console.warn(`Primary Server-side API (${PRIMARY_API}) unreachable. Falling back to ${SECONDARY_API}...`);
      return await tryFetch(SECONDARY_API);
    }
    throw err;
  }
}

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/api/dashboard/summary");
}

export function fetchBotFormulas(botId: number): Promise<Formula[]> {
  return apiFetch<Formula[]>(`/api/bots/${botId}/formulas`);
}


// Stripe functions moved to actions.ts for Server Actions support

export function fetchUsers(init?: RequestInit): Promise<User[]> {
  return apiFetch<User[]>("/api/users", init);
}

export interface MarketDataResponse {
  symbol: string;
  points: { timestamp: string; close: number }[];
}

export function fetchMarketData(symbol: string): Promise<MarketDataResponse> {
  return apiFetch<MarketDataResponse>(`/api/market/series/${symbol}?range=1y&interval=1d`);
}
