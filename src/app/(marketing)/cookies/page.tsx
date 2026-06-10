"use client";

import { useI18n } from "@/components/providers/I18nProvider";

export default function CookiesPage() {
  const { t } = useI18n();

  return (
    <section className="section-padding pt-32">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t("pages.cookies.title")}</h1>
        <p className="text-sm text-text-muted mb-10">{t("pages.cookies.lastUpdated")}</p>
        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary text-sm leading-relaxed">
          <p>{t("pages.cookies.intro")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.cookies.essentialTitle")}</h2>
          <p>{t("pages.cookies.essentialBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.cookies.analyticsTitle")}</h2>
          <p>{t("pages.cookies.analyticsBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.cookies.manageTitle")}</h2>
          <p>{t("pages.cookies.manageBody")}</p>
        </div>
      </div>
    </section>
  );
}
