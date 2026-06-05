"use client";

import { motion } from "framer-motion";
import CountUp from "@/components/ui/CountUp";

const stats = [
  { value: 2.4, prefix: "$", suffix: "B+", label: "Assets Under Management", decimals: 1 },
  { value: 50000, prefix: "", suffix: "+", label: "Active Members", decimals: 0 },
  { value: 99.9, prefix: "", suffix: "%", label: "Uptime Guarantee", decimals: 1 },
];

export default function Stats() {
  return (
    <section className="py-12 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glow-card p-8 text-center relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="light-leak light-leak-orange w-20 h-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
              <div className="glow-card-inner">
                <p className="font-mono text-4xl sm:text-5xl font-bold gold-gradient-text">
                  <CountUp end={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                </p>
                <p className="mt-2 text-sm text-text-secondary">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
