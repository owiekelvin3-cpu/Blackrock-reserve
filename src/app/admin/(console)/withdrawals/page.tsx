"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import { useAdminFetch } from "@/hooks/use-admin-fetch";
import { formatCurrency } from "@/lib/utils";

interface WithdrawalRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  accountName: string;
  accountBalance: number | null;
  method: string;
  methodLabel: string;
  amountUsd: number;
  assignedChargeAmount: number | null;
  chargePaymentStatus: string | null;
  destination: string;
  destinationExtra: string | null;
  note: string | null;
  status: string;
  createdAt: string;
}

function statusLabel(status: string) {
  if (status === "AWAITING_CHARGE_PAYMENT") return "Awaiting Charge";
  return status;
}

export default function AdminWithdrawalsPage() {
  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<{ withdrawals: WithdrawalRow[] }>(
    "/api/admin/withdrawals"
  );
  const withdrawals = data?.withdrawals ?? [];
  const [reviewing, setReviewing] = useState<string | null>(null);

  const review = async (id: string, status: "APPROVED" | "REJECTED") => {
    setReviewing(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Review failed");
      toast.success(`Withdrawal ${status.toLowerCase()}`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setReviewing(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Withdrawal Requests"
        description="Live withdrawal requests — charge must be paid and verified before approval"
        action={
          <button type="button" onClick={refresh} className="admin-btn-ghost text-xs px-4 py-2">
            Refresh
          </button>
        }
      />

      <div className="admin-card overflow-hidden">
        <AdminFetchState
          loading={loading}
          error={error}
          onRetry={refresh}
          lastUpdated={lastUpdated}
          isEmpty={!loading && !error && withdrawals.length === 0}
          emptyMessage="No withdrawal requests in the database"
        >
          <div className="hidden lg:block overflow-x-auto">
            <table className="admin-table w-full min-w-[960px]">
              <thead>
                <tr className="border-b border-[var(--admin-border)] bg-white/[0.02]">
                  <th className="text-left py-3 px-5">User</th>
                  <th className="text-left py-3 px-5">Amount</th>
                  <th className="text-left py-3 px-5">Charge</th>
                  <th className="text-left py-3 px-5">Method</th>
                  <th className="text-left py-3 px-5">Status</th>
                  <th className="text-left py-3 px-5">Date</th>
                  <th className="text-right py-3 px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-[var(--admin-border)]/50">
                    <td className="py-3 px-5">
                      <Link href={`/admin/users/${w.userId}`} className="admin-link text-sm">
                        {w.userName}
                      </Link>
                      <p className="text-[10px] text-[var(--admin-muted)]">{w.userEmail}</p>
                    </td>
                    <td className="py-3 px-5 text-sm font-medium">{formatCurrency(w.amountUsd)}</td>
                    <td className="py-3 px-5 text-sm">
                      {w.assignedChargeAmount != null ? (
                        <>
                          {formatCurrency(w.assignedChargeAmount)}
                          {w.chargePaymentStatus && (
                            <p className="text-[10px] text-[var(--admin-muted)]">{w.chargePaymentStatus}</p>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-5 text-sm">{w.methodLabel}</td>
                    <td className="py-3 px-5">
                      <span
                        className={`admin-badge ${
                          w.status === "PENDING"
                            ? "admin-badge-submitted"
                            : w.status === "AWAITING_CHARGE_PAYMENT"
                              ? "admin-badge-submitted"
                              : w.status === "APPROVED"
                                ? "admin-badge-verified"
                                : "admin-badge-rejected"
                        }`}
                      >
                        {statusLabel(w.status)}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-xs text-[var(--admin-muted)]">
                      {new Date(w.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-right">
                      {w.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button onClick={() => review(w.id, "APPROVED")} disabled={reviewing === w.id} className="admin-btn-primary text-xs py-1 px-3">
                            Approve
                          </button>
                          <button onClick={() => review(w.id, "REJECTED")} disabled={reviewing === w.id} className="admin-btn-ghost text-xs text-red-400 py-1 px-3">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden divide-y divide-[var(--admin-border)]/50">
            {withdrawals.map((w) => (
              <div key={w.id} className="p-4 space-y-2">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link href={`/admin/users/${w.userId}`} className="admin-link text-sm font-medium">
                      {w.userName}
                    </Link>
                    <p className="text-[10px] text-[var(--admin-muted)]">{w.userEmail}</p>
                  </div>
                  <span className="admin-badge admin-badge-submitted text-[10px]">{statusLabel(w.status)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[var(--admin-muted)]">Amount</p>
                    <p className="font-medium">{formatCurrency(w.amountUsd)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--admin-muted)]">Charge</p>
                    <p>{w.assignedChargeAmount != null ? formatCurrency(w.assignedChargeAmount) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[var(--admin-muted)]">Method</p>
                    <p>{w.methodLabel}</p>
                  </div>
                  <div>
                    <p className="text-[var(--admin-muted)]">Date</p>
                    <p>{new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {w.status === "PENDING" && (
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => review(w.id, "APPROVED")} disabled={reviewing === w.id} className="admin-btn-primary text-xs py-2 px-3 flex-1">
                      Approve
                    </button>
                    <button onClick={() => review(w.id, "REJECTED")} disabled={reviewing === w.id} className="admin-btn-ghost text-xs text-red-400 py-2 px-3 flex-1">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </AdminFetchState>
      </div>
    </div>
  );
}
