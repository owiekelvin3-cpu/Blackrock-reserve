"use client";

import { Plus, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DashboardGate from "@/components/dashboard/DashboardGate";
import { formatCurrency } from "@/lib/utils";
import { fetchJson } from "@/lib/fetch-json";

interface Account {
  id: string;
  name: string;
  number: string;
  balance: number;
  currency: string;
  type: string;
}

export default function AccountsPage() {
  const [showBalances, setShowBalances] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<{ accounts: Account[] }>("/api/dashboard/accounts")
      .then((json) => setAccounts(json?.accounts ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardGate
      isLoading={loading}
      isEmpty={accounts.length === 0}
      emptyTitle="No accounts yet"
      emptyDescription="Your bank accounts will appear here once your account is set up."
    >
      <>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-brand transition-colors"
          >
            {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
            {showBalances ? "Hide balances" : "Show balances"}
          </button>
          <Button size="sm" disabled><Plus size={16} /> New Account</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card key={account.id} hover>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="gold" className="capitalize">{account.type}</Badge>
                <span className="text-xs text-text-muted">{account.currency}</span>
              </div>
              <h3 className="font-semibold text-text-primary">{account.name}</h3>
              <p className="text-sm text-text-muted mt-1">{account.number}</p>
              <p className="font-mono text-2xl font-bold text-text-primary mt-4">
                {showBalances ? formatCurrency(account.balance, account.currency) : "••••••"}
              </p>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm" className="flex-1">Transfer</Button>
                <Button size="sm" className="flex-1">Details</Button>
              </div>
            </Card>
          ))}
        </div>
      </>
    </DashboardGate>
  );
}
