"use client";

import { cn } from "@/lib/utils";

type Props = {
  rate: number;
  size?: "sm" | "md";
  className?: string;
};

export default function SavingsApyBadge({ rate, size = "md", className }: Props) {
  const formatted = Number.isInteger(rate) ? String(rate) : rate.toFixed(2).replace(/\.?0+$/, "");

  return (
    <span className={cn("dash-apy-badge", size === "sm" && "dash-apy-badge-sm", className)}>
      <span className="dash-apy-rate">{formatted}%</span>
      <span className="dash-apy-label">APY</span>
    </span>
  );
}
