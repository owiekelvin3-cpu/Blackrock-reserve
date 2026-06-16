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
} from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import { useAdminFetch } from "@/hooks/use-admin-fetch";
import { formatCurrency } from "@/lib/utils";

interface InvestmentRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  symbol: string;
  assetName: string;
  amountUsd: number;
  shares: number;
  fee: number;
  totalCost: number;
  status: string;
  createdAt: string;
}

interface InvestmentsData {
  orders: InvestmentRow[];
  stats: { totalOrders: number; totalVolume: number; totalCost: number };
}

export default function AdminInvestmentsPage() {
  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<InvestmentsData>("/api/admin/investments");
  const orders = data?.orders ?? [];
  const stats = data?.stats;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Platform Investments"
        description="Monitor all user investment activity and total platform investment volume"
        action={<AdminRefreshButton onClick={refresh} />}
      />

      {stats && (
        <AdminStatGrid cols={3}>
          <AdminStatCard label="Total orders" value={stats.totalOrders} />
          <AdminStatCard label="Investment volume" value={formatCurrency(stats.totalVolume)} accent="brand" />
          <AdminStatCard label="Total cost (incl. fees)" value={formatCurrency(stats.totalCost)} accent="gold" />
        </AdminStatGrid>
      )}

      <AdminDataCard noPadding>
        <AdminFetchState
          loading={loading}
          error={error}
          isEmpty={!loading && orders.length === 0}
          onRetry={refresh}
          lastUpdated={lastUpdated}
          emptyMessage="No investment orders yet"
        >
          <AdminMobileList>
            {orders.map((o) => (
              <AdminMobileCard key={o.id}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono font-semibold">{o.symbol}</span>
                    <p className="text-xs text-[var(--admin-muted)]">{o.assetName}</p>
                  </div>
                  <span className="admin-badge admin-badge-submitted text-[10px]">{o.status}</span>
                </div>
                <Link href={`/admin/users/${o.userId}`} className="admin-link text-xs">
                  {o.userName}
                </Link>
                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                  <div>
                    <p className="text-[var(--admin-muted)]">Amount</p>
                    <p className="font-mono">{formatCurrency(o.amountUsd)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--admin-muted)]">Total</p>
                    <p className="font-mono font-semibold">{formatCurrency(o.totalCost)}</p>
                  </div>
                </div>
              </AdminMobileCard>
            ))}
          </AdminMobileList>

          <AdminTableScroll className="admin-desktop-table">
            <table className="admin-table w-full min-w-[800px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Asset</th>
                  <th>Amount</th>
                  <th>Shares</th>
                  <th>Fee</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="text-[var(--admin-muted)] text-sm whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <Link href={`/admin/users/${o.userId}`} className="admin-link">
                        {o.userName}
                      </Link>
                      <p className="text-xs text-[var(--admin-muted)]">{o.userEmail}</p>
                    </td>
                    <td>
                      <span className="font-mono font-semibold">{o.symbol}</span>
                      <p className="text-xs text-[var(--admin-muted)]">{o.assetName}</p>
                    </td>
                    <td className="font-mono">{formatCurrency(o.amountUsd)}</td>
                    <td className="font-mono text-sm">{o.shares.toFixed(4)}</td>
                    <td className="font-mono text-[var(--admin-muted)]">{formatCurrency(o.fee)}</td>
                    <td className="font-mono font-semibold">{formatCurrency(o.totalCost)}</td>
                    <td>
                      <span className="admin-badge admin-badge-submitted text-[10px]">{o.status}</span>
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
