"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Clock } from "lucide-react";
import { getFirstName } from "@/lib/greeting";
import { useLiveClock } from "@/hooks/use-live-clock";
import { fadeUp, stagger } from "@/components/ui/AnimateIn";

export default function DashboardGreeting() {
  const { data: session } = useSession();
  const firstName = useMemo(() => getFirstName(session?.user?.name), [session?.user?.name]);
  const { clock, timezone, ready } = useLiveClock(firstName);

  if (!ready || !clock) {
    return (
      <div
        className="dash-card min-h-[120px] animate-pulse bg-bg-tertiary/40"
        aria-hidden="true"
      />
    );
  }

  const timezoneLabel = timezone.replace(/_/g, " ");

  return (
    <motion.section
      className="dash-card relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={stagger}
      aria-label="Personalized welcome"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent-brand/8 via-transparent to-accent-brand-red/5 pointer-events-none" />
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent-brand/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div variants={fadeUp} className="min-w-0">
          <h1
            className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-text-primary tracking-tight"
            aria-live="polite"
          >
            {clock.greeting}
          </h1>

          <div
            className="mt-3 space-y-1"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-sm sm:text-base text-text-secondary">{clock.dateLine}</p>
            <p className="font-mono text-base sm:text-lg text-text-primary tabular-nums tracking-wide">
              <time dateTime={new Date().toISOString()}>{clock.timeLine}</time>
              <span className="text-xs sm:text-sm font-sans text-text-muted ml-2">(Local Time)</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex items-center gap-3 shrink-0 self-start sm:self-center"
        >
          <div className="hidden md:flex h-12 w-12 rounded-2xl bg-surface-overlay border border-border items-center justify-center">
            <Clock size={22} className="text-accent-brand" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="rounded-xl border border-border bg-surface-overlay px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Your timezone</p>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5 max-w-[180px] truncate" title={timezoneLabel}>
              {timezoneLabel}
            </p>
          </div>
        </motion.div>
      </div>

      <span className="sr-only">
        {clock.greeting}. Today is {clock.dateLine}. The current local time is {clock.timeLine}.
      </span>
    </motion.section>
  );
}
