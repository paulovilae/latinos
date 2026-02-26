import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Bot } from "@/lib/types";
import { BeanRoastery } from "@/components/dashboard/BeanRoastery";

export default async function RobotsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user?.role !== "admin") {
    redirect("/dashboard");
  }

  let bots: Bot[] = [];
  try {
    bots = await apiFetch<Bot[]>("/api/bots/");
  } catch (e) {
    console.error("Failed to fetch bots:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          🤖 Robot Studio
          <span className="text-sm font-normal text-slate-500 font-mono">
            Strategy Lab
          </span>
        </h1>
        <p className="text-slate-400">
          Trading strategies — design in Dify, compile to WASM, deploy to the
          trade engine.
        </p>
      </div>
      <BeanRoastery bots={bots} />
    </div>
  );
}
