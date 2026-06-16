"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  size?: "sm" | "md";
};

export default function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  const dims =
    size === "sm"
      ? { track: "h-8 w-[3.25rem]", thumb: "h-6 w-6", icon: 13, pad: "p-1", offset: 20 }
      : { track: "h-9 w-[4.25rem]", thumb: "h-7 w-7", icon: 15, pad: "p-1", offset: 26 };

  if (!mounted) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={false}
        aria-label="Switch theme"
        className={cn(
          "theme-toggle relative inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/5",
          dims.track,
          dims.pad,
          className
        )}
        disabled
      >
        <span
          className={cn(
            "relative z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2a2a32] to-[#1a1a20]",
            dims.thumb
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={cn(
        "theme-toggle relative inline-flex shrink-0 items-center rounded-full border transition-shadow duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
        dims.track,
        dims.pad,
        isDark
          ? "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "border-black/8 bg-white/80 shadow-[0_2px_12px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full opacity-60 transition-opacity duration-500",
          isDark
            ? "bg-[radial-gradient(circle_at_30%_50%,rgba(255,95,5,0.15),transparent_60%)]"
            : "bg-[radial-gradient(circle_at_70%_50%,rgba(255,149,0,0.12),transparent_60%)]"
        )}
      />

      <span
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full shadow-md transition-transform duration-300 ease-out",
          dims.thumb,
          isDark
            ? "bg-gradient-to-br from-[#2a2a32] to-[#1a1a20] shadow-black/40"
            : "bg-gradient-to-br from-white to-[#f8fafc] shadow-slate-300/60"
        )}
        style={{ transform: isDark ? "translateX(0px)" : `translateX(${dims.offset}px)` }}
      >
        {isDark ? (
          <Moon size={dims.icon} className="text-accent-brand" strokeWidth={2.25} />
        ) : (
          <Sun size={dims.icon} className="text-amber-500" strokeWidth={2.25} />
        )}
      </span>

      <span className="sr-only">{isDark ? "Dark mode active" : "Light mode active"}</span>
    </button>
  );
}
