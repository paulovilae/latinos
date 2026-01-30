import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LocalizedText } from "@/components/LocalizedText";
import { SignalEditor } from "@/components/signals/SignalEditor";
import { SectionCard } from "@/components/SectionCard";

export default async function SignalsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white"><LocalizedText id="signalsTitle" fallback="Signal Library" /></h1>
        <p className="text-slate-400">
          <LocalizedText id="signalsDescription" fallback="Create reusable trading signals using formulas or python." />
        </p>
      </div>

      <SectionCard
        id="signal-editor"
        title="Signal Library"
        description="Manage your trading signals."
      >
        <SignalEditor />
      </SectionCard>
    </div>
  );
}
