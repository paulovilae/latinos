import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LocalizedText } from "@/components/LocalizedText";
import { SignalEditor } from "@/components/signals/SignalEditor";
import { SectionCard } from "@/components/SectionCard";

export default async function StrategiesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white"><LocalizedText id="navSignalStudio" fallback="Signal Studio" /></h1>
        <p className="text-slate-400">
          <LocalizedText id="editorDescription" fallback="Create reusable trading signals using formulas or python." />
        </p>
      </div>

      <SectionCard
        id="signal-editor"
        title={<LocalizedText id="editorTitle" fallback="Signal Library" />}
        description={<LocalizedText id="editorDescription" fallback="Manage your trading signals." />}
      >
        <SignalEditor />
      </SectionCard>
    </div>
  );
}
