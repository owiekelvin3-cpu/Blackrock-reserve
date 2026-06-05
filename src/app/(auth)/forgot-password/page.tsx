"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { forgotPasswordSchema } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSent(true);
      toast.success("Reset link sent!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <Card>
      {sent ? (
        <div className="text-center">
          <CheckCircle size={48} className="mx-auto text-accent-green mb-4" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Check Your Email</h1>
          <p className="text-sm text-text-secondary mt-2">
            We&apos;ve sent a password reset link to your email address.
          </p>
          <Link href="/login" className="inline-block mt-6">
            <Button variant="outline">Back to Sign In</Button>
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold text-text-primary text-center">Forgot Password</h1>
          <p className="text-sm text-text-secondary text-center mt-2">
            Enter your email to receive a reset link
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Input label="Email" type="email" {...register("email")} error={errors.email?.message} placeholder="you@example.com" />
            <Button type="submit" isLoading={isSubmitting} className="w-full">Send Reset Link</Button>
          </form>
          <p className="mt-6 text-center text-sm text-text-secondary">
            <Link href="/login" className="text-accent-gold hover:text-accent-gold-light transition-colors">Back to Sign In</Link>
          </p>
        </>
      )}
    </Card>
  );
}
