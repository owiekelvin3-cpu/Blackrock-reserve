"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  BadgeCheck,
  LayoutGrid,
} from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminRefreshButton,
  AdminDataCard,
  AdminKycBadge,
} from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import { clearAdminFetchCacheByPrefix, useAdminFetch } from "@/hooks/use-admin-fetch";
import { formatCurrency, cn } from "@/lib/utils";

interface OverviewData {
  stats: {
    totalUsers: number;
    pendingKyc: number;
    totalTransactions: number;
    totalAccounts: number;
    totalAum: number;
    contactMessages: number;
    pendingDeposits: number;
    totalDepositRequests: number;
    pendingWithdrawals: number;
    totalWithdrawalRequests: number;
    withdrawalCount: number;
    depositTxCount: number;
  };
  recentUsers: { id: string; name: string; email: string; kycStatus: string; createdAt: string }[];
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    description: string;
    status: string;
    createdAt: string;
    userName: string;
    userEmail: string;
  }[];
  pendingKycUsers: { id: string; name: string; email: string; kycStatus: string }[];
  recentDeposits: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amountUsd: number | null;
    status: string;
    txHash: string | null;
    createdAt: string;
  }[];
  usersByKyc: { status: string; count: number }[];
  txByType: { type: string; count: number; volume: number }[];
  depositsByStatus: { status: string; count: number }[];
}

type HeroMetric = {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Users;
  accent?: "brand" | "gold" | "green" | "neutral";
};

type AlertItem = {
  label: string;
  count: number;
  href: string;
  icon: typeof Users;
  tone: "warning" | "danger" | "info" | "neutral";
};

const QUICK_LINKS = [
  { href: "/admin/deposits", label: "Deposits", icon: ArrowDownToLine },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/kyc", label: "KYC Review", icon: ShieldCheck },
  { href: "/admin/verification-badges", label: "Badges", icon: BadgeCheck },
  { href: "/admin/transactions", label: "Transactions", icon: Banknote },
] as const;

const CHART_COLORS = [
  "linear-gradient(90deg, #ff5f05 0%, #ff8c42 100%)",
  "linear-gradient(90deg, #d4a017 0%, #f5d78e 100%)",
  "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)",
  "linear-gradient(90deg, #6366f1 0%, #818cf8 100%)",
  "linear-gradient(90deg, #ef4444 0%, #f87171 100%)",
];

