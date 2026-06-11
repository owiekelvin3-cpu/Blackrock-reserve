"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import { useAdminFetch } from "@/hooks/use-admin-fetch";
import { formatCurrency } from "@/lib/utils";

type ChargeType = "FIXED" | "PERCENTAGE";

interface ChargeRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  chargeType: ChargeType;
  amountUsd: number;
  percentage: number | null;
  active: boolean;
  createdByName: string;
  updatedAt: string;
}

interface PaymentRow {
  id: string;
  userName: string;
  userEmail: string;
  withdrawalAmount: number;
  withdrawalMethod: string;
  amountUsd: number;
  status: string;
  txHash: string | null;
  proofNote: string | null;
  createdAt: string;
}

type Tab = "charges" | "payments";

function formatChargeLabel(charge: Pick<ChargeRow, "chargeType" | "amountUsd" | "percentage">) {
  if (charge.chargeType === "PERCENTAGE" && charge.percentage != null) {
    return `${charge.percentage}%`;
  }
  return formatCurrency(charge.amountUsd);
}

export default function AdminWithdrawalChargesPage() {
  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<{
    charges: ChargeRow[];
    users: { id: string; name: string; email: string }[];
  }>("/api/admin/withdrawal-charges");
  const paymentsFetch = useAdminFetch<{ payments: PaymentRow[] }>("/api/admin/withdrawal-charge-payments");
  const [tab, setTab] = useState<Tab>("charges");
  const [userId, setUserId] = useState("");
  const [chargeType, setChargeType] = useState<ChargeType>("FIXED");
  const [amountUsd, setAmountUsd] = useState("");
  const [percentage, setPercentage] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const charges = data?.charges ?? [];
  const users = data?.users ?? [];
  const payments = paymentsFetch.data?.payments ?? [];

  const buildPayload = (applyToAll: boolean) => {
    const payload: Record<string, unknown> = {
      chargeType,
      applyToAll,
    };
    if (!applyToAll) payload.userId = userId;
    if (chargeType === "FIXED") {
      payload.amountUsd = Number(amountUsd);
    } else {
      payload.percentage = Number(percentage);
    }
    return payload;
  };

  const validateForm = (applyToAll: boolean) => {
    if (!applyToAll && !userId) {
      toast.error("Select a user");
      return false;
    }
    if (chargeType === "FIXED") {
      if (!amountUsd || Number(amountUsd) <= 0) {
        toast.error("Enter a valid fixed charge amount");
        return false;
      }
    } else if (!percentage || Number(percentage) <= 0 || Number(percentage) > 100) {
      toast.error("Enter a valid percentage between 0 and 100");
      return false;
    }
    if (applyToAll && !confirm(`Apply this ${chargeType === "FIXED" ? "fixed" : "percentage"} charge to all ${users.length} users?`)) {
      return false;
    }
    return true;
  };

  const saveCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/withdrawal-charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPayload(false)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success(json.message || "Charge saved");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const saveChargeForAll = async () => {
    if (!validateForm(true)) return;
    setSavingAll(true);
    try {
      const res = await fetch("/api/admin/withdrawal-charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPayload(true)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success(json.message || `Charge applied to ${json.appliedCount ?? "all"} users`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingAll(false);
    }
  };

  const removeCharge = async (uid: string) => {
    if (!confirm("Remove withdrawal charge for this user?")) return;
    try {
      const res = await fetch(`/api/admin/withdrawal-charges/${uid}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success("Charge removed");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const reviewPayment = async (id: string, status: "PAID" | "REJECTED" | "UNPAID") => {
    let reviewNote: string | undefined;
    if (status === "REJECTED") {
      reviewNote = prompt("Rejection reason:") ?? undefined;
      if (!reviewNote?.trim()) return;
    }
    setReviewing(id);
    try {
      const res = await fetch(`/api/admin/withdrawal-charge-payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reviewNote }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success(`Payment marked ${status.toLowerCase()}`);
      paymentsFetch.refresh();
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
        title="Withdrawal Charges"
        description="Set per-user or global withdrawal processing charges (fixed or percentage) and verify charge payments"
        action={
          <button type="button" onClick={() => { refresh(); paymentsFetch.refresh(); }} className="admin-btn-ghost text-xs px-4 py-2">
            Refresh
          </button>
        }
      />

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(["charges", "payments"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? "admin-btn-primary" : "admin-btn-ghost"}`}
          >
            {t === "charges" ? "User Charges" : "Charge Payments"}
          </button>
        ))}
      </div>

      {tab === "charges" && (
        <>
          <form onSubmit={saveCharge} className="admin-card p-5 mb-6 space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-[var(--admin-muted)] mb-1.5">Charge type</label>
                <select
                  value={chargeType}
                  onChange={(e) => setChargeType(e.target.value as ChargeType)}
                  className="admin-input w-full"
                >
                  <option value="FIXED">Fixed amount (USD)</option>
                  <option value="PERCENTAGE">Percentage of withdrawal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--admin-muted)] mb-1.5">User</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="admin-input w-full"
                >
                  <option value="">Select user…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              {chargeType === "FIXED" ? (
                <div>
                  <label className="block text-xs text-[var(--admin-muted)] mb-1.5">Charge amount (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    className="admin-input w-full"
                    placeholder="500.00"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[var(--admin-muted)] mb-1.5">Percentage (%)</label>
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="admin-input w-full"
                    placeholder="5"
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <button type="submit" disabled={saving || savingAll} className="admin-btn-primary h-10 flex-1">
                  {saving ? "Saving…" : "Save Charge"}
                </button>
                <button
                  type="button"
                  disabled={saving || savingAll || users.length === 0}
                  onClick={saveChargeForAll}
                  className="admin-btn-ghost h-10 flex-1 border border-[var(--admin-border)]"
                >
                  {savingAll ? "Applying…" : "Set for All Users"}
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--admin-muted)]">
              {chargeType === "FIXED"
                ? "Fixed charges bill the same USD amount on every withdrawal request."
                : "Percentage charges are calculated from the withdrawal amount when the user submits a request."}
            </p>
          </form>

          <div className="admin-card overflow-hidden">
            <AdminFetchState loading={loading} error={error} onRetry={refresh} lastUpdated={lastUpdated} isEmpty={!loading && charges.length === 0} emptyMessage="No withdrawal charges configured">
              <div className="overflow-x-auto">
                <table className="admin-table w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[var(--admin-border)] bg-white/[0.02]">
                      <th className="text-left py-3 px-5">User</th>
                      <th className="text-left py-3 px-5">Type</th>
                      <th className="text-left py-3 px-5">Charge</th>
                      <th className="text-left py-3 px-5 hidden sm:table-cell">Set by</th>
                      <th className="text-left py-3 px-5 hidden md:table-cell">Updated</th>
                      <th className="text-right py-3 px-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((c) => (
                      <tr key={c.id} className="border-b border-[var(--admin-border)]/50">
                        <td className="py-3 px-5">
                          <p className="text-sm">{c.userName}</p>
                          <p className="text-[10px] text-[var(--admin-muted)]">{c.userEmail}</p>
                        </td>
                        <td className="py-3 px-5 text-sm">
                          {c.chargeType === "PERCENTAGE" ? "Percentage" : "Fixed"}
                        </td>
                        <td className="py-3 px-5 font-semibold">{formatChargeLabel(c)}</td>
                        <td className="py-3 px-5 text-sm hidden sm:table-cell">{c.createdByName}</td>
                        <td className="py-3 px-5 text-xs text-[var(--admin-muted)] hidden md:table-cell">
                          {new Date(c.updatedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button type="button" onClick={() => removeCharge(c.userId)} className="admin-btn-ghost text-xs text-red-400 py-1 px-3">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminFetchState>
          </div>
        </>
      )}

      {tab === "payments" && (
        <div className="admin-card overflow-hidden">
          <AdminFetchState
            loading={paymentsFetch.loading}
            error={paymentsFetch.error}
            onRetry={paymentsFetch.refresh}
            lastUpdated={paymentsFetch.lastUpdated}
            isEmpty={!paymentsFetch.loading && payments.length === 0}
            emptyMessage="No charge payments yet"
          >
            <div className="overflow-x-auto">
              <table className="admin-table w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] bg-white/[0.02]">
                    <th className="text-left py-3 px-5">User</th>
                    <th className="text-left py-3 px-5">Withdrawal</th>
                    <th className="text-left py-3 px-5">Charge</th>
                    <th className="text-left py-3 px-5">Proof</th>
                    <th className="text-left py-3 px-5">Status</th>
                    <th className="text-right py-3 px-5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--admin-border)]/50">
                      <td className="py-3 px-5">
                        <p className="text-sm">{p.userName}</p>
                        <p className="text-[10px] text-[var(--admin-muted)]">{p.userEmail}</p>
                      </td>
                      <td className="py-3 px-5 text-sm">
                        {formatCurrency(p.withdrawalAmount)}
                        <p className="text-[10px] text-[var(--admin-muted)]">{p.withdrawalMethod}</p>
                      </td>
                      <td className="py-3 px-5 font-medium">{formatCurrency(p.amountUsd)}</td>
                      <td className="py-3 px-5 text-xs max-w-[160px]">
                        {p.txHash && <p className="font-mono truncate" title={p.txHash}>{p.txHash}</p>}
                        {p.proofNote && <p className="text-[var(--admin-muted)] truncate">{p.proofNote}</p>}
                      </td>
                      <td className="py-3 px-5">
                        <span className="admin-badge admin-badge-submitted">{p.status}</span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        {p.status === "PENDING_VERIFICATION" && (
                          <div className="flex justify-end gap-2 flex-wrap">
                            <button disabled={reviewing === p.id} onClick={() => reviewPayment(p.id, "PAID")} className="admin-btn-primary text-xs py-1 px-3">
                              Verify Paid
                            </button>
                            <button disabled={reviewing === p.id} onClick={() => reviewPayment(p.id, "REJECTED")} className="admin-btn-ghost text-xs text-red-400 py-1 px-3">
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
          </AdminFetchState>
        </div>
      )}
    </div>
  );
}
