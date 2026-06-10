"use client";

import { useI18n } from "@/components/providers/I18nProvider";

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <section className="section-padding pt-32">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t("pages.terms.title")}</h1>
        <p className="text-sm text-text-muted mb-10">{t("pages.terms.lastUpdated")}</p>
        <div className="prose prose-invert max-w-none space-y-6 text-text-secondary text-sm leading-relaxed">
          <p>{t("pages.terms.intro")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.terms.agreementTitle")}</h2>
          <p>{t("pages.terms.agreementBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.terms.accountsTitle")}</h2>
          <p>{t("pages.terms.accountsBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.terms.liabilityTitle")}</h2>
          <p>{t("pages.terms.liabilityBody")}</p>
          <h2 className="text-lg font-semibold text-white pt-2">{t("pages.terms.contactTitle")}</h2>
          <p>
            {t("pages.terms.contactBody")}{" "}
            <a href="mailto:legal@blackrockreserve.com" className="text-accent-brand hover:underline">
              legal@blackrockreserve.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
