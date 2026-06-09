"use client";

import { motion, AnimatePresence } from "framer-motion";
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

  const dims = size === "sm"
    ? { track: "h-8 w-[3.25rem]", thumb: "h-6 w-6", icon: 13, pad: "p-1" }
    : { track: "h-9 w-[4.25rem]", thumb: "h-7 w-7", icon: 15, pad: "p-1" };

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

      <motion.span
        layout
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full shadow-md",
          dims.thumb,
          isDark
            ? "bg-gradient-to-br from-[#2a2a32] to-[#1a1a20] shadow-black/40"
            : "bg-gradient-to-br from-white to-[#f8fafc] shadow-slate-300/60"
        )}
        animate={{ x: isDark ? 0 : size === "sm" ? 20 : 26 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {mounted && (
            <motion.span
              key={isDark ? "moon" : "sun"}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center"
            >
              {isDark ? (
                <Moon size={dims.icon} className="text-accent-brand" strokeWidth={2.25} />
              ) : (
                <Sun size={dims.icon} className="text-amber-500" strokeWidth={2.25} />
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>

      <span className="sr-only">{isDark ? "Dark mode active" : "Light mode active"}</span>
    </button>
  );
}
