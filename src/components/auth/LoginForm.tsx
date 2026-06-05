"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginForm() {
  const router = useRouter();
  const [showForgot, setShowForgot] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
  };

  return (
    <>
      <Card>
        <h1 className="font-display text-2xl font-bold text-text-primary text-center">Welcome Back</h1>
        <p className="text-sm text-text-secondary text-center mt-2">Sign in to your Platinum Crest account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <Input label="Email" type="email" {...register("email")} error={errors.email?.message} placeholder="you@example.com" />
          <Input label="Password" type="password" {...register("password")} error={errors.password?.message} placeholder="••••••••" />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input type="checkbox" {...register("remember")} className="rounded border-border accent-accent-gold" />
              Remember me
            </label>
            <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-accent-gold hover:text-accent-gold-light transition-colors">
              Forgot password?
            </button>
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">Sign In</Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent-gold hover:text-accent-gold-light transition-colors">Open Account</Link>
        </p>
      </Card>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="w-full max-w-md">
            <h2 className="text-lg font-semibold text-text-primary">Reset Password</h2>
            <p className="text-sm text-text-secondary mt-2">Enter your email and we&apos;ll send a reset link.</p>
            <form
              className="mt-4 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const email = (e.target as HTMLFormElement).email.value;
                await fetch("/api/auth/forgot-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                toast.success("Reset link sent! Check your email.");
                setShowForgot(false);
              }}
            >
              <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
              <div className="flex gap-3">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForgot(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">Send Link</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
