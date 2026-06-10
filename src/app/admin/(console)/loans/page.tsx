"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import { useAdminFetch } from "@/hooks/use-admin-fetch";
import { formatCurrency } from "@/lib/utils";

interface LoanRow {
  id: string;
  applicationNumber: string;
  userId: string;
  userName: string;
  productName: string;
  requestedAmount: number;
  approvedAmount: number | null;
  interestRatePercent: number | null;
  repaymentMonths: number | null;
  status: string;
  loanPurpose: string;
  monthlyIncome: number;
  employmentStatus: string;
  hasUserLoan: boolean;
  createdAt: string;
}

export default function AdminLoansPage() {
  const [filter, setFilter] = useState("pending");
  const url = filter === "pending" ? "/api/admin/loans?status=SUBMITTED" : "/api/admin/loans";
  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<{ applications: LoanRow[] }>(url);
  const rows = data?.applications ?? [];
  const [active, setActive] = useState<LoanRow | null>(null);
  const [form, setForm] = useState({ approvedAmount: "", interestRatePercent: "", repaymentMonths: "", reviewNote: "", adminNotes: "" });
  const [saving, setSaving] = useState(false);

  const open = (row: LoanRow) => {
    setActive(row);
    setForm({
      approvedAmount: String(row.approvedAmount ?? row.requestedAmount),
      interestRatePercent: String(row.interestRatePercent ?? "8.5"),
      repaymentMonths: String(row.repaymentMonths ?? "36"),
      reviewNote: "",
      adminNotes: "",
    });
  };

  const patch = async (status: string) => {
    if (!active) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        status,
        reviewNote: form.reviewNote || undefined,
        adminNotes: form.adminNotes || undefined,
      };
      if (status === "APPROVED") {
        body.approvedAmount = Number(form.approvedAmount);
        body.interestRatePercent = Number(form.interestRatePercent);
        body.repaymentMonths = Number(form.repaymentMonths);
      }
      const res = await fetch(`/api/admin/loans/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success(`Loan ${status.toLowerCase()}`);
      setActive(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Loan Management"
        description="Review applications, set terms, approve, and disburse funds"
        action={<button type="button" onClick={refresh} className="admin-btn-ghost text-xs px-4 py-2">Refresh</button>}
      />

      <div className="flex gap-2 mb-6">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`admin-btn-ghost text-xs ${filter === f ? "border-accent-brand/40" : ""}`}>
            {f === "pending" ? "Pending" : "All"}
          </button>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <AdminFetchState loading={loading} error={error} onRetry={refresh} lastUpdated={lastUpdated} isEmpty={!loading && rows.length === 0} emptyMessage="No loan applications">
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="text-left py-3 px-5">Application</th>
                  <th className="text-left py-3 px-5">Customer</th>
                  <th className="text-left py-3 px-5">Product</th>
                  <th className="text-right py-3 px-5">Amount</th>
                  <th className="text-left py-3 px-5">Status</th>
                  <th className="text-right py-3 px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--admin-border)]/50">
                    <td className="py-3 px-5 font-mono text-xs">{r.applicationNumber}</td>
                    <td className="py-3 px-5">
                      <Link href={`/admin/users/${r.userId}`} className="admin-link text-sm">{r.userName}</Link>
                    </td>
                    <td className="py-3 px-5 text-sm text-white">{r.productName}</td>
                    <td className="py-3 px-5 text-right admin-amount">{formatCurrency(r.requestedAmount)}</td>
                    <td className="py-3 px-5"><span className="admin-badge admin-badge-submitted text-[10px]">{r.status}</span></td>
                    <td className="py-3 px-5 text-right">
                      <button type="button" onClick={() => open(r)} className="admin-btn-primary text-xs py-1.5 px-3">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminFetchState>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="admin-card w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-white">{active.applicationNumber}</h2>
            <p className="text-sm text-[var(--admin-muted)] mt-1">{active.productName} · {active.userName}</p>
            <p className="text-xs text-[var(--admin-muted)] mt-3">Purpose: {active.loanPurpose}</p>
            <p className="text-xs text-[var(--admin-muted)]">Income: {formatCurrency(active.monthlyIncome)}/mo · {active.employmentStatus}</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <input className="admin-input text-xs" placeholder="Approved $" value={form.approvedAmount} onChange={(e) => setForm({ ...form, approvedAmount: e.target.value })} />
              <input className="admin-input text-xs" placeholder="Rate %" value={form.interestRatePercent} onChange={(e) => setForm({ ...form, interestRatePercent: e.target.value })} />
              <input className="admin-input text-xs" placeholder="Months" value={form.repaymentMonths} onChange={(e) => setForm({ ...form, repaymentMonths: e.target.value })} />
            </div>
            <textarea className="admin-input mt-3" placeholder="Customer note" value={form.reviewNote} onChange={(e) => setForm({ ...form, reviewNote: e.target.value })} rows={2} />
            <textarea className="admin-input mt-2" placeholder="Admin notes" value={form.adminNotes} onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} rows={2} />
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" disabled={saving} onClick={() => patch("UNDER_REVIEW")} className="admin-btn-ghost text-xs">Mark Reviewing</button>
              <button type="button" disabled={saving} onClick={() => patch("APPROVED")} className="admin-btn-primary text-xs">Approve</button>
              <button type="button" disabled={saving} onClick={() => patch("DISBURSED")} className="admin-btn-primary text-xs">Disburse</button>
              <button type="button" disabled={saving} onClick={() => patch("REJECTED")} className="admin-btn-ghost text-xs text-red-400">Reject</button>
              <button type="button" onClick={() => setActive(null)} className="admin-btn-ghost text-xs ml-auto">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
