"use client";

import Link from "next/link";
import {
  AdminPage,
  AdminPageHeader,
  AdminRefreshButton,
  AdminStatGrid,
  AdminStatCard,
  AdminDataCard,
  AdminTableScroll,
  AdminMobileList,
  AdminMobileCard,
  AdminKycBadge,
} from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import { useAdminFetch } from "@/hooks/use-admin-fetch";
import { formatCurrency } from "@/lib/utils";

interface AccountRow {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  userId: string;
  userName: string;
  userEmail: string;
  userKyc: string;
  createdAt: string;
}

export default function AdminAccountsPage() {
  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<{ accounts: AccountRow[] }>("/api/admin/accounts");
  const accounts = data?.accounts ?? [];
  const totalAum = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <AdminPage>
      <AdminPageHeader
        title="Bank Accounts"
        description="All customer accounts — adjust funds from each user profile"
        action={<AdminRefreshButton onClick={refresh} />}
      />

      <AdminStatGrid cols={3}>
        <AdminStatCard label="Total accounts" value={accounts.length} />
        <AdminStatCard label="Total balance" value={formatCurrency(totalAum)} accent="gold" />
        <AdminStatCard
          label="Average balance"
          value={accounts.length ? formatCurrency(totalAum / accounts.length) : "—"}
        />
      </AdminStatGrid>

      <AdminDataCard noPadding>
        <AdminFetchState
          loading={loading}
          error={error}
          onRetry={refresh}
          lastUpdated={lastUpdated}
          isEmpty={!loading && !error && accounts.length === 0}
          emptyMessage="No bank accounts in the database"
        >
          <AdminMobileList>
            {accounts.map((a) => (
              <AdminMobileCard key={a.id}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-[10px] text-[var(--admin-muted)]">{a.type}</p>
                  </div>
                  <AdminKycBadge status={a.userKyc} />
                </div>
                <Link href={`/admin/users/${a.userId}`} className="admin-link text-xs">
                  {a.userName}
                </Link>
                <p className="text-[10px] text-[var(--admin-muted)]">{a.userEmail}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="admin-amount">{formatCurrency(a.balance, a.currency)}</p>
                  <Link href={`/admin/users/${a.userId}`} className="admin-btn-primary text-xs py-1.5 px-3">
                    Adjust
                  </Link>
                </div>
              </AdminMobileCard>
            ))}
          </AdminMobileList>

          <AdminTableScroll className="admin-desktop-table">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Account</th>
                  <th className="text-left">Owner</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">KYC</th>
                  <th className="text-right">Balance</th>
                  <th className="text-right">Opened</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="text-sm">{a.name}</td>
                    <td>
                      <Link href={`/admin/users/${a.userId}`} className="admin-link">{a.userName}</Link>
                      <p className="text-[10px] text-[var(--admin-muted)]">{a.userEmail}</p>
                    </td>
                    <td className="text-xs text-[var(--admin-muted)]">{a.type}</td>
                    <td><AdminKycBadge status={a.userKyc} /></td>
                    <td className="text-right admin-amount text-sm">
                      {formatCurrency(a.balance, a.currency)}
                    </td>
                    <td className="text-right text-xs text-[var(--admin-muted)]">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Link href={`/admin/users/${a.userId}`} className="admin-btn-primary text-xs py-1.5 px-3 inline-block">
                        Adjust Balance
                      </Link>
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
