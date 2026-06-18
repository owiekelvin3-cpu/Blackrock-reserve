"use client";

import MarketingImage from "@/components/ui/MarketingImage";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { cardHover } from "@/components/ui/AnimateIn";
import { marketingImages } from "@/lib/marketing-images";
import { useI18n } from "@/components/providers/I18nProvider";

const testimonialPhotos = [
  marketingImages.portraits.sarah,
  marketingImages.portraits.marcus,
  marketingImages.portraits.elena,
  marketingImages.portraits.james,
  marketingImages.portraits.priya,
  marketingImages.portraits.alex,
];

export default function Testimonials() {
  const { t } = useI18n();

  const items = [
    { text: t("marketing.testimonials.t1Text"), role: t("marketing.testimonials.t1Role"), photo: testimonialPhotos[0] },
    { text: t("marketing.testimonials.t2Text"), role: t("marketing.testimonials.t2Role"), photo: testimonialPhotos[1] },
    { text: t("marketing.testimonials.t3Text"), role: t("marketing.testimonials.t3Role"), photo: testimonialPhotos[2] },
    { text: t("marketing.testimonials.t4Text"), role: t("marketing.testimonials.t4Role"), photo: testimonialPhotos[3] },
    { text: t("marketing.testimonials.t5Text"), role: t("marketing.testimonials.t5Role"), photo: testimonialPhotos[4] },
    { text: t("marketing.testimonials.t6Text"), role: t("marketing.testimonials.t6Role"), photo: testimonialPhotos[5] },
  ];

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="neon-streak top-1/2 left-[-10%] w-[120%] h-24 opacity-20" />
      <div className="mx-auto max-w-7xl relative z-10">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="pill-label mb-4">{t("marketing.testimonials.badge")}</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mt-4 max-w-3xl mx-auto text-balance">
            {t("marketing.testimonials.title")}{" "}
            <span className="gold-gradient-text">{t("marketing.testimonials.titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-sm text-text-secondary max-w-xl mx-auto">
            {t("marketing.testimonials.subtitle")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.role}
              className="glow-card hover-lift p-6 relative flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              {...cardHover}
            >
              <div className="glow-card-inner flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <Quote size={20} className="text-accent-brand/60" />
                  <div className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={12} className="text-accent-brand fill-accent-brand" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed flex-1">&ldquo;{item.text}&rdquo;</p>
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/8">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-accent-brand/20 shrink-0">
                    <MarketingImage src={item.photo} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                  <p className="text-xs font-medium text-text-primary leading-snug">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
