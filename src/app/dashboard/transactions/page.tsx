"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DashboardGate from "@/components/dashboard/DashboardGate";
import RecentActivityPanel from "@/components/dashboard/RecentActivityPanel";
import { useI18n } from "@/components/providers/I18nProvider";

export default function TransactionsPage() {
  const { t } = useI18n();

  return (
    <DashboardGate isLoading={false}>
      <div className="space-y-6 max-w-4xl">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            {t("nav.dashboard")}
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {t("dashboard.transactionsTitle")}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {t("dashboard.transactionsSubtitle")}
          </p>
        </div>

        <RecentActivityPanel
          variant="page"
          pageSize={15}
          titleKey="dashboard.transactionsTitle"
          showTotal
        />
      </div>
    </DashboardGate>
  );
}
