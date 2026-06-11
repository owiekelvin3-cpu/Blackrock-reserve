"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import RevenueFlowChart, { type RevenueFlowDatum } from "@/components/charts/RevenueFlowChart";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

export type CashFlowMonth = {
  month: string;
  value: number;
  inflow: number;
  outflow: number;
  tooltipDate: string;
};

const DISPLAY_MONTHS = 7;

function hasRealActivity(data: CashFlowMonth[]): boolean {
  return data.some((m) => m.value > 0 || m.inflow > 0 || m.outflow > 0);
}

export default function CashFlowPanel({ data }: { data: CashFlowMonth[] }) {
  const { t, formatCurrency } = useI18n();

  const chartData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const start = Math.max(0, currentMonth - (DISPLAY_MONTHS - 1));
    return data.slice(start, currentMonth + 1);
  }, [data]);

  const hasActivity = hasRealActivity(chartData);

  const cashFlowTotal = useMemo(() => {
    if (!hasActivity) return 0;
    return data.reduce((s, m) => s + (m.inflow - m.outflow), 0);
  }, [data, hasActivity]);

  const flowPoints: RevenueFlowDatum[] = useMemo(() => {
    if (!hasActivity) return [];
    return chartData
      .filter((row) => row.value > 0 || row.inflow > 0 || row.outflow > 0)
      .map((row) => {
        const net = row.inflow - row.outflow;
        return {
          label: row.month,
          value: Math.max(row.value, Math.abs(net)),
          tooltipTitle: row.tooltipDate,
          tooltipLines: [
            { label: t("dashboard.cashFlow"), value: formatCurrency(net), accent: true },
            { label: t("dashboard.inflow"), value: formatCurrency(row.inflow) },
            {
              label: t("dashboard.outflow"),
              value:
                row.outflow > 0
                  ? `-${formatCurrency(row.outflow)}`
                  : formatCurrency(0),
            },
          ],
        };
      });
  }, [chartData, hasActivity, t, formatCurrency]);

  return (
    <motion.div
      className="revenue-flow-panel dash-panel p-4 sm:p-5 h-full flex flex-col"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-medium text-text-secondary">{t("dashboard.cashFlow")}</p>
          <p className="font-mono text-xl sm:text-2xl font-bold text-text-primary mt-1 tracking-tight">
            {hasActivity ? formatCurrency(cashFlowTotal) : "—"}
          </p>
        </div>
      </div>

      {!hasActivity ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center min-h-[9rem] rounded-xl border border-dashed border-border bg-surface-overlay">
          <div className="h-10 w-10 rounded-xl border border-border bg-bg-tertiary flex items-center justify-center mb-3">
            <BarChart3 size={18} className="text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-primary">{t("dashboard.noCashFlow")}</p>
          <p className="text-xs text-text-muted mt-1 max-w-xs">{t("dashboard.noCashFlowDesc")}</p>
        </div>
      ) : (
        <motion.div
          className={cn(
            "flex-1 w-full min-h-[9rem] sm:min-h-[10rem] rounded-xl transition-colors",
            "hover:bg-white/[0.02]"
          )}
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.25 }}
        >
          <RevenueFlowChart
            data={flowPoints}
            formatValue={(v) => formatCurrency(v)}
            emptyLabel={t("dashboard.noCashFlow")}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
