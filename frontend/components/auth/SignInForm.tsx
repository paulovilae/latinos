"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { useLocale } from "@/components/LocalizationProvider";

export function SignInForm() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError(t("invalidCredentials", "Invalid email or password"));
        setIsLoading(false);
      } else {
        // Redirect handled by router or full page reload
        window.location.href = callbackUrl;
      }
    } catch (err) {
       setError(t("authError", "Something went wrong"));
       setIsLoading(false);
    }
  };

  const handleGoogle = () => {
      signIn("google", { callbackUrl });
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">{t("emailLabel", "Email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">{t("passwordLabel", "Password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
            placeholder="••••••••"
            required
          />
        </div>
        
        {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
            </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
        >
          {isLoading ? t("signingIn", "Signing in...") : t("signInEmailBtn", "Sign in with Email")}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#0b1224] text-slate-500">{t("orContinue", "Or continue with")}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
        Google
      </button>

      <button
        type="button"
        onClick={() => {
          setEmail("demo@latinos.trade");
          setPassword("demo123");
          // Auto-submit
          const form = document.querySelector('form');
          if (form) form.requestSubmit();
        }}
        className="w-full bg-cyan-600 hover:bg-cyan-500 border border-cyan-500/30 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        {t("demoLogin", "🚀 Demo Login (No Google Required)")}
      </button>

      <div className="text-center text-sm text-slate-400 pt-2">
        {t("noAccount", "Don't have an account?")}{" "}
        <a href="/auth/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">
          {t("createAccountLink", "Create account")}
        </a>
      </div>
    </div>
  );
}
