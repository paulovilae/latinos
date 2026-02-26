import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BeanRoastery } from "@/components/dashboard/BeanRoastery";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

async function fetchBots(token: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/bots/`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.error("Failed to fetch bots:", e);
  }
  return [];
}

export default async function RobotsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const bots = await fetchBots((session as any).accessToken || "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          ☕ Bean Roastery
          <span className="text-sm font-normal text-slate-500 font-mono">
            Strategy Lab
          </span>
        </h1>
        <p className="text-slate-400">
          Compiled WASM trading strategies — design in Dify, roast here, deploy
          to the trade engine.
        </p>
      </div>
      <BeanRoastery bots={bots} />
    </div>
  );
}
