"use server";

import { apiFetch } from "@/lib/api";

export async function actionCreateCheckoutSession(tier: string, billingPeriod: "monthly" | "annual" = "monthly") {
  return await apiFetch<{ checkout_url: string }>(`/api/billing/checkout?billing_period=${billingPeriod}&tier=${tier}`, { method: "POST" });
}

export async function actionCreatePortalSession() {
  return await apiFetch<{ portal_url: string }>("/api/billing/portal");
}

export async function actionGetMarketData(symbol: string, range: string = "1y", interval: string = "1d") {
  return await apiFetch<{ symbol: string; points: any[] }>(`/api/market/series/${symbol}?range=${range}&interval=${interval}`);
}

// --- Broker Webhooks ---

export interface BrokerConnection {
  id: number;
  user_id: number;
  broker_name: string;
  is_paper: boolean;
  status: string;
  created_at: string;
}

export async function actionGetBrokers() {
  return await apiFetch<BrokerConnection[]>("/api/brokers/", { method: "GET" });
}

export async function actionCreateBroker(data: { broker_name: string; api_key: string; api_secret: string; is_paper: boolean }) {
  return await apiFetch<BrokerConnection>("/api/brokers/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actionDeleteBroker(connectionId: number) {
  return await apiFetch(`/api/brokers/${connectionId}`, { method: "DELETE" });
}

export async function actionSubscribeToBot(botId: number) {
  return await apiFetch<import("@/lib/types").Bot>(`/api/bots/${botId}/subscribe`, { method: "POST" });
}

export async function actionUpdateBot(botId: number, data: any) {
  return await apiFetch<import("@/lib/types").Bot>(`/api/bots/${botId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
