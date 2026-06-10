"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useValidationSchemas } from "@/lib/i18n/use-validation-schemas";
import { useI18n } from "@/components/providers/I18nProvider";
import type { z } from "zod";

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const schemas = useValidationSchemas();
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  type ResetForm = z.infer<typeof schemas.resetPasswordSchema>;

  const emailForm = useForm({ resolver: zodResolver(schemas.forgotPasswordSchema) });
  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(schemas.resetPasswordSchema),
    defaultValues: { email: "", otp: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const sendCode = async (targetEmail: string) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t("forgotPassword.sendFailed"));
  };

  const onEmailSubmit = async (data: { email: string }) => {
    try {
      await sendCode(data.email);
      setEmail(data.email);
      resetForm.setValue("email", data.email);
      setStep("reset");
      setResendCooldown(RESEND_COOLDOWN);
      toast.success(t("forgotPassword.checkEmail"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  const handleResend = useCallback(async () => {
    if (!email || resendCooldown > 0) return;
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("forgotPassword.resendFailed"));
      setResendCooldown(RESEND_COOLDOWN);
      toast.success(t("forgotPassword.newCodeSent"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("forgotPassword.resendFailed"));
    }
  }, [email, resendCooldown, t]);

  const onResetSubmit = async (data: ResetForm) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("forgotPassword.resetFailed"));
      setStep("done");
      toast.success(t("forgotPassword.passwordUpdated"));
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("forgotPassword.resetFailed"));
    }
  };

  if (step === "done") {
    return (
      <Card>
        <div className="text-center">
          <CheckCircle size={48} className="mx-auto text-accent-green mb-4" />
          <h1 className="font-display text-2xl font-bold text-text-primary">{t("forgotPassword.doneTitle")}</h1>
          <p className="text-sm text-text-secondary mt-2">{t("forgotPassword.doneSubtitle")}</p>
        </div>
      </Card>
    );
  }

  if (step === "reset") {
    return (
      <Card>
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-accent-brand/15 border border-accent-brand/30 flex items-center justify-center">
            <Mail size={28} className="text-accent-brand" />
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary text-center">{t("forgotPassword.resetTitle")}</h1>
        <p className="text-sm text-text-secondary text-center mt-2">
          {t("forgotPassword.resetSubtitle", { email })}
        </p>
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="mt-8 space-y-4">
          <input type="hidden" {...resetForm.register("email")} />
          <Input
            label={t("forgotPassword.verificationCode")}
            {...resetForm.register("otp")}
            error={resetForm.formState.errors.otp?.message}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          <Input
            label={t("forgotPassword.newPassword")}
            type="password"
            {...resetForm.register("password")}
            error={resetForm.formState.errors.password?.message}
            placeholder="••••••••"
          />
          <Input
            label={t("forgotPassword.confirmPassword")}
            type="password"
            {...resetForm.register("confirmPassword")}
            error={resetForm.formState.errors.confirmPassword?.message}
            placeholder="••••••••"
          />
          <Button type="submit" isLoading={resetForm.formState.isSubmitting} className="w-full">
            {t("forgotPassword.updatePassword")}
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="w-full flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-accent-gold transition-colors disabled:opacity-50 py-2"
          >
            <RefreshCw size={14} />
            {resendCooldown > 0
              ? t("forgotPassword.resendCodeIn", { seconds: resendCooldown })
              : t("forgotPassword.resendCode")}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-text-secondary">
          <button type="button" onClick={() => setStep("email")} className="text-accent-gold hover:text-accent-gold-light">
            {t("forgotPassword.useDifferentEmail")}
          </button>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="font-display text-2xl font-bold text-text-primary text-center">{t("forgotPassword.title")}</h1>
      <p className="text-sm text-text-secondary text-center mt-2">{t("forgotPassword.subtitle")}</p>
      <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="mt-8 space-y-4">
        <Input
          label={t("auth.email")}
          type="email"
          {...emailForm.register("email")}
          error={emailForm.formState.errors.email?.message}
          placeholder="you@example.com"
        />
        <Button type="submit" isLoading={emailForm.formState.isSubmitting} className="w-full">
          {t("forgotPassword.sendCode")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/login" className="text-accent-gold hover:text-accent-gold-light transition-colors">
          {t("forgotPassword.backToSignIn")}
        </Link>
      </p>
    </Card>
  );
}
