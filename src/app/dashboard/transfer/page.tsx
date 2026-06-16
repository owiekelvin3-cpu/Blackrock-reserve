"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import DashboardGate from "@/components/dashboard/DashboardGate";
import MemberTransferPanel from "@/components/dashboard/MemberTransferPanel";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { fetchDashboardJson } from "@/lib/fetch-json";
import { useI18n } from "@/components/providers/I18nProvider";

type TransferAccount = {
  id: string;
  name: string;
  currency: string;
  balance: number;
  availableBalance: number;
};

export default function TransferPage() {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<TransferAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    fetchDashboardJson<{ accounts: TransferAccount[] }>("/api/dashboard/transfers")
      .then(({ data, error }) => {
        if (error || !data) {
          setLoadError(true);
          return;
        }
        setAccounts(data.accounts ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardGate isLoading={loading}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            {t("nav.dashboard")}
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("transfer.title")}{" "}
            <span className="gold-gradient-text">{t("transfer.titleHighlight")}</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">{t("transfer.subtitle")}</p>
        </div>

        {loadError && (
          <Card className="border border-accent-red/30 bg-accent-red/5">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-accent-red shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-text-primary font-medium">{t("transfer.loadError")}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={load}>
                  {t("transfer.retry")}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {!loadError && accounts.length === 0 && !loading && (
          <Card>
            <p className="text-sm font-medium text-text-primary">{t("transfer.noAccount")}</p>
            <p className="text-xs text-text-muted mt-1">{t("transfer.noAccountDesc")}</p>
          </Card>
        )}

        {accounts.length > 0 && (
          <MemberTransferPanel
            accounts={accounts.map((a) => ({
              id: a.id,
              name: a.name,
              currency: a.currency,
              availableBalance: a.availableBalance,
            }))}
            onSuccess={load}
          />
        )}
      </div>
    </DashboardGate>
  );
}
