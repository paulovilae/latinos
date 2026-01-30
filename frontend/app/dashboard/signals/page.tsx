import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LocalizedText } from "@/components/LocalizedText";
import { SignalStudio } from "@/components/signals/SignalStudio";

export default async function SignalsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white"><LocalizedText id="signalsTitle" fallback="Signal Studio" /></h1>
        <p className="text-slate-400">
          <LocalizedText id="signalsDescription" fallback="Build, stack, and backtest your trading signals." />
        </p>
      </div>

      <SignalStudio />
    </div>
  );
}
