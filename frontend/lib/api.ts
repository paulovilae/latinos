import "server-only";

import { DashboardSummary, Formula, User } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DEMO_TOKEN = process.env.NEXT_PUBLIC_DEMO_TOKEN ?? "demo-admin-token";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${DEMO_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
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

export function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/users");
}
