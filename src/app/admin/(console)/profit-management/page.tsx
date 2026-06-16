"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, TrendingUp, TrendingDown, History } from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminRefreshButton,
  AdminFormPanel,
  AdminStatGrid,
  AdminStatCard,
  AdminDataCard,
  AdminTableScroll,
  AdminMobileList,
  AdminMobileCard,
  AdminToolbar,
  AdminSearchField,
} from "@/components/admin/AdminUi";
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
    <AdminPage>
      <AdminPageHeader
        title="Profit Management"
        description="Credit or remove investment profits — updates balances, transactions, and sends notifications"
        action={<AdminRefreshButton onClick={refresh} label="Refresh records" />}
      />

      <AdminFormPanel
        title="Find user"
        description="Search by name or email to adjust profit balances."
      >
        <AdminToolbar className="mb-4">
          <AdminSearchField
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email…"
            className="flex-1 max-w-none"
          />
          <button
            type="button"
            onClick={runSearch}
            disabled={searching}
            className="admin-btn-primary px-6 py-2 text-sm inline-flex items-center gap-2 min-h-[40px]"
          >
            <Search size={16} />
            {searching ? "Searching…" : "Search"}
          </button>
        </AdminToolbar>

        {users.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
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
                    : "border-[var(--admin-border)] hover:border-accent-brand/30"
                }`}
              >
                <p className="font-medium">{u.name}</p>
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
          <div className="pt-4 border-t border-[var(--admin-border)]">
            <h3 className="font-semibold mb-3">Adjust profit for {selected.name}</h3>
            <AdminStatGrid cols={3}>
              <AdminStatCard label="Main balance" value={formatCurrency(selected.mainBalance)} />
              <AdminStatCard label="Invested" value={formatCurrency(selected.investedBalance)} accent="brand" />
              <AdminStatCard label="Profit balance" value={formatCurrency(selected.profitBalance)} accent="green" />
            </AdminStatGrid>
            <div className="grid sm:grid-cols-2 gap-3 mt-4 mb-4">
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
      </AdminFormPanel>

      <div className="flex items-center gap-2">
        <History size={18} className="text-accent-brand" />
        <h2 className="font-semibold">Profit records</h2>
      </div>

      <AdminDataCard noPadding>
        <AdminFetchState
          loading={loading}
          error={error}
          isEmpty={!loading && records.length === 0}
          onRetry={refresh}
          lastUpdated={lastUpdated}
          emptyMessage="No profit records yet"
        >
          <AdminMobileList>
            {records.map((r) => (
              <AdminMobileCard key={r.id}>
                <p className="font-medium">{r.userName}</p>
                <p className="text-xs text-[var(--admin-muted)]">{r.userEmail}</p>
                <div className="flex gap-2 mt-2 mb-2">
                  <span className={r.type === "CREDIT" ? "text-emerald-400" : "text-red-400"}>{r.type}</span>
                  <span className="font-mono">{formatCurrency(r.amount)}</span>
                </div>
                <p className="text-[10px] text-[var(--admin-muted)]">
                  {new Date(r.createdAt).toLocaleString()} · {r.adminName}
                </p>
              </AdminMobileCard>
            ))}
          </AdminMobileList>

          <AdminTableScroll className="admin-desktop-table">
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
          </AdminTableScroll>
        </AdminFetchState>
      </AdminDataCard>
    </AdminPage>
  );
}
