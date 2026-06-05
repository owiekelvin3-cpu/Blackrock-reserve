"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlowIconProps {
  icon: LucideIcon;
  size?: number;
  variant?: "circle" | "hex";
  className?: string;
  iconClassName?: string;
}

export default function GlowIcon({
  icon: Icon,
  size = 22,
  variant = "circle",
  className,
  iconClassName,
}: GlowIconProps) {
  if (variant === "hex") {
    return (
      <div className={cn("icon-hex-wrap", className)}>
        <div className="icon-hex relative z-10 h-16 w-16">
          <Icon size={size} className={cn("text-white", iconClassName)} strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        className="absolute inset-0 rounded-full blur-xl scale-150"
        style={{ background: "radial-gradient(circle, rgba(255,95,5,0.35) 0%, transparent 70%)" }}
      />
      <div className="icon-ring relative h-14 w-14">
        <Icon size={size} className={cn("text-white", iconClassName)} strokeWidth={1.5} />
      </div>
    </div>
  );
}
