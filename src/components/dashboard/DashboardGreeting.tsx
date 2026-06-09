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
  const { clock, ready } = useLiveClock(firstName);

  if (!ready || !clock) {
    return (
      <div
        className="dash-card min-h-[100px] animate-pulse bg-bg-tertiary/40"
        aria-hidden="true"
      />
    );
  }

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

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <motion.div variants={fadeUp} className="min-w-0 flex-1">
          <h1
            className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-text-primary tracking-tight"
            aria-live="polite"
          >
            {clock.greeting}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-text-secondary">{clock.dateLine}</p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex items-center gap-3 sm:gap-4 shrink-0 sm:pl-4 sm:border-l sm:border-border"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-surface-overlay border border-border flex items-center justify-center shrink-0">
            <Clock size={22} className="text-accent-brand" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <time
            dateTime={new Date().toISOString()}
            className="font-mono text-2xl sm:text-3xl lg:text-[2rem] font-semibold text-text-primary tabular-nums tracking-tight leading-none"
          >
            {clock.timeLine}
          </time>
        </motion.div>
      </div>

      <span className="sr-only">
        {clock.greeting}. Today is {clock.dateLine}. The current time is {clock.timeLine}.
      </span>
    </motion.section>
  );
}
