"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { loginSchema, type LoginInput } from "@/lib/validations";

const AUTH_MESSAGES: Record<string, string> = {
  sign_in_required: "Please sign in to access your dashboard.",
  verify_email: "Verify your email before accessing the dashboard. Check your inbox for the verification code.",
  Configuration: "Sign-in is temporarily unavailable. The site administrator must set NEXTAUTH_SECRET and NEXTAUTH_URL in Vercel.",
};

function LoginFormInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const authError = searchParams.get("error");
  const bannerMessage = authError ? AUTH_MESSAGES[authError] : null;
  const [redirecting, setRedirecting] = useState(false);
  const [authReady, setAuthReady] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setAuthReady(Boolean(data?.auth?.configured)))
      .catch(() => setAuthReady(false));
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const destination =
      callbackUrl.startsWith("/dashboard") ? callbackUrl : "/dashboard";

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    void fetch("/api/auth/track-session", { method: "POST", credentials: "include" });

    setRedirecting(true);
    window.location.href = destination;
  };

  return (
    <Card>
      <h1 className="font-display text-2xl font-bold text-text-primary text-center">Welcome Back</h1>
      <p className="text-sm text-text-secondary text-center mt-2">Sign in to your Blackrock Reserve account</p>

      {!authReady && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{AUTH_MESSAGES.Configuration}</p>
        </div>
      )}

      {bannerMessage && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-accent-gold/30 bg-accent-gold/10 p-3 text-sm text-accent-gold">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{bannerMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} placeholder="you@example.com" />
        <Input label="Password" type="password" {...register("password")} error={errors.password?.message} placeholder="••••••••" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input type="checkbox" {...register("remember")} className="rounded border-border accent-accent-gold" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-sm text-accent-gold hover:text-accent-gold-light transition-colors shrink-0">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isSubmitting || redirecting} disabled={!authReady} className="w-full">
          {redirecting ? "Opening dashboard…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent-gold hover:text-accent-gold-light transition-colors">Open Account</Link>
      </p>
    </Card>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
      <LoginFormInner />
    </Suspense>
  );
}
