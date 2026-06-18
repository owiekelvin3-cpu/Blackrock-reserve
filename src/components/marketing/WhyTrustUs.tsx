"use client";

import MarketingImage from "@/components/ui/MarketingImage";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { marketingImages } from "@/lib/marketing-images";
import { useI18n } from "@/components/providers/I18nProvider";

const commitmentKeys = [
  "marketing.whyTrust.commit1",
  "marketing.whyTrust.commit2",
  "marketing.whyTrust.commit3",
  "marketing.whyTrust.commit4",
  "marketing.whyTrust.commit5",
] as const;

export default function WhyTrustUs() {
  const { t } = useI18n();

  return (
    <section className="section-padding bg-bg-secondary/50 relative overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="pill-label mb-4">{t("marketing.whyTrust.badge")}</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mt-4">
              {t("marketing.whyTrust.title")}{" "}
              <span className="gold-gradient-text">{t("marketing.whyTrust.titleHighlight")}</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg">
              {t("marketing.whyTrust.subtitle")}
            </p>
            <ul className="mt-8 space-y-4">
              {commitmentKeys.map((key, i) => (
                <motion.li
                  key={key}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <CheckCircle2 size={18} className="text-accent-green shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary leading-relaxed">{t(key)}</span>
                </motion.li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {["FDIC", "SOC 2", "PCI DSS", "FinCEN"].map((badge) => (
                <span
                  key={badge}
                  className="pill-label text-accent-brand border-accent-brand/30 text-[11px] sm:text-xs"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="glow-card overflow-hidden relative aspect-[4/3] sm:aspect-[16/11]">
              <MarketingImage
                src={marketingImages.features.security}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 560px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-brand mb-2">
                  {t("marketing.whyTrust.imageLabel")}
                </p>
                <p className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {t("marketing.whyTrust.imageCaption")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
