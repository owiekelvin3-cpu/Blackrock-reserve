"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, ArrowUpRight, ChevronDown, RotateCcw } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CHART_BRAND } from "@/lib/chart-theme";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { fetchJson } from "@/lib/fetch-json";
import DashboardGate from "@/components/dashboard/DashboardGate";
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";
import SavingsPanel, { type SavingsData } from "@/components/dashboard/SavingsPanel";
import RecentActivityPanel from "@/components/dashboard/RecentActivityPanel";
import EmptyState from "@/components/dashboard/EmptyState";
import ChartContainer from "@/components/ui/ChartContainer";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

interface OverviewData {
  totalBalance: number;
  investedBalance: number;
  profitBalance: number;
  bitcoinWalletAddress: string;
  depositsEnabled: boolean;
  savings: SavingsData;
  cashFlowData: { month: string; value: number }[];
}

const CHART_MUTED_BAR = "#2a2a2e";

export default function DashboardPage() {
  const { t, formatCurrency } = useI18n();
  const chartTheme = useChartTheme();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState("");
  const [chartMode, setChartMode] = useState<"monthly" | "yearly">("monthly");
  const [period, setPeriod] = useState("this-month");

  const loadData = () => {
    setLoading(true);
    fetchJson<OverviewData>("/api/dashboard/overview")
      .then((json) => {
        setData(json);
        if (json?.cashFlowData?.length) {
          const active = json.cashFlowData.find((m) => m.value > 0);
          setActiveMonth(active?.month ?? json.cashFlowData[0].month);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const cashFlowTotal = useMemo(
    () => data?.cashFlowData.reduce((s, m) => s + m.value, 0) ?? 0,
    [data]
  );

  const hasActivity =
    data &&
    (data.totalBalance > 0 ||
      data.investedBalance > 0 ||
      data.profitBalance > 0 ||
      data.savings.savingsBalance > 0 ||
      data.savings.availableToSave > 0);

  return (
    <DashboardGate isLoading={loading}>
      {data && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <DashboardGreeting />
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:-mt-2">
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="dash-control-btn appearance-none pr-8 cursor-pointer"
                  aria-label="Select period"
                >
                  <option value="this-month">{t("dashboard.thisMonth")}</option>
                  <option value="last-month">{t("dashboard.lastMonth")}</option>
                  <option value="this-year">{t("dashboard.thisYear")}</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              <button type="button" onClick={loadData} className="dash-control-btn">
                <RotateCcw size={14} />
                {t("dashboard.resetData")}
              </button>
            </div>
          </div>

          {!hasActivity && (
            <div className="dash-panel p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-accent-brand/20">
              <div>
                <p className="text-sm font-semibold text-text-primary">{t("dashboard.fundAccount")}</p>
                <p className="text-sm text-text-muted mt-1">
                  {data.depositsEnabled ? t("dashboard.fundAccountDesc") : t("dashboard.fundAccountDescAlt")}
                </p>
              </div>
              <Link
                href="/dashboard/deposit"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white brand-gradient-bg shadow-brand"
              >
                {data.depositsEnabled ? t("dashboard.viewDeposit") : t("dashboard.goToDeposit")}
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="dash-stat-primary p-5 min-h-[168px] flex flex-col justify-between">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-white/75">{t("dashboard.myBalance")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
                  {formatCurrency(data.totalBalance)}
                </p>
              </div>
              <Link href="/dashboard/deposit" className="text-xs text-white/65 hover:text-white flex items-center gap-1 mt-3 transition-colors">
                {t("dashboard.seeDetails")} <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="dash-stat-secondary p-5 min-h-[168px] flex flex-col justify-between">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Wallet size={18} className="text-text-muted" />
              </div>
              <div>
                <p className="text-sm text-text-muted">{t("dashboard.investedBalance")}</p>
                <p className="text-2xl font-bold text-text-primary mt-1 tracking-tight">
                  {formatCurrency(data.investedBalance)}
                </p>
              </div>
              <Link href="/dashboard/capital-markets" className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 mt-3 transition-colors">
                {t("dashboard.viewPortfolio")} <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="dash-stat-secondary p-5 min-h-[168px] flex flex-col justify-between">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <TrendingUp size={18} className="text-text-muted" />
              </div>
              <div>
                <p className="text-sm text-text-muted">{t("dashboard.profitBalance")}</p>
                <p className="text-2xl font-bold text-text-primary mt-1 tracking-tight">
                  {formatCurrency(data.profitBalance)}
                </p>
              </div>
              <Link href="/dashboard/investments" className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 mt-3 transition-colors">
                {t("dashboard.seeDetails")} <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <SavingsPanel data={data.savings} onUpdated={loadData} />

            <div className="dash-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">{t("dashboard.cashFlow")}</h2>
                  <p className="text-xl font-bold text-text-primary mt-1 tracking-tight">
                    {formatCurrency(cashFlowTotal)}
                  </p>
                </div>
                <div className="dash-period-toggle">
                  <button
                    type="button"
                    onClick={() => setChartMode("monthly")}
                    className={cn("dash-period-btn", chartMode === "monthly" && "dash-period-btn-active")}
                  >
                    {t("dashboard.monthly")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode("yearly")}
                    className={cn("dash-period-btn", chartMode === "yearly" && "dash-period-btn-active")}
                  >
                    {t("dashboard.yearly")}
                  </button>
                </div>
              </div>
              {data.cashFlowData.every((m) => m.value === 0) ? (
                <EmptyState title={t("dashboard.noCashFlow")} description={t("dashboard.noCashFlowDesc")} />
              ) : (
                <ChartContainer className="h-52 min-h-[208px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.cashFlowData} barCategoryGap="22%">
                      <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={chartTheme.tooltip}
                        cursor={{ fill: "rgba(255,95,5,0.06)" }}
                        formatter={(v) => [formatCurrency(Number(v ?? 0)), t("dashboard.cashFlow")]}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        {data.cashFlowData.map((entry) => (
                          <Cell
                            key={entry.month}
                            fill={entry.month === activeMonth ? CHART_BRAND : CHART_MUTED_BAR}
                            onClick={() => setActiveMonth(entry.month)}
                            style={{ cursor: "pointer" }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </div>

          <RecentActivityPanel />
        </div>
      )}
    </DashboardGate>
  );
}
