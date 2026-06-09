"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DashboardGate from "@/components/dashboard/DashboardGate";
import { formatCurrency } from "@/lib/utils";
import { fetchJson } from "@/lib/fetch-json";

interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  value: number;
}

export default function InvestmentsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<{ holdings: Holding[]; totalValue: number }>("/api/dashboard/investments")
      .then((json) => {
        setHoldings(json?.holdings ?? []);
        setTotalValue(json?.totalValue ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardGate
      isLoading={loading}
      isEmpty={holdings.length === 0}
      emptyTitle="No investments yet"
      emptyDescription="Start building your portfolio by making your first investment."
      emptyActionLabel="Explore Investments"
      emptyActionHref="/investments"
    >
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <p className="text-sm text-text-secondary">Total Value</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-text-primary mt-1">{formatCurrency(totalValue)}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Holdings</p>
            <p className="font-mono text-2xl font-bold text-text-primary mt-1">{holdings.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Avg. Cost Basis</p>
            <p className="font-mono text-2xl font-bold text-text-primary mt-1">
              {holdings.length > 0
                ? formatCurrency(holdings.reduce((s, h) => s + h.avgPrice, 0) / holdings.length)
                : formatCurrency(0)}
            </p>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-text-primary">Holdings</h2>
            <Button size="sm" disabled>Trade</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="text-left py-3 font-medium">Asset</th>
                  <th className="text-right py-3 font-medium">Shares</th>
                  <th className="text-right py-3 font-medium">Avg Price</th>
                  <th className="text-right py-3 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id} className="border-b border-border/50 hover:bg-bg-tertiary/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="gold">{h.symbol}</Badge>
                        <span className="text-text-secondary">{h.name}</span>
                      </div>
                    </td>
                    <td className="text-right font-mono text-text-primary">{h.shares}</td>
                    <td className="text-right font-mono text-text-primary">{formatCurrency(h.avgPrice)}</td>
                    <td className="text-right font-mono text-text-primary">{formatCurrency(h.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    </DashboardGate>
  );
}
