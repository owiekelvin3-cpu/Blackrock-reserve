"use client";

import { useI18n } from "@/components/providers/I18nProvider";

export default function DisclosuresPage() {
  const { t } = useI18n();

  return (
    <section className="section-padding pt-32">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t("pages.disclosures.title")}</h1>
        <p className="text-sm text-text-muted mb-10">{t("pages.disclosures.lastUpdated")}</p>
        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary text-sm leading-relaxed">
          <p>{t("pages.disclosures.intro")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.disclosures.fdicTitle")}</h2>
          <p>{t("pages.disclosures.fdicBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.disclosures.investmentTitle")}</h2>
          <p>{t("pages.disclosures.investmentBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.disclosures.cryptoTitle")}</h2>
          <p>{t("pages.disclosures.cryptoBody")}</p>
        </div>
      </div>
    </section>
  );
}
