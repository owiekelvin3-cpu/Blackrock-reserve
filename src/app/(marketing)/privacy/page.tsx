"use client";

import { useI18n } from "@/components/providers/I18nProvider";

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <section className="section-padding pt-32">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t("pages.privacy.title")}</h1>
        <p className="text-sm text-text-muted mb-10">{t("pages.privacy.lastUpdated")}</p>
        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary text-sm leading-relaxed">
          <p>{t("pages.privacy.intro")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.privacy.collectTitle")}</h2>
          <p>{t("pages.privacy.collectBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.privacy.useTitle")}</h2>
          <p>{t("pages.privacy.useBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.privacy.securityTitle")}</h2>
          <p>{t("pages.privacy.securityBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.privacy.contactTitle")}</h2>
          <p>
            {t("pages.privacy.contactBody")}{" "}
            <a href="mailto:privacy@blackrockreserve.com" className="text-accent-brand hover:underline">
              privacy@blackrockreserve.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
