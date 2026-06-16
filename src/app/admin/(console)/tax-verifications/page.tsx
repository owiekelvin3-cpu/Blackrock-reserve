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

interface TaxRow {
  id: string;
  applicationNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  fullLegalName: string;
  status: string;
  taxYear: string;
  taxRefundAmountExpected: number;
  createdAt: string;
  hasDocuments: boolean;
}

interface TaxDetail extends TaxRow {
  phone: string;
  email: string;
  residentialAddress: string;
  city: string;
  state: string;
  zipCode: string;
  employerName: string;
  jobTitle: string;
  annualIncome: number;
  taxFilingStatus: string;
  ssnMasked: string;
  tinMasked: string;
  bankName: string;
  accountNumberMasked: string;
  governmentId: string | null;
  taxReturnDocument: string | null;
  w2Form: string | null;
  proofOfAddress: string | null;
  reviewNote: string | null;
  adminNotes: string | null;
}

export default function AdminTaxVerificationsPage() {
  const [filter, setFilter] = useState("pending");
  const url = `/api/admin/tax-verifications${filter === "pending" ? "?status=PENDING" : ""}`;
  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<{ verifications: TaxRow[] }>(url);
  const rows = data?.verifications ?? [];
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TaxDetail | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const openDetail = async (id: string) => {
    setDetailId(id);
    const res = await fetch(`/api/admin/tax-verifications/${id}`, { credentials: "include" });
    const json = await res.json();
    if (res.ok) {
      setDetail(json);
      setReviewNote(json.reviewNote ?? "");
      setAdminNotes(json.adminNotes ?? "");
    }
  };

  const review = async (status: "APPROVED" | "REJECTED" | "DOCUMENTS_REQUESTED") => {
    if (!detailId) return;
    if (status !== "APPROVED" && !reviewNote.trim()) {
      toast.error("Review note is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tax-verifications/${detailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, reviewNote, adminNotes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success(`Verification ${status.toLowerCase().replace(/_/g, " ")}`);
      setDetailId(null);
      setDetail(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const DocLink = ({ href, label }: { href: string | null; label: string }) =>
    href ? (
      <a href={href} download={label} className="admin-link text-xs block">
        Download {label}
      </a>
    ) : (
      <span className="text-xs text-[var(--admin-muted)]">No {label}</span>
    );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Tax Refund Verification"
        description="Review customer tax refund forms before granting loan marketplace access"
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
          emptyMessage="No tax verifications"
        >
          <AdminMobileList>
            {rows.map((r) => (
              <AdminMobileCard key={r.id}>
                <p className="font-mono text-xs text-[var(--admin-muted)]">{r.applicationNumber}</p>
                <Link href={`/admin/users/${r.userId}`} className="admin-link text-sm font-medium">
                  {r.userName}
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <span className="admin-badge admin-badge-submitted text-[10px]">{r.status}</span>
                  <span className="admin-amount text-sm">{formatCurrency(r.taxRefundAmountExpected)}</span>
                </div>
                <button type="button" onClick={() => openDetail(r.id)} className="admin-btn-primary text-xs py-1.5 px-3 mt-3 w-full">
                  Review
                </button>
              </AdminMobileCard>
            ))}
          </AdminMobileList>

          <AdminTableScroll className="admin-desktop-table">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Reference</th>
                  <th className="text-left">Customer</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Expected Refund</th>
                  <th className="text-right">Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.applicationNumber}</td>
                    <td>
                      <Link href={`/admin/users/${r.userId}`} className="admin-link text-sm">{r.userName}</Link>
                      <p className="text-[10px] text-[var(--admin-muted)]">{r.userEmail}</p>
                    </td>
                    <td><span className="admin-badge admin-badge-submitted text-[10px]">{r.status}</span></td>
                    <td className="text-right admin-amount">{formatCurrency(r.taxRefundAmountExpected)}</td>
                    <td className="text-right text-xs text-[var(--admin-muted)]">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="text-right">
                      <button type="button" onClick={() => openDetail(r.id)} className="admin-btn-primary text-xs py-1.5 px-3">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableScroll>
        </AdminFetchState>
      </AdminDataCard>

      <AdminModal
        open={!!detail}
        onClose={() => { setDetail(null); setDetailId(null); }}
        title={detail?.fullLegalName ?? "Tax verification"}
        description={detail?.applicationNumber}
        size="lg"
        footer={
          <>
            <button type="button" disabled={saving} onClick={() => review("APPROVED")} className="admin-btn-primary text-xs">Approve</button>
            <button type="button" disabled={saving} onClick={() => review("DOCUMENTS_REQUESTED")} className="admin-btn-ghost text-xs">Request Docs</button>
            <button type="button" disabled={saving} onClick={() => review("REJECTED")} className="admin-btn-ghost text-xs text-red-400">Reject</button>
            <button type="button" onClick={() => { setDetail(null); setDetailId(null); }} className="admin-btn-ghost text-xs ml-auto">Close</button>
          </>
        }
      >
        {detail && (
          <>
            <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
              <p><span className="text-[var(--admin-muted)]">SSN:</span> {detail.ssnMasked}</p>
              <p><span className="text-[var(--admin-muted)]">TIN:</span> {detail.tinMasked}</p>
              <p className="sm:col-span-2"><span className="text-[var(--admin-muted)]">Address:</span> {detail.residentialAddress}, {detail.city}, {detail.state} {detail.zipCode}</p>
              <p><span className="text-[var(--admin-muted)]">Employer:</span> {detail.employerName}</p>
              <p><span className="text-[var(--admin-muted)]">Income:</span> {formatCurrency(detail.annualIncome)}</p>
              <p><span className="text-[var(--admin-muted)]">Bank:</span> {detail.bankName} · {detail.accountNumberMasked}</p>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              <DocLink href={detail.governmentId} label="Gov ID" />
              <DocLink href={detail.taxReturnDocument} label="Tax Return" />
              <DocLink href={detail.w2Form} label="W-2" />
              <DocLink href={detail.proofOfAddress} label="Proof of Address" />
            </div>
            <textarea className="admin-input mb-2 w-full" placeholder="Note to customer (required for reject/docs request)" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={2} />
            <textarea className="admin-input w-full" placeholder="Internal admin notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} />
          </>
        )}
      </AdminModal>
    </AdminPage>
  );
}
