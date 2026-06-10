"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  "Tax Refund Form",
  "Verification",
  "Loan Access",
  "Application",
  "Approval",
];

export default function LoanProgressTracker({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex items-center min-w-[520px] gap-0">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const done = step < currentStep;
          const active = step === currentStep;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                    done && "bg-accent-brand border-accent-brand text-white",
                    active && "border-accent-brand text-accent-brand bg-accent-brand/10 shadow-brand",
                    !done && !active && "border-white/15 text-text-muted"
                  )}
                >
                  {done ? <Check size={16} /> : step}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs text-center font-medium leading-tight max-w-[80px]",
                    active ? "text-accent-brand" : "text-text-muted"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 mb-5 rounded-full",
                    step < currentStep ? "bg-accent-brand" : "bg-white/10"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
