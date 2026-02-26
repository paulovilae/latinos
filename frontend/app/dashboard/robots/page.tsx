import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { BeanRoastery } from "@/components/dashboard/BeanRoastery";

interface CanvasBot {
  dify_app_id: string;
  name: string;
  description: string;
  mode: string;
  status: string;
  is_wasm: boolean;
  wasm_size_bytes: number | null;
  latinos_bot_id: number | null;
  tags: string[];
  canvas_url: string;
  created_at: string;
  updated_at: string;
}

export default async function RobotsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user?.role !== "admin") {
    redirect("/dashboard");
  }

  let canvasBots: CanvasBot[] = [];
  try {
    canvasBots = await apiFetch<CanvasBot[]>("/api/bots/canvas");
  } catch (e) {
    console.error("Failed to fetch canvas bots:", e);
  }

  // Convert Canvas bots to Bot format for BeanRoastery
  const bots = canvasBots.map((cb) => ({
    id: cb.latinos_bot_id || 0,
    name: cb.name,
    description: cb.description,
    status: cb.status,
    owner_id: 0,
    tags: cb.tags,
    is_wasm: cb.is_wasm,
    wasm_size_bytes: cb.wasm_size_bytes,
    dify_app_id: cb.dify_app_id,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          🤖 Robot Studio
          <span className="text-sm font-normal text-emerald-400 font-mono">
            powered by Canvas
          </span>
        </h1>
        <p className="text-slate-400">
          Strategies from Dify Canvas — compile to WASM and deploy to the trade
          engine.
        </p>
      </div>
      <BeanRoastery bots={bots} />
    </div>
  );
}
