"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
} from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminRefreshButton,
  AdminReviewQueue,
  AdminReviewCard,
  AdminModal,
} from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import { useAdminFetch } from "@/hooks/use-admin-fetch";
import { CARD_STATUS_PIPELINE, STATUS_LABELS } from "@/lib/physical-cards-constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CardRequestRow = {
  id: string;
  cardTier: string;
  tierLabel: string;
  status: string;
  statusLabel: string;
  recipientName: string;
  phone: string;
  address: { formatted: string };
  trackingNumber: string | null;
  shippingCarrier: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; kycStatus: string };
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "PENDING_REVIEW", label: "Pending Review" },
  { id: "UNDER_VERIFICATION", label: "Under Verification" },
  { id: "APPROVED", label: "Approved" },
  { id: "CARD_PRODUCTION", label: "Production" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "REJECTED", label: "Rejected" },
];

const TERMINAL = new Set(["DELIVERED", "REJECTED", "CANCELLED"]);

function pipelineIndex(status: string) {
  return CARD_STATUS_PIPELINE.indexOf(status as (typeof CARD_STATUS_PIPELINE)[number]);
}

export default function AdminCardRequestsPage() {
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<CardRequestRow | null>(null);
  const [form, setForm] = useState({
    status: "",
    trackingNumber: "",
    shippingCarrier: "",
    rejectionReason: "",
    adminNote: "",
    lastFour: "",
    expiryMonth: "",
    expiryYear: "",
  });

  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<{ requests: CardRequestRow[] }>(
    `/api/admin/card-requests?status=${filter}`,
    { pollMs: 30_000 }
  );
  const requests = data?.requests ?? [];

  const openManage = (row: CardRequestRow) => {
    setSelected(row);
    setForm({
      status: row.status,
      trackingNumber: row.trackingNumber ?? "",
      shippingCarrier: row.shippingCarrier ?? "",
      rejectionReason: row.rejectionReason ?? "",
      adminNote: "",
      lastFour: "",
      expiryMonth: "",
      expiryYear: String(new Date().getFullYear() + 4),
    });
  };

  const advanceStatus = () => {
    const idx = pipelineIndex(form.status);
    if (idx < 0 || idx >= CARD_STATUS_PIPELINE.length - 1) return;
    setForm({ ...form, status: CARD_STATUS_PIPELINE[idx + 1] });
  };

  const nextStageLabel =
    pipelineIndex(form.status) >= 0 && pipelineIndex(form.status) < CARD_STATUS_PIPELINE.length - 1
      ? STATUS_LABELS[CARD_STATUS_PIPELINE[pipelineIndex(form.status) + 1]]
      : null;

  const submitUpdate = async () => {
    if (!selected) return;

    if (form.status === "DELIVERED") {
      if (!/^\d{4}$/.test(form.lastFour)) {
        toast.error("Enter the last four digits of the issued card");
        return;
      }
      const month = Number(form.expiryMonth);
      const year = Number(form.expiryYear);
      if (!month || month < 1 || month > 12 || !year) {
        toast.error("Enter a valid card expiry month and year");
        return;
      }
    }

    if (form.status === "REJECTED" && !form.rejectionReason.trim()) {
      toast.error("A rejection reason is required");
      return;
    }

    setUpdating(selected.id);
    try {
      const res = await fetch(`/api/admin/card-requests/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: form.status !== selected.status ? form.status : undefined,
          trackingNumber: form.trackingNumber || undefined,
          shippingCarrier: form.shippingCarrier || undefined,
          rejectionReason: form.rejectionReason.trim() || undefined,
          adminNote: form.adminNote.trim() || undefined,
          lastFour: form.status === "DELIVERED" ? form.lastFour : undefined,
          expiryMonth: form.status === "DELIVERED" ? Number(form.expiryMonth) : undefined,
          expiryYear: form.status === "DELIVERED" ? Number(form.expiryYear) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      toast.success("Card request updated");
      setSelected(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  const activePipelineIdx = pipelineIndex(form.status);
  const isClosed = selected ? TERMINAL.has(selected.status) : false;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Physical Card Requests"
        description="Review, approve, and fulfill physical debit card orders"
        action={<AdminRefreshButton onClick={refresh} />}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn("admin-filter-pill", filter === f.id && "admin-filter-pill-active")}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminFetchState
        loading={loading}
        error={error}
        onRetry={refresh}
        lastUpdated={lastUpdated}
        isEmpty={!loading && !error && requests.length === 0}
        emptyMessage="No physical card requests in the database"
      >
        <AdminReviewQueue>
          {requests.map((row) => (
            <AdminReviewCard key={row.id}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CreditCard size={16} className="text-accent-brand shrink-0" />
                  <Link href={`/admin/users/${row.user.id}`} className="font-medium hover:text-accent-brand">
                    {row.user.name}
                  </Link>
                  <span className="text-xs text-[var(--admin-muted)]">{row.user.email}</span>
                </div>
                <p className="text-sm text-[var(--admin-muted)] mt-1">
                  {row.tierLabel} · KYC {row.user.kycStatus}
                </p>
                <p className="text-xs text-[var(--admin-muted)] mt-2 whitespace-pre-wrap">{row.address.formatted}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="admin-status-pill">{row.statusLabel}</span>
                  <span className="text-[10px] text-[var(--admin-muted)]">
                    {new Date(row.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="admin-btn-primary text-xs px-4 py-2 shrink-0"
                onClick={() => openManage(row)}
              >
                Manage <ChevronRight size={14} className="inline ml-0.5" />
              </button>
            </AdminReviewCard>
          ))}
        </AdminReviewQueue>
      </AdminFetchState>

      <AdminModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Manage card request"
        description={
          selected
            ? `Request submitted ${new Date(selected.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`
            : undefined
        }
        size="lg"
        footer={
          <>
            <button type="button" className="admin-btn-ghost px-4 py-2 text-sm" onClick={() => setSelected(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn-primary px-5 py-2 text-sm"
              disabled={!selected || updating === selected.id || isClosed}
              onClick={submitUpdate}
            >
              {updating === selected?.id ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      >
        {selected && (
          <div className="admin-card-manage-modal">
            <div className="admin-card-manage-summary">
              <div className="admin-card-manage-summary-top">
                <div className="admin-card-manage-client">
                  <p className="admin-card-manage-client-name">{selected.user.name}</p>
                  <p className="admin-card-manage-client-meta">
                    {selected.user.email}
                    <br />
                    KYC {selected.user.kycStatus}
                  </p>
                </div>
                <span className="admin-card-manage-tier">
                  <CreditCard size={12} />
                  {selected.tierLabel}
                </span>
              </div>

              <div className="admin-card-manage-details">
                <div className="admin-card-manage-detail">
                  <User size={14} className="shrink-0 mt-0.5 opacity-70" />
                  <div>
                    <strong>Cardholder</strong>
                    {selected.recipientName}
                  </div>
                </div>
                <div className="admin-card-manage-detail">
                  <Phone size={14} className="shrink-0 mt-0.5 opacity-70" />
                  <div>
                    <strong>Contact</strong>
                    {selected.phone}
                  </div>
                </div>
                <div className="admin-card-manage-detail sm:col-span-2">
                  <MapPin size={14} className="shrink-0 mt-0.5 opacity-70" />
                  <div>
                    <strong>Delivery address</strong>
                    <span className="whitespace-pre-wrap">{selected.address.formatted}</span>
                  </div>
                </div>
              </div>
            </div>

            {isClosed ? (
              <div className="admin-card-manage-alert admin-card-manage-alert-warn">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>
                  This request is <strong>{selected.statusLabel}</strong> and cannot be modified.
                </p>
              </div>
            ) : (
              <>
                <div className="admin-card-manage-section">
                  <p className="admin-card-manage-section-title">Fulfillment pipeline</p>
                  <p className="admin-card-manage-section-desc">
                    Current stage:{" "}
                    <strong className="text-[var(--admin-text)]">
                      {STATUS_LABELS[form.status as keyof typeof STATUS_LABELS] ?? form.status}
                    </strong>
                  </p>
                  <div className="admin-card-manage-pipeline">
                    {CARD_STATUS_PIPELINE.map((step, index) => {
                      const done = activePipelineIdx >= 0 && index < activePipelineIdx;
                      const current = step === form.status;
                      return (
                        <span
                          key={step}
                          className={cn(
                            "admin-card-manage-pipeline-step",
                            done && "admin-card-manage-pipeline-step-done",
                            current && "admin-card-manage-pipeline-step-current"
                          )}
                        >
                          {STATUS_LABELS[step]}
                        </span>
                      );
                    })}
                  </div>

                  <div className="admin-field">
                    <label className="admin-field-label" htmlFor="card-status">
                      Set status
                    </label>
                    <select
                      id="card-status"
                      className="admin-input"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {CARD_STATUS_PIPELINE.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                      <option value="REJECTED">Rejected</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  {nextStageLabel && form.status !== "REJECTED" && form.status !== "CANCELLED" && (
                    <button
                      type="button"
                      className="admin-card-manage-advance"
                      onClick={advanceStatus}
                      disabled={pipelineIndex(form.status) >= CARD_STATUS_PIPELINE.length - 1}
                    >
                      Advance to {nextStageLabel}
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                {form.status !== "REJECTED" && form.status !== "CANCELLED" && (
                  <div className="admin-card-manage-section">
                    <p className="admin-card-manage-section-title">
                      <Truck size={13} className="inline mr-1 -mt-0.5" />
                      Shipment
                    </p>
                    <p className="admin-card-manage-section-desc">
                      Add tracking details before or when marking the card as shipped.
                    </p>
                    <div className="admin-card-manage-grid-2">
                      <div className="admin-field">
                        <label className="admin-field-label" htmlFor="card-carrier">
                          Carrier
                        </label>
                        <input
                          id="card-carrier"
                          className="admin-input"
                          placeholder="e.g. DHL, FedEx, UPS"
                          value={form.shippingCarrier}
                          onChange={(e) => setForm({ ...form, shippingCarrier: e.target.value })}
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-field-label" htmlFor="card-tracking">
                          Tracking number
                        </label>
                        <input
                          id="card-tracking"
                          className="admin-input font-mono text-sm"
                          placeholder="Tracking reference"
                          value={form.trackingNumber}
                          onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {form.status === "DELIVERED" && (
                  <div className="admin-card-manage-section">
                    <p className="admin-card-manage-section-title">
                      <Package size={13} className="inline mr-1 -mt-0.5" />
                      Issue physical card
                    </p>
                    <p className="admin-card-manage-section-desc">
                      Enter the issued card details. Only the last four digits are stored.
                    </p>
                    <div className="admin-card-manage-grid-3">
                      <div className="admin-field">
                        <label className="admin-field-label" htmlFor="card-last4">
                          Last 4 digits
                        </label>
                        <input
                          id="card-last4"
                          className="admin-input font-mono text-center tracking-widest"
                          maxLength={4}
                          inputMode="numeric"
                          placeholder="••••"
                          value={form.lastFour}
                          onChange={(e) => setForm({ ...form, lastFour: e.target.value.replace(/\D/g, "") })}
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-field-label" htmlFor="card-exp-month">
                          Exp. month
                        </label>
                        <input
                          id="card-exp-month"
                          className="admin-input"
                          inputMode="numeric"
                          placeholder="MM"
                          maxLength={2}
                          value={form.expiryMonth}
                          onChange={(e) => setForm({ ...form, expiryMonth: e.target.value.replace(/\D/g, "") })}
                        />
                      </div>
                      <div className="admin-field">
                        <label className="admin-field-label" htmlFor="card-exp-year">
                          Exp. year
                        </label>
                        <input
                          id="card-exp-year"
                          className="admin-input"
                          inputMode="numeric"
                          placeholder="YYYY"
                          maxLength={4}
                          value={form.expiryYear}
                          onChange={(e) => setForm({ ...form, expiryYear: e.target.value.replace(/\D/g, "") })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {form.status === "REJECTED" && (
                  <div className="admin-card-manage-section">
                    <p className="admin-card-manage-section-title">Rejection</p>
                    <div className="admin-card-manage-alert admin-card-manage-alert-danger">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>The customer will be notified with this reason.</p>
                    </div>
                    <div className="admin-field">
                      <label className="admin-field-label" htmlFor="card-reject-reason">
                        Rejection reason
                      </label>
                      <textarea
                        id="card-reject-reason"
                        className="admin-input min-h-[88px] resize-y"
                        placeholder="Explain why this request cannot be approved…"
                        value={form.rejectionReason}
                        onChange={(e) => setForm({ ...form, rejectionReason: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="admin-card-manage-section">
                  <p className="admin-card-manage-section-title">Internal note</p>
                  <p className="admin-card-manage-section-desc">Optional — visible to admins only, not sent to the client.</p>
                  <div className="admin-field">
                    <textarea
                      className="admin-input min-h-[72px] resize-y"
                      placeholder="Processing notes, verification details, etc."
                      value={form.adminNote}
                      onChange={(e) => setForm({ ...form, adminNote: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </AdminModal>
    </AdminPage>
  );
}
