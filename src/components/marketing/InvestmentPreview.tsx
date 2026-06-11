"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";
import GlowIcon from "@/components/ui/GlowIcon";
import { useI18n } from "@/components/providers/I18nProvider";

const tickers = ["AAPL", "MSFT", "TSLA", "BTC", "ETH"];

export default function InvestmentPreview() {
  const { t } = useI18n();

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="neon-streak top-1/3 right-[-15%] w-[70%] h-20 opacity-20 rotate-12" />
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="glow-card p-6 sm:p-8 relative"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="light-leak light-leak-orange w-32 h-32 -bottom-8 -left-8 opacity-40" />
            <div className="glow-card-inner">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-text-secondary">{t("marketing.investment.indexLabel")}</span>
                <span className="font-mono text-sm text-accent-green">{t("marketing.investment.ytd")}</span>
              </div>
              <div className="h-64 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center">
                <p className="text-sm text-text-muted">Live market data in your dashboard</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <GlowIcon icon={TrendingUp} size={22} className="mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {t("marketing.investment.title")}{" "}
              <span className="gold-gradient-text">{t("marketing.investment.titleHighlight")}</span>
            </h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              {t("marketing.investment.subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {tickers.map((ticker) => (
                <span key={ticker} className="pill-label text-xs">{ticker}</span>
              ))}
            </div>
            <Link href="/investments" className="inline-block mt-8">
              <Button>{t("marketing.investment.cta")} <ArrowRight size={18} /></Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
