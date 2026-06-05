"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet, TrendingUp,
  ArrowDownLeft, CreditCard, RefreshCw,
} from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CHART_BRAND, CHART_MUTED, CHART_TOOLTIP_STYLE } from "@/lib/chart-theme";
import { formatCurrency } from "@/lib/utils";
import { fetchJson } from "@/lib/fetch-json";
import DashboardGate from "@/components/dashboard/DashboardGate";
import EmptyState from "@/components/dashboard/EmptyState";
import ChartContainer from "@/components/ui/ChartContainer";

interface OverviewData {
  totalBalance: number;
  savingsBalance: number;
  investmentValue: number;
  wallets: { id: string; flag: string; currency: string; balance: number; active: boolean; name: string }[];
  cashFlowData: { month: string; value: number }[];
  activities: {
    id: string;
    name: string;
    orderId: string;
    date: string;
    time: string;
    price: number;
    status: string;
    type: string;
  }[];
}

const activityIcons: Record<string, typeof Wallet> = {
  DEPOSIT: ArrowDownLeft,
  WITHDRAWAL: TrendingUp,
  TRANSFER: RefreshCw,
  PAYMENT: CreditCard,
};

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState("");

  useEffect(() => {
    fetchJson<OverviewData>("/api/dashboard/overview")
      .then((json) => {
        setData(json);
        if (json?.cashFlowData?.length) {
          const active = json.cashFlowData.find((m) => m.value > 0);
          setActiveMonth(active?.month ?? json.cashFlowData[0].month);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const hasData =
    data &&
    (data.totalBalance > 0 ||
      data.savingsBalance > 0 ||
      data.investmentValue > 0 ||
      data.wallets.length > 0 ||
      data.activities.length > 0);

  return (
    <DashboardGate isLoading={loading} isEmpty={!hasData} emptyTitle="No financial data yet" emptyDescription="Open an account or make your first deposit to see your dashboard overview.">
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="dash-card brand-gradient-bg relative overflow-hidden min-h-[160px] flex flex-col justify-between shadow-brand">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-white/80">My balance</p>
                <p className="text-3xl font-bold text-white mt-1">{formatCurrency(data.totalBalance)}</p>
              </div>
              <Link href="/dashboard/accounts" className="text-xs text-white/70 hover:text-white transition-colors mt-2">
                See details →
              </Link>
            </div>

            <div className="dash-card flex flex-col justify-between min-h-[160px]">
              <p className="text-sm text-text-secondary">Savings account</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(data.savingsBalance)}</p>
            </div>

            <div className="dash-card flex flex-col justify-between min-h-[160px]">
              <p className="text-sm text-text-secondary">Investment portfolio</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(data.investmentValue)}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="dash-card">
              <h2 className="text-base font-semibold text-white mb-4">My Wallet</h2>
              {data.wallets.length === 0 ? (
                <p className="text-sm text-text-secondary">No accounts linked yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {data.wallets.map((w) => (
                    <div key={w.id} className="p-4 rounded-xl bg-bg-primary border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl">{w.flag}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${w.active ? "bg-accent-green/15 text-accent-green" : "bg-accent-red/15 text-accent-red"}`}>
                          {w.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">{w.currency}</p>
                      <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(w.balance, w.currency)}</p>
                      <p className="text-[10px] text-text-muted mt-2">{w.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dash-card">
              <h2 className="text-base font-semibold text-white mb-4">Cash Flow</h2>
              {data.cashFlowData.every((m) => m.value === 0) ? (
                <EmptyState title="No cash flow data" description="Transaction activity will populate this chart over time." />
              ) : (
                <ChartContainer className="h-52 min-h-[208px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.cashFlowData} barCategoryGap="18%">
                      <XAxis dataKey="month" stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "rgba(255,95,5,0.08)" }} formatter={(v) => [formatCurrency(Number(v ?? 0)), "Cashflow"]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.cashFlowData.map((entry) => (
                          <Cell key={entry.month} fill={entry.month === activeMonth ? CHART_BRAND : CHART_MUTED} onClick={() => setActiveMonth(entry.month)} style={{ cursor: "pointer" }} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </div>

          <div className="dash-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Recent Activities</h2>
            </div>
            {data.activities.length === 0 ? (
              <p className="text-sm text-text-secondary py-8 text-center">No recent transactions.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-secondary text-xs border-b border-white/10">
                      <th className="text-left py-3 font-medium">Activity</th>
                      <th className="text-left py-3 font-medium">Reference</th>
                      <th className="text-left py-3 font-medium">Date</th>
                      <th className="text-left py-3 font-medium">Time</th>
                      <th className="text-right py-3 font-medium">Amount</th>
                      <th className="text-right py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.activities.map((a) => {
                      const Icon = activityIcons[a.type] ?? Wallet;
                      return (
                        <tr key={a.id} className="border-b border-white/5 hover:bg-bg-primary/50 transition-colors">
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-bg-primary border border-white/10 flex items-center justify-center">
                                <Icon size={14} className="text-accent-brand" />
                              </div>
                              <span className="text-white font-medium">{a.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-text-secondary">{a.orderId}</td>
                          <td className="py-3.5 text-text-secondary">{a.date}</td>
                          <td className="py-3.5 text-text-secondary">{a.time}</td>
                          <td className={`py-3.5 text-right font-mono font-medium ${a.price >= 0 ? "text-accent-green" : "text-white"}`}>
                            {a.price >= 0 ? "+" : ""}{formatCurrency(a.price)}
                          </td>
                          <td className="py-3.5 text-right">
                            <span className="inline-flex items-center gap-1.5 text-xs text-white">
                              <span className={`h-1.5 w-1.5 rounded-full ${a.status === "Completed" ? "bg-accent-green" : a.status === "Failed" ? "bg-accent-red" : "bg-accent-gold"}`} />
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardGate>
  );
}
