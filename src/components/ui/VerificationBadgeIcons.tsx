"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { VerificationBadgeType } from "@/lib/verification-badge";

type BadgeIconProps = {
  size: number;
  className?: string;
};

const sizePx = { xs: 16, sm: 20, md: 24, lg: 32 } as const;

const BADGE_ASSETS: Record<
  Exclude<VerificationBadgeType, "NONE">,
  { src: string; filter?: string; scale?: number }
> = {
  STANDARD: { src: "/badges/verification-badge.png", filter: "vbadge-filter-black" },
  BUSINESS: { src: "/badges/verification-badge.png", filter: "vbadge-filter-green" },
  GOLD: { src: "/badges/gold-verification-badge.png", scale: 1.05 },
};

function RosetteBadgeImage({
  type,
  size,
  className,
}: BadgeIconProps & { type: Exclude<VerificationBadgeType, "NONE"> }) {
  const asset = BADGE_ASSETS[type];
  const px = Math.round(size * (asset.scale ?? 1));

  return (
    <Image
      src={asset.src}
      alt=""
      width={px}
      height={px}
      className={cn("shrink-0 object-contain", asset.filter, className)}
      aria-hidden
      unoptimized
    />
  );
}

export function getBadgePixelSize(size: "xs" | "sm" | "md" | "lg") {
  return sizePx[size];
}

export function VerificationBadgeIcon({
  type,
  size = "sm",
  className,
}: {
  type: Exclude<VerificationBadgeType, "NONE">;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const px = sizePx[size];
  return <RosetteBadgeImage type={type} size={px} className={className} />;
}

/** @deprecated use VerificationBadgeIcon */
export function StandardVerifiedIcon({ size, className }: BadgeIconProps) {
  return <RosetteBadgeImage type="STANDARD" size={size} className={className} />;
}

/** @deprecated use VerificationBadgeIcon */
export function BusinessVerifiedIcon({ size, className }: BadgeIconProps) {
  return <RosetteBadgeImage type="BUSINESS" size={size} className={className} />;
}

/** @deprecated use VerificationBadgeIcon */
export function GoldVerifiedIcon({ size, className }: BadgeIconProps) {
  return <RosetteBadgeImage type="GOLD" size={size} className={className} />;
}

export function getBadgeAssetPath(type: Exclude<VerificationBadgeType, "NONE">) {
  return BADGE_ASSETS[type].src;
}
