"use server";

import { apiFetch } from "@/lib/api";

export async function actionCreateCheckoutSession(billingPeriod: "monthly" | "annual" = "monthly") {
  return await apiFetch<{ checkout_url: string }>(`/api/billing/checkout?billing_period=${billingPeriod}`, { method: "POST" });
}

export async function actionCreatePortalSession() {
  return await apiFetch<{ portal_url: string }>("/api/billing/portal");
}

export async function actionGetMarketData(symbol: string) {
  return await apiFetch<{ symbol: string; points: any[] }>(`/api/market/series/${symbol}?range=1y&interval=1d`);
}
