"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plan } from "@/lib/types";
import { actionCreateCheckoutSession, actionCreatePortalSession } from "@/lib/actions";

export function BillingPlans({ plans, currentTier = "free", mockPortalActive }: { plans: Plan[], currentTier?: string, mockPortalActive?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const router = useRouter();

  useEffect(() => {
    if (mockPortalActive) {
        alert("Mock Portal: You are in development mode.");
        router.replace("/dashboard");
    }
  }, [mockPortalActive, router]);

  const handleUpgrade = (tier: string) => {
    startTransition(async () => {
      try {
        const { checkout_url } = await actionCreateCheckoutSession(tier, billingPeriod);
        if (checkout_url) window.location.href = checkout_url;
      } catch (err) {
        console.error("Checkout failed", err);
        alert("Checkout failed. Check console.");
      }
    });
  };

  const handlePortal = () => {
    startTransition(async () => {
      try {
        const { portal_url } = await actionCreatePortalSession();
        if (portal_url) window.location.href = portal_url;
      } catch (err) {
        console.error("Portal failed", err);
        alert("Portal failed (Are you a subscriber?). Check console.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-800/50 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billingPeriod === "monthly" 
                ? "bg-emerald-600 text-white" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billingPeriod === "annual" 
                ? "bg-emerald-600 text-white" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Annual <span className="text-xs opacity-70">(Save 17%)</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.name.toLowerCase() === currentTier.toLowerCase();
          const displayPrice = billingPeriod === "annual" ? plan.price_yearly : plan.price_monthly;
          
          return (
            <div key={plan.name} className={`border rounded-xl p-3 space-y-2 flex flex-col ${isCurrentPlan ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-800"}`}>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                    <p className="font-semibold">{plan.name}</p>
                    {isCurrentPlan && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">CURRENT</span>}
                </div>
                <p className="text-sm text-muted">{plan.description}</p>
                <div className="my-2">
                  <p className="text-2xl font-bold">{displayPrice}</p>
                  <p className="text-xs text-muted">
                    {billingPeriod === "annual" ? "Billed annually" : "Billed monthly"}
                  </p>
                </div>
                 <p className="text-sm text-muted mt-2">{plan.limits}</p>
                 <ul className="text-xs text-muted space-y-1 mt-2">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-800">
                 {isCurrentPlan ? (
                     <button disabled className="w-full bg-slate-800 text-slate-400 rounded-lg py-2 text-sm font-medium cursor-not-allowed border border-transparent">
                         Current Plan
                     </button>
                 ) : (
                     <button
                        onClick={() => handleUpgrade(plan.name.toLowerCase())}
                        disabled={isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
                     >
                        {isPending ? "Loading..." : `Upgrade to ${plan.name} (${billingPeriod})`}
                     </button>
                 )}
              </div>
            </div>
          );
        })}
        
        <div className="col-span-full mt-4 flex justify-center">
           <button onClick={handlePortal} disabled={isPending} className="text-sm text-blue-400 hover:underline">
               Manage Subscription (Billing Portal)
           </button>
        </div>
      </div>
    </div>
  );
}
