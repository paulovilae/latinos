import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchDashboardSummary } from "@/lib/api";
import { BillingClient } from "./BillingClient";

export const metadata = {
  title: "Facturación - Latinos Trading",
  description: "Gestiona tu suscripción y facturación",
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch subscription tier from dashboard summary
  let currentTier = "free";
  try {
    const summary = await fetchDashboardSummary();
    currentTier = summary.subscription_tier || "free";
  } catch (error) {
    console.error("Failed to fetch subscription status:", error);
  }

  return (
    <BillingClient 
      currentTier={currentTier} 
      userEmail={session.user.email || ""}
    />
  );
}
