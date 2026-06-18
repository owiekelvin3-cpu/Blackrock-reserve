"use client";

import { motion } from "framer-motion";
import { Shield, Users, TrendingUp, Clock } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";

const statIcons = [TrendingUp, Users, Shield, Clock];

export default function StatsSection() {
  const { t } = useI18n();

  const stats = [
    { value: t("marketing.stats.aumValue"), label: t("marketing.stats.aum"), icon: statIcons[0] },
    { value: t("marketing.stats.membersValue"), label: t("marketing.stats.members"), icon: statIcons[1] },
    { value: t("marketing.stats.countriesValue"), label: t("marketing.stats.countries"), icon: statIcons[2] },
    { value: t("marketing.stats.uptimeValue"), label: t("marketing.stats.uptime"), icon: statIcons[3] },
  ];

  return (
    <section className="relative -mt-4 sm:-mt-8 pb-4 sm:pb-8" aria-label={t("marketing.stats.ariaLabel")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="glow-card p-6 sm:p-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="light-leak light-leak-orange w-48 h-48 -top-12 -right-12 opacity-30" />
          <div className="glow-card-inner">
            <p className="text-center text-xs sm:text-sm font-semibold uppercase tracking-widest text-accent-brand mb-6">
              {t("marketing.stats.heading")}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-accent-brand/10 border border-accent-brand/20 mb-3">
                    <stat.icon size={18} className="text-accent-brand" strokeWidth={1.75} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-text-secondary leading-snug">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
