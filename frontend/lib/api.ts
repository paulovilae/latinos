import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { DashboardSummary, Formula, User } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await getServerSession(authOptions);
  const token = (session?.user as any)?.accessToken;

  // Headers setup
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (process.env.NEXT_PUBLIC_DEMO_TOKEN) {
      // Fallback for development if needed, but ideally we force login
      headers["Authorization"] = `Bearer ${process.env.NEXT_PUBLIC_DEMO_TOKEN}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Handle 401 explicitly?
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  if (response.status === 204) {
    return null as T;
  }
  return (await response.json()) as T;
}

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}

export function fetchBotFormulas(botId: number): Promise<Formula[]> {
  return apiFetch<Formula[]>(`/bots/${botId}/formulas`);
}


// Stripe functions moved to actions.ts for Server Actions support

export function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/users");
}

export interface MarketDataResponse {
  symbol: string;
  points: { timestamp: string; close: number }[];
}

export function fetchMarketData(symbol: string): Promise<MarketDataResponse> {
  return apiFetch<MarketDataResponse>(`/market/series/${symbol}?range=1y&interval=1d`);
}
