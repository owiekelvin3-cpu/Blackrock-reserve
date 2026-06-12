"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, Check, Download, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  buildReceiptDownloadText,
  downloadTextFile,
  formatReferenceId,
} from "@/lib/transaction-receipt";
import { toast } from "sonner";

export type MemberTransferReceiptData = {
  id: string;
  amount: number;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderEmail: string;
  accountName: string;
  note?: string | null;
  createdAt: string;
  status: string;
};

type Props = {
  open: boolean;
  receipt: MemberTransferReceiptData | null;
  onClose: () => void;
};

export default function MemberTransferReceiptModal({ open, receipt, onClose }: Props) {
  const { t, formatCurrency, formatDate, formatTime } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!receipt) return null;

  const referenceId = formatReferenceId(receipt.id);
  const dateTime = `${formatDate(receipt.createdAt, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} · ${formatTime(receipt.createdAt)}`;

  const fullDateTime = `${formatDate(receipt.createdAt, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })} · ${formatTime(receipt.createdAt)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receipt.id);
      setCopied(true);
      toast.success(t("withdrawals.memberTransfer.receipt.copied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleDownload = () => {
    const text = buildReceiptDownloadText({
      title: t("withdrawals.memberTransfer.receipt.title"),
      referenceId,
      status: t("withdrawals.memberTransfer.receipt.completed"),
      amount: formatCurrency(receipt.amount),
      destination: receipt.recipientEmail,
      destinationExtra: receipt.note,
      paymentMethod: t("withdrawals.memberTransfer.title"),
      dateTime: fullDateTime,
      confirmationMessage: t("withdrawals.memberTransfer.receipt.confirmation"),
      brandName: t("brand.name"),
    });
    downloadTextFile(`member-transfer-${receipt.id.slice(-8)}.txt`, text);
    toast.success(t("withdrawals.memberTransfer.receipt.downloaded"));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="tx-receipt-backdrop tx-receipt-backdrop-strong tx-member-transfer-backdrop"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            aria-hidden
            className="tx-receipt-backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.button
            type="button"
            aria-label={t("common.close")}
            className="tx-receipt-backdrop-dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-transfer-receipt-title"
            className="tx-receipt-modal tx-member-transfer-receipt"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="tx-mt-top">
              <div className="tx-mt-brand">
                <span className="tx-receipt-brand-mark" aria-hidden>
                  BR
                </span>
                <div className="min-w-0">
                  <p className="tx-mt-brand-name">{t("brand.name")}</p>
                  <p className="tx-mt-brand-tag">{t("withdrawals.memberTransfer.receipt.subtitle")}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="tx-receipt-close tx-mt-close" aria-label={t("common.close")}>
                <X size={16} />
              </button>
            </div>

            <div className="tx-mt-hero">
              <div className="tx-mt-hero-icon" aria-hidden>
                <CheckCircle2 size={22} className="text-accent-green" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="member-transfer-receipt-title" className="tx-mt-title">
                  {t("withdrawals.memberTransfer.receipt.successTitle")}
                </h2>
                <p className="tx-mt-meta">
                  {t("withdrawals.memberTransfer.receipt.completed")} · {referenceId}
                </p>
              </div>
              <p className="tx-mt-amount">{formatCurrency(receipt.amount)}</p>
            </div>

            <dl className="tx-mt-details">
              <DetailItem label={t("withdrawals.receipt.dateTime")} value={dateTime} />
              <DetailItem label={t("withdrawals.memberTransfer.receipt.transferType")} value={t("withdrawals.memberTransfer.title")} />
              <DetailItem label={t("withdrawals.receipt.sourceAccount")} value={receipt.accountName} />
              <DetailItem
                label={t("withdrawals.memberTransfer.receipt.sender")}
                value={receipt.senderName}
                sub={receipt.senderEmail}
              />
              <DetailItem
                label={t("withdrawals.memberTransfer.receipt.recipient")}
                value={receipt.recipientName}
                sub={receipt.recipientEmail}
              />
              {receipt.note && (
                <DetailItem label={t("withdrawals.memberTransfer.memoOptional")} value={receipt.note} />
              )}
            </dl>

            <p className="tx-mt-footnote">{t("withdrawals.memberTransfer.receipt.confirmationShort")}</p>

            <div className="tx-mt-actions">
              <button type="button" className="tx-mt-action-btn" onClick={handleDownload}>
                <Download size={15} />
                <span>{t("withdrawals.receipt.download")}</span>
              </button>
              <button type="button" className="tx-mt-action-btn" onClick={handleCopy}>
                {copied ? <Check size={15} className="text-accent-green" /> : <Copy size={15} />}
                <span>{t("withdrawals.receipt.copyId")}</span>
              </button>
              <Button type="button" size="sm" className="tx-mt-close-btn" onClick={onClose}>
                {t("withdrawals.receipt.close")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="tx-mt-detail">
      <dt className="tx-mt-detail-label">{label}</dt>
      <dd className="tx-mt-detail-value">
        <span>{value}</span>
        {sub && <span className="tx-mt-detail-sub">{sub}</span>}
      </dd>
    </div>
  );
}
