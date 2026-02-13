"use client";

import { useLocale } from "@/components/LocalizationProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one number"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (values: SignUpValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || t("authError", "Registration failed"));
        setIsLoading(false);
        return;
      }

      // Success - redirect to signin
      router.push("/auth/signin?registered=true");
    } catch (err) {
      setError(t("authError", "Something went wrong"));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">{t("nameLabel", "Name")}</label>
          <input
            {...register("name")}
            type="text"
            className={`w-full bg-slate-800/50 border ${errors.name ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500`}
            placeholder="Your name"
          />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">{t("emailLabel", "Email")}</label>
          <input
            {...register("email")}
            type="email"
            className={`w-full bg-slate-800/50 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500`}
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">{t("passwordLabel", "Password")}</label>
          <input
            {...register("password")}
            type="password"
            className={`w-full bg-slate-800/50 border ${errors.password ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-500`}
            placeholder="••••••••"
          />
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
          {!errors.password && <p className="text-xs text-slate-500 mt-1">{t("passwordRequirements", "Min 8 chars, one uppercase, one number")}</p>}
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
          {isLoading ? t("creatingAccount", "Creating account...") : t("createAccountBtn", "Create Account")}
        </button>
      </form>

      <div className="text-center text-sm text-slate-400">
        {t("alreadyHaveAccount", "Already have an account?")}{" "}
        <Link href="/auth/signin" className="text-emerald-400 hover:text-emerald-300 font-medium">
          {t("signInLink", "Sign in")}
        </Link>
      </div>
    </div>
  );
}
