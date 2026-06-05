"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload, Check } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  registerStep1Schema, registerStep2Schema,
  type RegisterStep1Input, type RegisterStep2Input,
} from "@/lib/validations";

type Step1Data = RegisterStep1Input;
type Step2Data = RegisterStep2Input;

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [kycFiles, setKycFiles] = useState<{ front?: string; back?: string }>({});
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const step1Form = useForm<Step1Data>({ resolver: zodResolver(registerStep1Schema) });
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: { accountType: "PERSONAL" },
  });

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2 = (data: Step2Data) => {
    setStep2Data(data);
    setStep(3);
  };

  const handleFileUpload = (side: "front" | "back", file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setKycFiles((prev) => ({ ...prev, [side]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    if (!step1Data || !step2Data) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...step1Data,
          ...step2Data,
          kycIdFront: kycFiles.front,
          kycIdBack: kycFiles.back,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setShowOtp(true);
      toast.success("Account created! Please verify your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!step1Data) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: step1Data.email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      toast.success("Email verified! You can now sign in.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (showOtp) {
    return (
      <Card>
        <h1 className="font-display text-2xl font-bold text-text-primary text-center">Verify Email</h1>
        <p className="text-sm text-text-secondary text-center mt-2">
          Enter the 6-digit code sent to {step1Data?.email}
        </p>
        <div className="mt-8 space-y-4">
          <Input
            label="Verification Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="000000"
            maxLength={6}
          />
          <Button onClick={handleVerifyOtp} isLoading={isLoading} className="w-full">Verify Email</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="font-display text-2xl font-bold text-text-primary text-center">Open Your Account</h1>
      <p className="text-sm text-text-secondary text-center mt-2">Join Platinum Crest Bank in 3 easy steps</p>

      <div className="mt-6 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= s ? "bg-accent-gold text-bg-primary" : "bg-bg-tertiary text-text-muted"
            }`}>
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-accent-gold" : "bg-bg-tertiary"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(handleStep1)} className="mt-8 space-y-4">
          <Input label="Full Name" {...step1Form.register("fullName")} error={step1Form.formState.errors.fullName?.message} />
          <Input label="Email" type="email" {...step1Form.register("email")} error={step1Form.formState.errors.email?.message} />
          <Input label="Phone" type="tel" {...step1Form.register("phone")} error={step1Form.formState.errors.phone?.message} />
          <Input label="Date of Birth" type="date" {...step1Form.register("dateOfBirth")} error={step1Form.formState.errors.dateOfBirth?.message} />
          <Button type="submit" className="w-full">Continue</Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit(handleStep2)} className="mt-8 space-y-4">
          <Input label="Password" type="password" {...step2Form.register("password")} error={step2Form.formState.errors.password?.message} />
          <Input label="Confirm Password" type="password" {...step2Form.register("confirmPassword")} error={step2Form.formState.errors.confirmPassword?.message} />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Account Type</label>
            <div className="flex gap-3">
              {(["PERSONAL", "BUSINESS"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => step2Form.setValue("accountType", type)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    step2Form.watch("accountType") === type
                      ? "bg-accent-gold/20 text-accent-gold border border-accent-gold/40"
                      : "bg-bg-tertiary text-text-secondary border border-border"
                  }`}
                >
                  {type === "PERSONAL" ? "Personal" : "Business"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button type="submit" className="flex-1">Continue</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-text-secondary">Upload your government-issued ID for KYC verification.</p>
          {(["front", "back"] as const).map((side) => (
            <label key={side} className="block">
              <span className="text-sm font-medium text-text-secondary mb-2 block capitalize">ID {side}</span>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent-gold/40 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(side, e.target.files[0])}
                />
                {kycFiles[side] ? (
                  <div className="flex items-center justify-center gap-2 text-accent-green">
                    <Check size={20} /> Uploaded
                  </div>
                ) : (
                  <div className="text-text-muted">
                    <Upload size={24} className="mx-auto mb-2" />
                    <p className="text-sm">Click to upload</p>
                  </div>
                )}
              </div>
            </label>
          ))}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(2)} className="flex-1">Back</Button>
            <Button onClick={handleRegister} isLoading={isLoading} className="flex-1">Create Account</Button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-gold hover:text-accent-gold-light transition-colors">Sign In</Link>
      </p>
    </Card>
  );
}
