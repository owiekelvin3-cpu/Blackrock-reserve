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
  const [investedBalance, setInvestedBalance] = useState(0);
  const [profitBalance, setProfitBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<{ holdings: Holding[]; investedBalance: number; profitBalance: number }>(
      "/api/dashboard/investments"
    )
      .then((json) => {
        setHoldings(json?.holdings ?? []);
        setInvestedBalance(json?.investedBalance ?? 0);
        setProfitBalance(json?.profitBalance ?? 0);
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
            <p className="text-sm text-text-secondary">Invested Balance</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-text-primary mt-1">
              {formatCurrency(investedBalance)}
            </p>
            <p className="text-xs text-text-muted mt-1">Total capital deployed in investments</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Profit Balance</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-accent-brand mt-1">
              {formatCurrency(profitBalance)}
            </p>
            <p className="text-xs text-text-muted mt-1">Admin-credited profits only</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Active Holdings</p>
            <p className="font-mono text-2xl font-bold text-text-primary mt-1">{holdings.length}</p>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-text-primary">Holdings</h2>
            <Button size="sm" disabled>Trade</Button>
          </div>
          <div className="md:hidden space-y-3">
            {holdings.map((h) => (
              <div key={h.id} className="dash-holding-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="gold">{h.symbol}</Badge>
                    <span className="text-sm text-text-secondary truncate">{h.name}</span>
                  </div>
                  <p className="font-mono text-sm font-semibold text-text-primary shrink-0">
                    {formatCurrency(h.value)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5 text-xs">
                  <div>
                    <p className="text-text-muted">Shares</p>
                    <p className="font-mono text-text-primary mt-0.5">{h.shares}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted">Avg Price</p>
                    <p className="font-mono text-text-primary mt-0.5">{formatCurrency(h.avgPrice)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
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
