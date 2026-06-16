"use client";

import { cn } from "@/lib/utils";
import {
  getVerificationBadgeLabel,
  hasVerificationBadge,
  type VerificationBadgeType,
} from "@/lib/verification-badge";
import { VerificationBadgeIcon } from "@/components/ui/VerificationBadgeIcons";

type VerificationBadgeProps = {
  type: VerificationBadgeType | string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

const labelSize = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
} as const;

const badgeGlow = {
  STANDARD: "drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]",
  BUSINESS: "drop-shadow-[0_1px_4px_rgba(16,185,129,0.55)]",
  GOLD: "drop-shadow-[0_2px_6px_rgba(212,160,23,0.65)]",
} as const;

export default function VerificationBadge({
  type,
  size = "sm",
  showLabel = false,
  className,
}: VerificationBadgeProps) {
  if (!hasVerificationBadge(type)) return null;

  const label = getVerificationBadgeLabel(type);

  const content = (
    <span
      className={cn(
        "inline-flex items-center justify-center align-middle leading-none",
        badgeGlow[type],
        className
      )}
      title={label}
      aria-label={label}
      role="img"
    >
      <VerificationBadgeIcon type={type} size={size} />
    </span>
  );

  if (!showLabel) return content;

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0 align-middle">
      {content}
      <span className={cn("font-medium text-text-secondary truncate", labelSize[size])}>
        {label}
      </span>
    </span>
  );
}