function OverviewChart({
  title,
  subtitle,
  items,
  labelKey,
  valueKey,
}: {
  title: string;
  subtitle?: string;
  items: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
}) {
  const max = Math.max(...items.map((i) => Number(i[valueKey]) || 0), 1);
  const total = items.reduce((sum, i) => sum + (Number(i[valueKey]) || 0), 0);

  return (
    <div className="admin-overview-chart">
      <div className="admin-overview-chart-head">
        <div>
          <h3 className="admin-overview-chart-title">{title}</h3>
          {subtitle && <p className="admin-overview-chart-sub">{subtitle}</p>}
        </div>
        {total > 0 && <span className="admin-overview-chart-total">{total.toLocaleString()}</span>}
      </div>
      {items.length === 0 ? (
        <p className="admin-overview-empty">No data yet</p>
      ) : (
        <div className="admin-overview-chart-bars">
          {items.map((item, index) => {
            const value = Number(item[valueKey]) || 0;
            const pct = Math.round((value / max) * 100);
            return (
              <div key={String(item[labelKey])} className="admin-overview-bar-row">
                <div className="admin-overview-bar-meta">
                  <span className="admin-overview-bar-label">{String(item[labelKey])}</span>
                  <span className="admin-overview-bar-value">{value.toLocaleString()}</span>
                </div>
                <div className="admin-overview-bar-track">
                  <div
                    className="admin-overview-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricTile({ label, value, sub, icon: Icon, accent = "neutral" }: HeroMetric) {
  return (
    <div className={cn("admin-overview-metric", `admin-overview-metric-${accent}`)}>
      <div className="admin-overview-metric-icon">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="admin-overview-metric-copy">
        <p className="admin-overview-metric-label">{label}</p>
        <p className="admin-overview-metric-value">{value}</p>
        {sub && <p className="admin-overview-metric-sub">{sub}</p>}
      </div>
    </div>
  );
}

function ActivityPanel({
  title,
  href,
  linkLabel,
  count,
  children,
  className,
}: {
  title: string;
  href: string;
  linkLabel: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("admin-overview-panel", className)}>
      <div className="admin-overview-panel-head">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="admin-overview-panel-title">{title}</h3>
          {count != null && count > 0 && (
            <span className="admin-overview-panel-count">{count}</span>
          )}
        </div>
        <Link href={href} className="admin-overview-panel-link">
          {linkLabel}
          <ChevronRight size={14} />
        </Link>
      </div>
      <div className="admin-overview-panel-body">{children}</div>
    </section>
  );
}

function UserInitial({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return <span className="admin-overview-avatar">{initial}</span>;
}

function depositStatusClass(status: string) {
  if (status === "PENDING") return "admin-badge-submitted";
  if (status === "APPROVED") return "admin-badge-verified";
  return "admin-badge-rejected";
}

function txStatusClass(status: string) {
  if (status === "COMPLETED") return "admin-badge-verified";
  if (status === "PENDING") return "admin-badge-submitted";
  return "admin-badge-rejected";
}

function OverviewSkeleton() {
  return (
    <div className="admin-overview-skeleton">
      <div className="admin-overview-skeleton-featured" />
      <div className="admin-overview-skeleton-metrics" />
      <div className="admin-overview-skeleton-row" />
      <div className="admin-overview-skeleton-charts" />
      <div className="admin-overview-skeleton-panels" />
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<OverviewData>("/api/admin/overview", {
    pollMs: 90_000,
  });

  const stats = data?.stats;

  const heroMetrics: HeroMetric[] = stats
    ? [
        {
          label: "Registered clients",
          value: stats.totalUsers.toLocaleString(),
          sub: `${stats.pendingKyc} pending KYC`,
          icon: Users,
          accent: "brand",
        },
        {
          label: "Transactions",
          value: stats.totalTransactions.toLocaleString(),
          sub: `${stats.depositTxCount.toLocaleString()} deposit txns`,
          icon: Banknote,
          accent: "green",
        },
        {
          label: "Operations queue",
          value: (stats.pendingDeposits + stats.pendingWithdrawals).toLocaleString(),
          sub: "Awaiting admin action",
          icon: Wallet,
          accent: "neutral",
        },
      ]
    : [];

  const alertItems: AlertItem[] = stats
    ? ([
        {
          label: "Pending deposits",
          count: stats.pendingDeposits,
          href: "/admin/deposits",
          icon: ArrowDownToLine,
          tone: "warning",
        },
        {
          label: "Pending withdrawals",
          count: stats.pendingWithdrawals,
          href: "/admin/withdrawals",
          icon: ArrowUpFromLine,
          tone: "danger",
        },
        {
          label: "KYC review",
          count: stats.pendingKyc,
          href: "/admin/kyc",
          icon: ShieldCheck,
          tone: "info",
        },
        {
          label: "Support messages",
          count: stats.contactMessages,
          href: "/admin/messages",
          icon: MessageSquare,
          tone: "neutral",
        },
      ] as AlertItem[])
    : [];

  const pendingTotal = alertItems.reduce((sum, item) => sum + item.count, 0);

  const secondaryMetrics = stats
    ? [
        { label: "Bank accounts", value: stats.totalAccounts.toLocaleString() },
        { label: "Deposit requests", value: stats.totalDepositRequests.toLocaleString() },
        { label: "Withdrawal requests", value: stats.totalWithdrawalRequests.toLocaleString() },
        { label: "Support inbox", value: stats.contactMessages.toLocaleString() },
      ]
    : [];

  const handleRefresh = () => {
    clearAdminFetchCacheByPrefix("/api/admin/overview");
    refresh();
  };

  return (
    <AdminPage className="admin-overview">
      <AdminPageHeader
        title="Overview"
        description="Real-time platform health, client activity, and items requiring your attention."
        action={
          <div className="admin-overview-header-actions">
            {lastUpdated && (
              <span className="admin-overview-live">
                <span className="admin-overview-live-dot" />
                Live · {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <AdminRefreshButton onClick={handleRefresh} />
          </div>
        }
      />

      {loading ? (
        <OverviewSkeleton />
      ) : (
        <AdminFetchState loading={false} error={error} onRetry={handleRefresh} lastUpdated={null}>
          {data && stats && (
            <>
              {/* Featured AUM + KPI row */}
              <section className="admin-overview-top">
                <div className="admin-overview-featured">
                  <div className="admin-overview-featured-glow" aria-hidden />
                  <div className="admin-overview-featured-inner">
                    <div className="admin-overview-featured-icon">
                      <TrendingUp size={20} strokeWidth={1.75} />
                    </div>
                    <div className="admin-overview-featured-copy">
                      <p className="admin-overview-featured-label">Total assets under management</p>
                      <p className="admin-overview-featured-value">{formatCurrency(stats.totalAum)}</p>
                      <p className="admin-overview-featured-sub">
                        Across {stats.totalAccounts.toLocaleString()} active bank accounts
                      </p>
                    </div>
                    <Link href="/admin/accounts" className="admin-overview-featured-link">
                      View accounts
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>

                <div className="admin-overview-kpi-row">
                  {heroMetrics.map((metric) => (
                    <MetricTile key={metric.label} {...metric} />
                  ))}
                </div>
              </section>

              {/* Quick navigation */}
              <section className="admin-overview-quick">
                <div className="admin-overview-quick-head">
                  <LayoutGrid size={15} className="text-[var(--admin-muted)]" />
                  <span className="admin-overview-quick-title">Quick access</span>
                </div>
                <div className="admin-overview-quick-grid">
                  {QUICK_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href} className="admin-overview-quick-link">
                        <Icon size={16} strokeWidth={1.75} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Attention queue */}
              <section className="admin-overview-alerts">
                <div className="admin-overview-alerts-head">
                  <div>
                    <h2 className="admin-overview-section-title">Action queue</h2>
                    <p className="admin-overview-section-sub">
                      {pendingTotal > 0
                        ? `${pendingTotal.toLocaleString()} item${pendingTotal === 1 ? "" : "s"} need your review`
                        : "No pending items — platform is up to date"}
                    </p>
                  </div>
                  {pendingTotal === 0 && (
                    <span className="admin-overview-clear-badge">
                      <CheckCircle2 size={14} />
                      All clear
                    </span>
                  )}
                </div>
                {pendingTotal > 0 ? (
                  <div className="admin-overview-alert-grid">
                    {alertItems
                      .filter((alert) => alert.count > 0)
                      .map((alert) => {
                        const Icon = alert.icon;
                        return (
                          <Link
                            key={alert.label}
                            href={alert.href}
                            className={cn("admin-overview-alert", `admin-overview-alert-${alert.tone}`)}
                          >
                            <div className="admin-overview-alert-icon">
                              <Icon size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="admin-overview-alert-count">{alert.count.toLocaleString()}</p>
                              <p className="admin-overview-alert-label">{alert.label}</p>
                            </div>
                            <ChevronRight size={16} className="admin-overview-alert-chevron shrink-0" />
                          </Link>
                        );
                      })}
                  </div>
                ) : (
                  <div className="admin-overview-clear-card">
                    <CheckCircle2 size={28} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="admin-overview-clear-title">Nothing pending right now</p>
                      <p className="admin-overview-clear-desc">
                        Deposits, withdrawals, KYC, and messages are all caught up.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* Platform snapshot */}
              <AdminDataCard className="admin-overview-snapshot">
                <div className="admin-overview-snapshot-grid">
                  {secondaryMetrics.map((item) => (
                    <div key={item.label} className="admin-overview-snapshot-item">
                      <span className="admin-overview-snapshot-label">{item.label}</span>
                      <span className="admin-overview-snapshot-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </AdminDataCard>

              {/* Analytics */}
              <section className="admin-overview-charts">
                <OverviewChart
                  title="Clients by KYC"
                  subtitle="Verification pipeline"
                  items={data.usersByKyc}
                  labelKey="status"
                  valueKey="count"
                />
                <OverviewChart
                  title="Transactions by type"
                  subtitle="Product distribution"
                  items={data.txByType}
                  labelKey="type"
                  valueKey="count"
                />
                <OverviewChart
                  title="Deposits by status"
                  subtitle="Funding outcomes"
                  items={data.depositsByStatus}
                  labelKey="status"
                  valueKey="count"
                />
              </section>

              {/* Recent activity */}
              <div className="admin-overview-grid">
                <ActivityPanel
                  title="Recent clients"
                  href="/admin/users"
                  linkLabel="All users"
                  count={data.recentUsers.length}
                >
                  {data.recentUsers.length === 0 ? (
                    <p className="admin-overview-empty">No users registered yet</p>
                  ) : (
                    <ul className="admin-overview-list">
                      {data.recentUsers.map((user) => (
                        <li key={user.id}>
                          <Link href={`/admin/users/${user.id}`} className="admin-overview-list-item">
                            <UserInitial name={user.name} />
                            <div className="admin-overview-list-copy min-w-0">
                              <p className="admin-overview-list-title truncate">{user.name}</p>
                              <p className="admin-overview-list-sub truncate">{user.email}</p>
                            </div>
                            <div className="admin-overview-list-meta shrink-0 text-right">
                              <AdminKycBadge status={user.kycStatus} />
                              <p className="admin-overview-list-date">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </ActivityPanel>

                <ActivityPanel
                  title="Recent transactions"
                  href="/admin/transactions"
                  linkLabel="All transactions"
                  count={data.recentTransactions.length}
                >
                  {data.recentTransactions.length === 0 ? (
                    <p className="admin-overview-empty">No transactions yet</p>
                  ) : (
                    <ul className="admin-overview-list">
                      {data.recentTransactions.map((tx) => (
                        <li key={tx.id} className="admin-overview-list-item admin-overview-list-item-static">
                          <div className="admin-overview-tx-icon">
                            <Building2 size={16} />
                          </div>
                          <div className="admin-overview-list-copy min-w-0">
                            <p className="admin-overview-list-title truncate">{tx.description}</p>
                            <p className="admin-overview-list-sub truncate">
                              {tx.userName} · {tx.type}
                            </p>
                          </div>
                          <div className="admin-overview-list-meta shrink-0 text-right">
                            <p className="admin-amount text-sm font-semibold">{formatCurrency(tx.amount)}</p>
                            <span className={cn("admin-badge text-[10px]", txStatusClass(tx.status))}>
                              {tx.status}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </ActivityPanel>
              </div>

              <div className="admin-overview-bottom">
                <ActivityPanel
                  title="Recent deposits"
                  href="/admin/deposits"
                  linkLabel="All deposits"
                  count={data.recentDeposits.length}
                >
                  {data.recentDeposits.length === 0 ? (
                    <p className="admin-overview-empty">No deposit requests yet</p>
                  ) : (
                    <ul className="admin-overview-list">
                      {data.recentDeposits.map((deposit) => (
                        <li key={deposit.id}>
                          <Link href={`/admin/users/${deposit.userId}`} className="admin-overview-list-item">
                            <UserInitial name={deposit.userName} />
                            <div className="admin-overview-list-copy min-w-0">
                              <p className="admin-overview-list-title truncate">{deposit.userName}</p>
                              <p className="admin-overview-list-sub font-mono truncate">
                                {deposit.txHash ?? "No transaction hash"}
                              </p>
                            </div>
                            <div className="admin-overview-list-meta shrink-0 text-right">
                              <span className={cn("admin-badge text-[10px]", depositStatusClass(deposit.status))}>
                                {deposit.status}
                              </span>
                              {deposit.amountUsd != null && (
                                <p className="admin-amount text-sm mt-1">{formatCurrency(deposit.amountUsd)}</p>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </ActivityPanel>

                <ActivityPanel
                  title="KYC queue"
                  href="/admin/kyc"
                  linkLabel="Review all"
                  count={data.pendingKycUsers.length}
                >
                  {data.pendingKycUsers.length === 0 ? (
                    <p className="admin-overview-empty">No clients awaiting KYC review</p>
                  ) : (
                    <div className="admin-overview-kyc-grid">
                      {data.pendingKycUsers.map((user) => (
                        <Link
                          key={user.id}
                          href={`/admin/users/${user.id}`}
                          className="admin-overview-kyc-card"
                        >
                          <UserInitial name={user.name} />
                          <div className="min-w-0 flex-1">
                            <p className="admin-overview-list-title truncate">{user.name}</p>
                            <p className="admin-overview-list-sub truncate">{user.email}</p>
                          </div>
                          <AdminKycBadge status={user.kycStatus} />
                        </Link>
                      ))}
                    </div>
                  )}
                </ActivityPanel>
              </div>
            </>
          )}
        </AdminFetchState>
      )}
    </AdminPage>
  );
}
