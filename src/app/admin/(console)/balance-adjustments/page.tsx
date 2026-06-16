"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminPage,
  AdminPageHeader,
  AdminRefreshButton,
  AdminFormPanel,
  AdminDataCard,
  AdminTableScroll,
  AdminMobileList,
  AdminMobileCard,
} from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import AdminBalanceAdjustForm from "@/components/admin/AdminBalanceAdjustForm";
import { useAdminFetch } from "@/hooks/use-admin-fetch";
import { formatCurrency } from "@/lib/utils";

interface Adjustment {
  id: string;
  type: string;
  amount: number;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
  admin: { name: string; email: string };
  account: { name: string; currency: string };
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface UserDetail {
  accounts: { id: string; name: string; currency: string; balance: number }[];
}

export default function AdminBalanceAdjustmentsPage() {
  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<{ adjustments: Adjustment[] }>(
    "/api/admin/balance-adjustments?limit=100"
  );
  const { data: usersData } = useAdminFetch<{ users: UserOption[] }>("/api/admin/users");
  const adjustments = data?.adjustments ?? [];
  const users = useMemo(() => usersData?.users ?? [], [usersData?.users]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [userAccounts, setUserAccounts] = useState<UserDetail["accounts"]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (!selectedUserId) {
      setUserAccounts([]);
      return;
    }

    let cancelled = false;
    setLoadingAccounts(true);
    fetch(`/api/admin/users/${selectedUserId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((json: UserDetail) => {
        if (!cancelled) setUserAccounts(json.accounts ?? []);
      })
      .catch(() => {
        if (!cancelled) setUserAccounts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAccounts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId]
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Balance Adjustments"
        description="Add or remove customer funds and review adjustment history"
        action={<AdminRefreshButton onClick={refresh} />}
      />

      <AdminFormPanel
        title="Adjust customer balance"
        description="Select a user, then add or remove funds from their account."
      >
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-[var(--admin-muted)] mb-1.5">Customer</label>
            <select
              className="admin-input w-full"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email}
                </option>
              ))}
            </select>
            {selectedUser && (
              <p className="text-xs text-[var(--admin-muted)] mt-2">
                <Link href={`/admin/users/${selectedUser.id}`} className="admin-link">
                  Open full profile & credentials
                </Link>
              </p>
            )}
          </div>
          <div>
            {loadingAccounts ? (
              <p className="text-sm text-[var(--admin-muted)]">Loading accounts...</p>
            ) : selectedUserId ? (
              <AdminBalanceAdjustForm
                userId={selectedUserId}
                accounts={userAccounts}
                onSuccess={() => {
                  refresh();
                  fetch(`/api/admin/users/${selectedUserId}`, { credentials: "include" })
                    .then((res) => res.json())
                    .then((json: UserDetail) => setUserAccounts(json.accounts ?? []));
                }}
                compact
              />
            ) : (
              <p className="text-sm text-[var(--admin-muted)]">Choose a user to adjust their balance.</p>
            )}
          </div>
        </div>
      </AdminFormPanel>

      <AdminDataCard noPadding>
        <AdminFetchState
          loading={loading}
          error={error}
          onRetry={refresh}
          lastUpdated={lastUpdated}
          isEmpty={!loading && !error && adjustments.length === 0}
          emptyMessage="No balance adjustments in the database"
        >
          <AdminMobileList>
            {adjustments.map((a) => (
              <AdminMobileCard key={a.id}>
                <Link href={`/admin/users/${a.user.id}`} className="admin-link text-sm font-medium">
                  {a.user.name}
                </Link>
                <p className="text-[10px] text-[var(--admin-muted)]">{a.user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  <span className={`admin-badge ${a.type === "CREDIT" ? "admin-badge-verified" : "admin-badge-rejected"}`}>
                    {a.type}
                  </span>
                  <span className="admin-amount text-sm">{formatCurrency(a.amount, a.account.currency)}</span>
                </div>
                <p className="text-xs text-[var(--admin-muted)]">{a.reason}</p>
                <p className="text-[10px] text-[var(--admin-muted)] mt-2">
                  {new Date(a.createdAt).toLocaleString()} · {a.admin.name}
                </p>
              </AdminMobileCard>
            ))}
          </AdminMobileList>

          <AdminTableScroll className="admin-desktop-table">
            <table className="admin-table w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="text-left">User</th>
                  <th className="text-left">Type</th>
                  <th className="text-right">Amount</th>
                  <th className="text-left">Reason</th>
                  <th className="text-left">Admin</th>
                  <th className="text-right">Before → After</th>
                  <th className="text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/admin/users/${a.user.id}`} className="admin-link text-sm">{a.user.name}</Link>
                      <p className="text-[10px] text-[var(--admin-muted)]">{a.user.email}</p>
                    </td>
                    <td>
                      <span className={`admin-badge ${a.type === "CREDIT" ? "admin-badge-verified" : "admin-badge-rejected"}`}>{a.type}</span>
                    </td>
                    <td className="text-right admin-amount">{formatCurrency(a.amount, a.account.currency)}</td>
                    <td className="text-sm text-[var(--admin-muted)] max-w-[200px]">{a.reason}</td>
                    <td className="text-xs text-[var(--admin-muted)]">{a.admin.name}</td>
                    <td className="text-right text-xs font-mono text-[var(--admin-muted)]">
                      {formatCurrency(a.balanceBefore)} → {formatCurrency(a.balanceAfter)}
                    </td>
                    <td className="text-right text-xs text-[var(--admin-muted)]">
                      {new Date(a.createdAt).toLocaleString()}
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
