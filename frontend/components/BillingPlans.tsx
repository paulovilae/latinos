"use client";

import { useTransition } from "react";
import { Plan } from "@/lib/types";
import { actionCreateCheckoutSession, actionCreatePortalSession } from "@/lib/actions";

export function BillingPlans({ plans }: { plans: Plan[] }) {
  const [isPending, startTransition] = useTransition();

  const handleUpgrade = () => {
    startTransition(async () => {
      try {
        const { checkout_url } = await actionCreateCheckoutSession();
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {plans.map((plan) => (
        <div key={plan.name} className="border border-slate-800 rounded-xl p-3 space-y-2 flex flex-col">
          <div className="flex-1">
            <p className="font-semibold">{plan.name}</p>
            <p className="text-sm text-muted">{plan.description}</p>
            <div className="my-2">
              <p className="text-2xl font-bold">{plan.price_monthly}</p>
              <p className="text-xs text-muted">Billed monthly</p>
            </div>
            {plan.name === "Pro" && plan.price_yearly !== "Contact sales" && (
               <div>
                  <p className="text-lg font-semibold text-emerald-300">{plan.price_yearly}</p>
                  <p className="text-xs text-muted">Annual commitment</p>
               </div>
            )}
             <p className="text-sm text-muted mt-2">{plan.limits}</p>
             <ul className="text-xs text-muted space-y-1 mt-2">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-800">
             {plan.name === "Pro" ? (
                 <button
                    onClick={handleUpgrade}
                    disabled={isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
                 >
                    {isPending ? "Loading..." : "Upgrade to Pro"}
                 </button>
             ) : plan.name === "Starter" ? (
                 <button disabled className="w-full bg-slate-800 text-slate-400 rounded-lg py-2 text-sm font-medium cursor-not-allowed">
                     Current Plan
                 </button>
             ) : (
                 <button className="w-full border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg py-2 text-sm font-medium transition-colors">
                     Contact Sales
                 </button>
             )}
          </div>
        </div>
      ))}
      
      <div className="col-span-full mt-4 flex justify-center">
         <button onClick={handlePortal} disabled={isPending} className="text-sm text-blue-400 hover:underline">
             Manage Subscription (Billing Portal)
         </button>
      </div>
    </div>
  );
}
