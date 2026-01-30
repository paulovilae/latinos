import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function RobotsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Redirect to new unified studio
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">Robot Studio</h1>
        <p className="text-slate-400">
          Assemble signals into trading bots and backtest strategies.
        </p>
      </div>
      <StackBuilder />
    </div>
  );
}

import { StackBuilder } from "@/components/signals/StackBuilder";
