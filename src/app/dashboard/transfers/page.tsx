"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import DashboardGate from "@/components/dashboard/DashboardGate";
import EmptyState from "@/components/dashboard/EmptyState";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { fetchJson } from "@/lib/fetch-json";

interface Account {
  id: string;
  name: string;
  number: string;
  balance: number;
}

interface Transfer {
  id: string;
  to: string;
  amount: number;
  date: string;
  status: string;
}

export default function TransfersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recent, setRecent] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    fetchJson<{ accounts: Account[]; recent: Transfer[] }>("/api/dashboard/transfers")
      .then((json) => {
        setAccounts(json?.accounts ?? []);
        setRecent(json?.recent ?? []);
        if (json?.accounts?.length) setAccountId(json.accounts[0].id);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/dashboard/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, recipient, amount: Number(amount), note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Transfer failed");

      toast.success(`Transfer of ${formatCurrency(Number(amount))} completed`);
      setAmount("");
      setRecipient("");
      setNote("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardGate isLoading={loading}>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold text-text-primary mb-6">New Transfer</h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-text-secondary">Add an account before making transfers.</p>
          ) : (
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">From Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-text-primary focus:border-accent-brand focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.number}) — {formatCurrency(a.balance)}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Recipient Email or Account" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="recipient@email.com" required />
              <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01" required />
              <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's this for?" />
              <Button type="submit" isLoading={isSubmitting} className="w-full">Send Transfer</Button>
            </form>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-text-primary mb-6">Recent Transfers</h2>
          {recent.length === 0 ? (
            <EmptyState title="No transfers yet" description="Your transfer history will appear here." />
          ) : (
            <div className="space-y-4">
              {recent.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{tx.to}</p>
                    <p className="text-xs text-text-muted">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-text-primary">-{formatCurrency(tx.amount)}</p>
                    <p className="text-xs text-accent-green capitalize">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardGate>
  );
}
