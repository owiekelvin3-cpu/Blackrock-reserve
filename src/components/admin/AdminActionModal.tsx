"use client";

import { useEffect, useState } from "react";

type AdminActionModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  loading?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  children?: React.ReactNode;
};

export default function AdminActionModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "primary",
  onClose,
  onConfirm,
  loading = false,
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Enter a reason…",
  children,
}: AdminActionModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) return;
    onConfirm(requireReason ? reason.trim() : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="admin-card max-w-md w-full p-6 space-y-4" role="dialog" aria-modal="true">
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          {description && <p className="text-sm text-[var(--admin-muted)] mt-1">{description}</p>}
        </div>

        {children}

        {requireReason && (
          <div>
            <label className="block text-xs text-[var(--admin-muted)] mb-1.5">{reasonLabel}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="admin-input w-full min-h-[100px] text-sm"
              placeholder={reasonPlaceholder}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="admin-btn-ghost text-xs px-4 py-2" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`text-xs px-4 py-2 rounded-lg font-medium ${
              variant === "danger"
                ? "admin-btn-ghost text-red-400"
                : "admin-btn-primary"
            }`}
            onClick={handleConfirm}
            disabled={loading || (requireReason && !reason.trim())}
          >
            {loading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
