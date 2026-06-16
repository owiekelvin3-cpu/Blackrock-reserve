"use client";

import { Check, Copy, Eye, EyeOff } from "lucide-react";
import {
  formatBankAccountNumberDisplay,
  maskBankAccountNumberDisplay,
  normalizeBankAccountNumber,
} from "@/lib/bank-account-number";
import { cn } from "@/lib/utils";

type AccountNumberDisplayProps = {
  value: string;
  revealed: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
  copied?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  showLabel?: boolean;
  copyLabel: string;
  showNumberLabel: string;
  hideNumberLabel: string;
  className?: string;
};

export default function AccountNumberDisplay({
  value,
  revealed,
  onToggleReveal,
  onCopy,
  copied = false,
  size = "md",
  label,
  showLabel = true,
  copyLabel,
  showNumberLabel,
  hideNumberLabel,
  className,
}: AccountNumberDisplayProps) {
  const normalized = normalizeBankAccountNumber(value);
  const display = revealed
    ? formatBankAccountNumberDisplay(normalized)
    : maskBankAccountNumberDisplay(normalized);

  return (
    <div className={cn("profile-acct-number", `profile-acct-number-${size}`, className)}>
      {showLabel && label && (
        <span className="profile-acct-number-label">{label}</span>
      )}
      <div className="profile-acct-number-row">
        <p
          className="profile-acct-number-value"
          aria-label={label}
        >
          {display.split(" ").map((segment, index) => (
            <span key={`${segment}-${index}`} className="profile-acct-number-segment">
              {segment}
            </span>
          ))}
        </p>
        <div className="profile-acct-number-actions">
          <button
            type="button"
            onClick={onToggleReveal}
            className="profile-acct-number-btn"
            aria-label={revealed ? hideNumberLabel : showNumberLabel}
            title={revealed ? hideNumberLabel : showNumberLabel}
          >
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button
            type="button"
            onClick={onCopy}
            className={cn("profile-acct-number-btn", copied && "profile-acct-number-btn-copied")}
            aria-label={copyLabel}
            title={copyLabel}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
