"use client";

import VerificationBadge from "@/components/ui/VerificationBadge";
import type { VerificationBadgeType } from "@/lib/verification-badge";
import { cn } from "@/lib/utils";

type UserDisplayNameProps = {
  name: string;
  verificationBadge?: VerificationBadgeType | string | null;
  className?: string;
  nameClassName?: string;
  badgeSize?: "xs" | "sm" | "md";
  as?: "span" | "p" | "h1" | "h2" | "h3";
};

export default function UserDisplayName({
  name,
  verificationBadge,
  className,
  nameClassName,
  badgeSize = "sm",
  as: Tag = "span",
}: UserDisplayNameProps) {
  return (
    <Tag className={cn("inline-flex items-center gap-1.5 min-w-0 max-w-full align-middle", className)}>
      <span className={cn("truncate", nameClassName)}>{name}</span>
      <span className="inline-flex shrink-0 self-center">
        <VerificationBadge type={verificationBadge} size={badgeSize} />
      </span>
    </Tag>
  );
}
