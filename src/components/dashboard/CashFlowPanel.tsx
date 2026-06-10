"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
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

export default function CashFlowPanel({
  data,
}: {
  data: CashFlowMonth[];
}) {
  const { t, formatCurrency: formatCurrencyLocale } = useI18n();

  const chartData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const start = Math.max(0, currentMonth - (DISPLAY_MONTHS - 1));
    return data.slice(start, currentMonth + 1);
  }, [data]);

  const cashFlowTotal = useMemo(
    () => data.reduce((s, m) => s + Math.max(0, m.inflow - m.outflow), 0),
    [data]
  );

  const flowPoints: RevenueFlowDatum[] = useMemo(
    () =>
      chartData.map((row) => {
        const net = row.inflow - row.outflow;
        return {
          label: row.month,
          value: Math.max(row.value, Math.abs(net)),
          tooltipTitle: row.tooltipDate,
          tooltipLines: [
            { label: t("dashboard.cashFlow"), value: formatCurrencyLocale(net), accent: true },
            { label: t("dashboard.inflow"), value: formatCurrencyLocale(row.inflow) },
            {
              label: t("dashboard.outflow"),
              value: row.outflow > 0 ? `-${formatCurrencyLocale(row.outflow)}` : formatCurrencyLocale(0),
            },
          ],
        };
      }),
    [chartData, t, formatCurrencyLocale]
  );

  const hasActivity = chartData.some((m) => m.value > 0);

  return (
    <motion.div
      className="revenue-flow-panel dash-panel p-4 sm:p-5 h-full flex flex-col"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-medium text-text-secondary">{t("dashboard.revenueFlow")}</p>
          <p className="font-mono text-xl sm:text-2xl font-bold text-text-primary mt-1 tracking-tight">
            {formatCurrencyLocale(cashFlowTotal)}
          </p>
        </div>
        {!hasActivity && (
          <span className="text-[10px] text-text-muted shrink-0 max-w-[120px] text-right leading-snug">
            {t("dashboard.noCashFlowDesc")}
          </span>
        )}
      </div>

      <motion.div
        className={cn(
          "flex-1 w-full min-h-[9rem] sm:min-h-[10rem] rounded-xl transition-colors",
          "hover:bg-white/[0.02]"
        )}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.25 }}
      >
        <RevenueFlowChart
          data={flowPoints.length > 0 ? flowPoints : undefined}
          formatValue={(v) => formatCurrencyLocale(v)}
        />
      </motion.div>
    </motion.div>
  );
}
