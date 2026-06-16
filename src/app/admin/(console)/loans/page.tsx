"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AdminPage,
  AdminPageHeader,
  AdminRefreshButton,
  AdminFilterTabs,
  AdminDataCard,
  AdminTableScroll,
  AdminMobileList,
  AdminMobileCard,
  AdminModal,
} from "@/components/admin/AdminUi";
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
    <AdminPage>
      <AdminPageHeader
        title="Loan Management"
        description="Review applications, set terms, approve, and disburse funds"
        action={<AdminRefreshButton onClick={refresh} />}
      />

      <AdminFilterTabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: "pending", label: "Pending" },
          { id: "all", label: "All" },
        ]}
      />

      <AdminDataCard noPadding>
        <AdminFetchState
          loading={loading}
          error={error}
          onRetry={refresh}
          lastUpdated={lastUpdated}
          isEmpty={!loading && rows.length === 0}
          emptyMessage="No loan applications"
        >
          <AdminMobileList>
            {rows.map((r) => (
              <AdminMobileCard key={r.id}>
                <p className="font-mono text-xs">{r.applicationNumber}</p>
                <Link href={`/admin/users/${r.userId}`} className="admin-link text-sm">{r.userName}</Link>
                <p className="text-xs text-[var(--admin-muted)] mt-1">{r.productName}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="admin-amount">{formatCurrency(r.requestedAmount)}</span>
                  <span className="admin-badge admin-badge-submitted text-[10px]">{r.status}</span>
                </div>
                <button type="button" onClick={() => open(r)} className="admin-btn-primary text-xs py-1.5 px-3 mt-3 w-full">
                  Manage
                </button>
              </AdminMobileCard>
            ))}
          </AdminMobileList>

          <AdminTableScroll className="admin-desktop-table">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Application</th>
                  <th className="text-left">Customer</th>
                  <th className="text-left">Product</th>
                  <th className="text-right">Amount</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.applicationNumber}</td>
                    <td>
                      <Link href={`/admin/users/${r.userId}`} className="admin-link text-sm">{r.userName}</Link>
                    </td>
                    <td className="text-sm">{r.productName}</td>
                    <td className="text-right admin-amount">{formatCurrency(r.requestedAmount)}</td>
                    <td><span className="admin-badge admin-badge-submitted text-[10px]">{r.status}</span></td>
                    <td className="text-right">
                      <button type="button" onClick={() => open(r)} className="admin-btn-primary text-xs py-1.5 px-3">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableScroll>
        </AdminFetchState>
      </AdminDataCard>

      <AdminModal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.applicationNumber ?? "Loan application"}
        description={active ? `${active.productName} · ${active.userName}` : undefined}
        size="lg"
        footer={
          <>
            <button type="button" disabled={saving} onClick={() => patch("UNDER_REVIEW")} className="admin-btn-ghost text-xs">Mark Reviewing</button>
            <button type="button" disabled={saving} onClick={() => patch("APPROVED")} className="admin-btn-primary text-xs">Approve</button>
            <button type="button" disabled={saving} onClick={() => patch("DISBURSED")} className="admin-btn-primary text-xs">Disburse</button>
            <button type="button" disabled={saving} onClick={() => patch("REJECTED")} className="admin-btn-ghost text-xs text-red-400">Reject</button>
            <button type="button" onClick={() => setActive(null)} className="admin-btn-ghost text-xs ml-auto">Close</button>
          </>
        }
      >
        {active && (
          <>
            <p className="text-xs text-[var(--admin-muted)]">Purpose: {active.loanPurpose}</p>
            <p className="text-xs text-[var(--admin-muted)] mb-4">Income: {formatCurrency(active.monthlyIncome)}/mo · {active.employmentStatus}</p>
            <div className="grid grid-cols-3 gap-3">
              <input className="admin-input text-xs" placeholder="Approved $" value={form.approvedAmount} onChange={(e) => setForm({ ...form, approvedAmount: e.target.value })} />
              <input className="admin-input text-xs" placeholder="Rate %" value={form.interestRatePercent} onChange={(e) => setForm({ ...form, interestRatePercent: e.target.value })} />
              <input className="admin-input text-xs" placeholder="Months" value={form.repaymentMonths} onChange={(e) => setForm({ ...form, repaymentMonths: e.target.value })} />
            </div>
            <textarea className="admin-input mt-3 w-full" placeholder="Customer note" value={form.reviewNote} onChange={(e) => setForm({ ...form, reviewNote: e.target.value })} rows={2} />
            <textarea className="admin-input mt-2 w-full" placeholder="Admin notes" value={form.adminNotes} onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} rows={2} />
          </>
        )}
      </AdminModal>
    </AdminPage>
  );
}
