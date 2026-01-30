"use client";

import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { useLocale } from "@/components/LocalizationProvider";

export default function SignInPage() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-[#0b1224] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 mb-2">
                    Latinos Trading
                </h1>
                <p className="text-slate-400">{t("signInTitle", "Sign in to your account")}</p>
            </div>

            <Suspense fallback={<div className="text-center text-slate-500">{t("loading", "Loading...")}</div>}>
                <SignInForm />
            </Suspense>

            <div className="mt-6 text-center text-sm text-slate-500">
                <p>{t("welcomeBack", "Welcome back, Trader.")}</p>
            </div>
        </div>
    </div>
  );
}
