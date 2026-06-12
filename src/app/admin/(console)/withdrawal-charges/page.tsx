"use client";

import { useState } from "react";
import { toast } from "sonner";
import AdminActionModal from "@/components/admin/AdminActionModal";
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

type PendingPaymentAction = { id: string; status: "PAID" | "REJECTED" };

function formatChargeLabel(charge: Pick<ChargeRow, "chargeType" | "amountUsd" | "percentage">) {
  if (charge.chargeType === "PERCENTAGE" && charge.percentage != null) {
    return `${charge.percentage}%`;
  }
  return formatCurrency(charge.amountUsd);
}

function PaymentSummary({ payment }: { payment: PaymentRow }) {
  return (
    <div className="rounded-lg border border-[var(--admin-border)] bg-white/[0.02] p-4 space-y-2 text-sm">
      <div className="flex justify-between gap-3">
        <span className="text-[var(--admin-muted)]">User</span>
        <span className="text-right text-white">{payment.userName}</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-[var(--admin-muted)]">Withdrawal</span>
        <span className="text-right">
          {formatCurrency(payment.withdrawalAmount)}
          <span className="block text-xs text-[var(--admin-muted)]">{payment.withdrawalMethod}</span>
        </span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-[var(--admin-muted)]">Charge amount</span>
        <span className="font-semibold text-white">{formatCurrency(payment.amountUsd)}</span>
      </div>
      {payment.txHash && (
        <div className="flex justify-between gap-3">
          <span className="text-[var(--admin-muted)]">TX reference</span>
          <span className="text-right font-mono text-xs break-all max-w-[220px]">{payment.txHash}</span>
        </div>
      )}
      {payment.proofNote && (
        <div className="flex justify-between gap-3">
          <span className="text-[var(--admin-muted)]">Proof note</span>
          <span className="text-right text-xs max-w-[220px]">{payment.proofNote}</span>
        </div>
      )}
    </div>
  );
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
  const [pendingPaymentAction, setPendingPaymentAction] = useState<PendingPaymentAction | null>(null);
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const [confirmApplyAll, setConfirmApplyAll] = useState(false);
  const [confirmSaveSingle, setConfirmSaveSingle] = useState(false);

  const charges = data?.charges ?? [];
  const users = data?.users ?? [];
  const payments = paymentsFetch.data?.payments ?? [];

  const selectedUser = users.find((u) => u.id === userId);
  const chargeToRemove = charges.find((c) => c.userId === removeUserId);
  const selectedPayment = pendingPaymentAction
    ? payments.find((p) => p.id === pendingPaymentAction.id) ?? null
    : null;

  const chargeSummaryLabel =
    chargeType === "FIXED"
      ? formatCurrency(Number(amountUsd) || 0)
      : `${percentage || "0"}% of withdrawal amount`;

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
    return true;
  };

  const saveCharge = async () => {
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
      setConfirmSaveSingle(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const saveChargeForAll = async () => {
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
      setConfirmApplyAll(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingAll(false);
    }
  };

  const removeCharge = async () => {
    if (!removeUserId) return;
    try {
      const res = await fetch(`/api/admin/withdrawal-charges/${removeUserId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success("Charge removed");
      setRemoveUserId(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const reviewPayment = async (id: string, status: "PAID" | "REJECTED", reviewNote?: string) => {
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
      toast.success(
        status === "PAID"
          ? "Charge payment confirmed — withdrawal moved to review"
          : "Charge payment rejected — user notified"
      );
      setPendingPaymentAction(null);
      paymentsFetch.refresh();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setReviewing(null);
    }
  };

  const handleSaveChargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    setConfirmSaveSingle(true);
  };

  const handleSaveChargeForAll = () => {
    if (!validateForm(true)) return;
    setConfirmApplyAll(true);
  };

  return (
    <div>
      <AdminPageHeader
        title="Withdrawal Charges"
        description="Set per-user or global withdrawal processing charges (fixed or percentage) and verify charge payments"
        action={
          <button
            type="button"
            onClick={() => {
              refresh();
              paymentsFetch.refresh();
            }}
            className="admin-btn-ghost text-xs px-4 py-2"
          >
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
          <form onSubmit={handleSaveChargeSubmit} className="admin-card p-5 mb-6 space-y-4">
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
                  onClick={handleSaveChargeForAll}
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
            <AdminFetchState
              loading={loading}
              error={error}
              onRetry={refresh}
              lastUpdated={lastUpdated}
              isEmpty={!loading && charges.length === 0}
              emptyMessage="No withdrawal charges configured"
            >
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
                          <button
                            type="button"
                            onClick={() => setRemoveUserId(c.userId)}
                            className="admin-btn-ghost text-xs text-red-400 py-1 px-3"
                          >
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
                        {p.txHash && (
                          <p className="font-mono truncate" title={p.txHash}>
                            {p.txHash}
                          </p>
                        )}
                        {p.proofNote && <p className="text-[var(--admin-muted)] truncate">{p.proofNote}</p>}
                      </td>
                      <td className="py-3 px-5">
                        <span className="admin-badge admin-badge-submitted">{p.status}</span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        {p.status === "PENDING_VERIFICATION" && (
                          <div className="flex justify-end gap-2 flex-wrap">
                            <button
                              disabled={reviewing === p.id}
                              onClick={() => setPendingPaymentAction({ id: p.id, status: "PAID" })}
                              className="admin-btn-primary text-xs py-1 px-3"
                            >
                              Confirm
                            </button>
                            <button
                              disabled={reviewing === p.id}
                              onClick={() => setPendingPaymentAction({ id: p.id, status: "REJECTED" })}
                              className="admin-btn-ghost text-xs text-red-400 py-1 px-3"
                            >
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

      {confirmSaveSingle && selectedUser && (
        <AdminActionModal
          open
          title="Confirm withdrawal charge"
          description="This charge will apply to the user's next withdrawal requests."
          confirmLabel="Confirm charge"
          onClose={() => setConfirmSaveSingle(false)}
          onConfirm={saveCharge}
          loading={saving}
        >
          <div className="rounded-lg border border-[var(--admin-border)] bg-white/[0.02] p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-[var(--admin-muted)]">User</span>
              <span className="text-right text-white">{selectedUser.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--admin-muted)]">Type</span>
              <span>{chargeType === "FIXED" ? "Fixed amount" : "Percentage"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--admin-muted)]">Charge</span>
              <span className="font-semibold text-white">{chargeSummaryLabel}</span>
            </div>
          </div>
        </AdminActionModal>
      )}

      {confirmApplyAll && (
        <AdminActionModal
          open
          title="Apply charge to all users"
          description={`This will set the same ${chargeType === "FIXED" ? "fixed" : "percentage"} charge for all ${users.length} users.`}
          confirmLabel="Confirm for all users"
          onClose={() => setConfirmApplyAll(false)}
          onConfirm={saveChargeForAll}
          loading={savingAll}
        >
          <div className="rounded-lg border border-[var(--admin-border)] bg-white/[0.02] p-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-[var(--admin-muted)]">Charge</span>
              <span className="font-semibold text-white">{chargeSummaryLabel}</span>
            </div>
          </div>
        </AdminActionModal>
      )}

      {chargeToRemove && (
        <AdminActionModal
          open
          title="Remove withdrawal charge"
          description="This user will no longer be required to pay a processing charge on withdrawals."
          confirmLabel="Confirm removal"
          variant="danger"
          onClose={() => setRemoveUserId(null)}
          onConfirm={removeCharge}
        >
          <div className="rounded-lg border border-[var(--admin-border)] bg-white/[0.02] p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-[var(--admin-muted)]">User</span>
              <span className="text-right text-white">{chargeToRemove.userName}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[var(--admin-muted)]">Current charge</span>
              <span className="font-semibold text-white">{formatChargeLabel(chargeToRemove)}</span>
            </div>
          </div>
        </AdminActionModal>
      )}

      {selectedPayment && pendingPaymentAction?.status === "PAID" && (
        <AdminActionModal
          open
          title="Confirm charge payment"
          description="Verify that the deposit was received. The linked withdrawal will move to pending review."
          confirmLabel="Confirm payment"
          onClose={() => setPendingPaymentAction(null)}
          onConfirm={() => reviewPayment(pendingPaymentAction.id, "PAID")}
          loading={reviewing === pendingPaymentAction.id}
        >
          <PaymentSummary payment={selectedPayment} />
        </AdminActionModal>
      )}

      {selectedPayment && pendingPaymentAction?.status === "REJECTED" && (
        <AdminActionModal
          open
          title="Reject charge payment"
          description="Provide a reason — the user will be notified and can submit new proof."
          confirmLabel="Confirm rejection"
          variant="danger"
          requireReason
          reasonLabel="Rejection reason"
          reasonPlaceholder="Reason for rejection..."
          onClose={() => setPendingPaymentAction(null)}
          onConfirm={(reviewNote) => reviewPayment(pendingPaymentAction.id, "REJECTED", reviewNote)}
          loading={reviewing === pendingPaymentAction.id}
        >
          <PaymentSummary payment={selectedPayment} />
        </AdminActionModal>
      )}
    </div>
  );
}
