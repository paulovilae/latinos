"use server";

import { apiFetch } from "@/lib/api";

export async function actionCreateCheckoutSession() {
  return await apiFetch<{ checkout_url: string }>("/billing/checkout", { method: "POST" });
}

export async function actionCreatePortalSession() {
  return await apiFetch<{ portal_url: string }>("/billing/portal");
}

export async function actionGetMarketData(symbol: string) {
  return await apiFetch<{ symbol: string; points: any[] }>(`/market/series/${symbol}?range=1y&interval=1d`);
}
