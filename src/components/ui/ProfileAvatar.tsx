"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/profile-image";

type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE: Record<Size, string> = {
  xs: "h-8 w-8 text-xs",
  sm: "h-9 w-9 text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
  "2xl": "h-28 w-28 text-3xl",
};

interface ProfileAvatarProps {
  name?: string | null;
  image?: string | null;
  size?: Size;
  className?: string;
}

export default function ProfileAvatar({ name, image, size = "md", className }: ProfileAvatarProps) {
  const initials = getInitials(name);
  const box = SIZE[size];

  if (image) {
    return (
      <div className={cn(box, "relative rounded-full overflow-hidden ring-2 ring-white/10 shrink-0", className)}>
        <Image src={image} alt="" fill className="object-cover" sizes="96px" unoptimized />
      </div>
    );
  }

  return (
    <div
      className={cn(
        box,
        "rounded-full brand-gradient-bg flex items-center justify-center text-white font-bold ring-2 ring-white/10 shrink-0",
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
