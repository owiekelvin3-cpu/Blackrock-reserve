"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CTABanner() {
  return (
    <section className="section-padding">
      <motion.div
        className="mx-auto max-w-4xl glow-card p-10 sm:p-14 text-center relative"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="light-leak light-leak-orange w-48 h-48 top-0 left-1/2 -translate-x-1/2 opacity-50" />
        <div className="light-leak light-leak-red w-32 h-32 bottom-0 right-8 opacity-30" />

        <div className="glow-card-inner relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Your Financial Future <span className="gold-gradient-text">Starts Today</span>
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            Join thousands of members who trust Platinum Crest Bank with their wealth.
          </p>

          <div className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-2 p-2 rounded-full bg-white/[0.03] border border-white/10">
            <input
              type="email"
              placeholder="you@email.com"
              className="input-glass flex-1 px-5 py-3 text-sm border-0 bg-transparent focus:shadow-none"
            />
            <Link href="/register" className="shrink-0">
              <Button size="md" className="rounded-full w-full sm:w-auto whitespace-nowrap">
                Open Account <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
