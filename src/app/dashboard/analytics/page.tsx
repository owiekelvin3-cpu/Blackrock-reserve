"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Card from "@/components/ui/Card";
import DashboardGate from "@/components/dashboard/DashboardGate";
import EmptyState from "@/components/dashboard/EmptyState";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { fetchJson } from "@/lib/fetch-json";
import ChartContainer from "@/components/ui/ChartContainer";

interface AnalyticsData {
  monthlySpending: { category: string; amount: number }[];
  allocation: { name: string; value: number; color: string }[];
}

export default function AnalyticsPage() {
  const chartTheme = useChartTheme();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<AnalyticsData>("/api/dashboard/analytics")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = !data || (data.monthlySpending.length === 0 && data.allocation.length === 0);

  return (
    <DashboardGate
      isLoading={loading}
      isEmpty={isEmpty}
      emptyTitle="No analytics data"
      emptyDescription="Analytics will populate as you make transactions and investments."
    >
      {data && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="font-semibold text-text-primary mb-6">Spending by Type</h2>
            {data.monthlySpending.length === 0 ? (
              <EmptyState title="No spending data" description="Transaction history will appear here." />
            ) : (
              <ChartContainer className="h-72 min-h-[288px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlySpending}>
                    <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Bar dataKey="amount" fill="#FF5F05" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold text-text-primary mb-6">Portfolio Allocation</h2>
            {data.allocation.length === 0 ? (
              <EmptyState title="No allocation data" description="Add accounts or investments to see allocation." />
            ) : (
              <>
                <ChartContainer className="h-72 min-h-[288px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.allocation} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                        {data.allocation.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTheme.tooltip} formatter={(v) => [`${Number(v ?? 0)}%`, "Allocation"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {data.allocation.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                      {item.name} ({item.value}%)
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </DashboardGate>
  );
}
