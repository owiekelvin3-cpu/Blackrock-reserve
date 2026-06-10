"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, TrendingUp, TrendingDown, History } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import { useAdminFetch } from "@/hooks/use-admin-fetch";
import { formatCurrency } from "@/lib/utils";

interface UserResult {
  id: string;
  name: string;
  email: string;
  profitBalance: number;
  investedBalance: number;
  mainBalance: number;
  accounts: { id: string; name: string; type: string; balance: number }[];
}

interface ProfitRecord {
  id: string;
  transactionId: string | null;
  userName: string;
  userEmail: string;
  adminName: string;
  type: string;
  amount: number;
  reason: string;
  profitBefore: number;
  profitAfter: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export default function AdminProfitManagementPage() {
  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<{ records: ProfitRecord[] }>(
    "/api/admin/profit"
  );
  const records = data?.records ?? [];

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [accountId, setAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const runSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/profit?q=${encodeURIComponent(search.trim())}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setUsers(json.users ?? []);
      if ((json.users ?? []).length === 0) toast.message("No users found");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const submit = async (action: "add" | "remove") => {
    if (!selected) {
      toast.error("Select a user first");
      return;
    }
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/profit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          userId: selected.id,
          amount: num,
          reason: reason.trim(),
          accountId: accountId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");

      toast.success(action === "add" ? "Profit credited successfully" : "Profit removed successfully");
      setSelected({
        ...selected,
        profitBalance: json.profitBalance,
        investedBalance: json.investedBalance,
        mainBalance: json.mainBalance,
      });
      setAmount("");
      setReason("");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Profit Management"
        description="Credit or remove investment profits — updates user profit balance, main balance, transactions, and sends email notifications"
        action={
          <button type="button" onClick={refresh} className="admin-btn-ghost text-xs px-4 py-2">
            Refresh records
          </button>
        }
      />

      <div className="admin-card p-5 mb-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Search size={18} /> Find User
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            className="admin-input flex-1"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <button type="button" onClick={runSearch} disabled={searching} className="admin-btn-primary px-6 py-2 text-sm">
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {users.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setSelected(u);
                  setAccountId(u.accounts[0]?.id ?? "");
                }}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  selected?.id === u.id
                    ? "border-accent-brand bg-accent-brand/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <p className="font-medium text-white">{u.name}</p>
                <p className="text-xs text-[var(--admin-muted)]">{u.email}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs font-mono">
                  <span className="text-[var(--admin-muted)]">Main: {formatCurrency(u.mainBalance)}</span>
                  <span className="text-accent-brand">Invested: {formatCurrency(u.investedBalance)}</span>
                  <span className="text-emerald-400">Profit: {formatCurrency(u.profitBalance)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="font-semibold text-white mb-3">Adjust profit for {selected.name}</h3>
            <div className="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
              <div className="admin-card p-3">
                <p className="text-[var(--admin-muted)] text-xs">Main Balance</p>
                <p className="font-mono font-bold text-white">{formatCurrency(selected.mainBalance)}</p>
              </div>
              <div className="admin-card p-3">
                <p className="text-[var(--admin-muted)] text-xs">Invested Balance</p>
                <p className="font-mono font-bold text-white">{formatCurrency(selected.investedBalance)}</p>
              </div>
              <div className="admin-card p-3">
                <p className="text-[var(--admin-muted)] text-xs">Profit Balance</p>
                <p className="font-mono font-bold text-emerald-400">{formatCurrency(selected.profitBalance)}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <input
                className="admin-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Profit amount (USD)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {selected.accounts.length > 1 && (
                <select
                  className="admin-input"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  {selected.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              )}
              <textarea
                className="admin-input sm:col-span-2 min-h-[80px]"
                placeholder="Reason (required for audit log)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => submit("add")}
                className="admin-btn-primary inline-flex items-center gap-2 px-5 py-2 text-sm"
              >
                <TrendingUp size={16} /> Add Profit
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => submit("remove")}
                className="admin-btn-ghost inline-flex items-center gap-2 px-5 py-2 text-sm border border-red-500/30 text-red-400"
              >
                <TrendingDown size={16} /> Remove Profit
              </button>
            </div>
          </div>
        )}
      </div>

      <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
        <History size={18} /> Profit Records
      </h2>
      <AdminFetchState loading={loading} error={error} isEmpty={!loading && records.length === 0} onRetry={refresh} lastUpdated={lastUpdated}>
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table w-full min-w-[900px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Profit After</th>
                  <th>Balance After</th>
                  <th>Admin</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="text-[var(--admin-muted)] text-sm whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <p className="font-medium">{r.userName}</p>
                      <p className="text-xs text-[var(--admin-muted)]">{r.userEmail}</p>
                    </td>
                    <td>
                      <span className={r.type === "CREDIT" ? "text-emerald-400" : "text-red-400"}>
                        {r.type}
                      </span>
                    </td>
                    <td className="font-mono">{formatCurrency(r.amount)}</td>
                    <td className="font-mono">{formatCurrency(r.profitAfter)}</td>
                    <td className="font-mono">{formatCurrency(r.balanceAfter)}</td>
                    <td className="text-sm">{r.adminName}</td>
                    <td className="font-mono text-xs text-[var(--admin-muted)]">
                      {r.transactionId ? `#${r.transactionId.slice(-8).toUpperCase()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminFetchState>
    </div>
  );
}
