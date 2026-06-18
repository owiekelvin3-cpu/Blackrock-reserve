"use client";

import { motion } from "framer-motion";
import { Shield, Lock, BadgeCheck, Building2, Fingerprint, Server } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";

const credentialIcons = [Shield, Lock, BadgeCheck, Building2, Fingerprint, Server];

export default function TrustBar() {
  const { t } = useI18n();

  const credentials = [
    { label: t("marketing.trustBar.fdic"), icon: credentialIcons[0] },
    { label: t("marketing.trustBar.encryption"), icon: credentialIcons[1] },
    { label: t("marketing.trustBar.soc2"), icon: credentialIcons[2] },
    { label: t("marketing.trustBar.regulated"), icon: credentialIcons[3] },
    { label: t("marketing.trustBar.biometric"), icon: credentialIcons[4] },
    { label: t("marketing.trustBar.uptime"), icon: credentialIcons[5] },
  ];

  const slides = [...credentials, ...credentials];

  return (
    <section className="py-10 sm:py-14 border-y border-white/5 bg-bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          className="text-center text-sm text-text-muted mb-8 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t("marketing.trustBar.trusted")}
        </motion.p>

        <motion.div
          className="stats-marquee-mask overflow-hidden"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="stats-marquee-track flex animate-marquee">
            {slides.map((item, i) => (
              <div
                key={`${item.label}-${i}`}
                className="stats-marquee-slide flex items-center gap-2.5 px-8 sm:px-10"
              >
                <item.icon size={16} className="text-accent-brand shrink-0" strokeWidth={1.75} />
                <span className="text-sm font-medium text-text-secondary whitespace-nowrap select-none">
                  {item.label}
                </span>
                {i < slides.length - 1 && <div className="stats-marquee-divider" />}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
