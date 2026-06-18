"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Copy, Check, Download, X, Shield, ArrowUpRight, FileText, TrendingUp, TrendingDown,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { LogoMark } from "@/components/layout/Logo";
import StockIcon from "@/components/capital-markets/StockIcon";
import { useI18n } from "@/components/providers/I18nProvider";
import { formatReferenceId } from "@/lib/transaction-receipt";
import { downloadReceiptAsImage } from "@/lib/receipt-image";
import type { SellReceiptData } from "@/lib/sell-receipt";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SellReceiptViewProps = {
  receipt: SellReceiptData;
  logoDomain?: string | null;
  logoUrl?: string | null;
  onClose: () => void;
};

export default function SellReceiptView({
  receipt,
  logoDomain,
  logoUrl,
  onClose,
}: SellReceiptViewProps) {
  const { t, formatCurrency, formatDate, formatTime } = useI18n();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const referenceId = formatReferenceId(receipt.id);
  const dateTime = `${formatDate(receipt.createdAt, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })} · ${formatTime(receipt.createdAt)}`;
  const positivePnl = receipt.realizedPnl >= 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receipt.id);
      setCopied(true);
      toast.success(t("sell.receipt.copied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setDownloading(true);
    try {
      await downloadReceiptAsImage(
        captureRef.current,
        `sell-receipt-${receipt.id.slice(-8)}.png`,
        { width: 440 }
      );
      toast.success(t("sell.receipt.downloaded"));
    } catch {
      toast.error(t("sell.receipt.downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col"
    >
      <div className="flex items-center justify-end px-2 pb-2">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] transition-colors"
          aria-label={t("common.close")}
        >
          <X size={20} />
        </button>
      </div>

      <div ref={captureRef} className="tx-receipt-capture rounded-xl mx-1">
        <div className="tx-receipt-header">
          <div className="tx-receipt-success-icon tx-receipt-brand-icon-wrap" aria-hidden>
            <LogoMark size="sm" className="rounded-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="tx-receipt-eyebrow">{t("brand.name")}</p>
            <h2 className="tx-receipt-title">{t("sell.receipt.title")}</h2>
            <p className="tx-receipt-subtitle">{t("sell.receipt.subtitle")}</p>
          </div>
        </div>

        <div className="tx-receipt-status-banner">
          <span className="tx-receipt-status-dot" aria-hidden />
          <div>
            <p className="tx-receipt-status-label">{t("sell.receipt.statusLabel")}</p>
            <p className="tx-receipt-status-hint">{t("sell.receipt.statusHint")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 mx-4 mb-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)]">
          <StockIcon
            symbol={receipt.symbol}
            name={receipt.assetName}
            logoDomain={logoDomain}
            logoUrl={logoUrl}
            size="md"
          />
          <div className="min-w-0">
            <p className="font-semibold text-[var(--text-primary)] truncate">{receipt.assetName}</p>
            <p className="text-xs font-mono text-[var(--text-muted)]">{receipt.symbol}</p>
          </div>
        </div>

        <div className="tx-receipt-amount-block">
          <p className="tx-receipt-amount-label">{t("sell.receipt.amount")}</p>
          <p className="tx-receipt-amount">{formatCurrency(receipt.netProceeds)}</p>
        </div>

        <div className="tx-receipt-grid">
          <ReceiptRow label={t("sell.receipt.reference")} value={referenceId} mono />
          <ReceiptRow label={t("sell.receipt.dateTime")} value={dateTime} />
          <ReceiptRow label={t("sell.receipt.sharesSold")} value={receipt.sharesSold.toFixed(6)} mono />
          <ReceiptRow label={t("sell.receipt.salePrice")} value={formatCurrency(receipt.priceAtSale)} />
          <ReceiptRow label={t("sell.receipt.grossProceeds")} value={formatCurrency(receipt.grossProceeds)} />
          <ReceiptRow label={t("sell.receipt.transactionFee")} value={formatCurrency(receipt.fee)} />
          <ReceiptRow label={t("sell.receipt.costBasis")} value={formatCurrency(receipt.costBasis)} />
          <ReceiptRow
            label={t("sell.receipt.realizedPl")}
            value={`${positivePnl ? "+" : ""}${formatCurrency(receipt.realizedPnl)}`}
            valueClassName={positivePnl ? "text-accent-green" : "text-accent-red"}
            icon={
              positivePnl ? (
                <TrendingUp size={13} className="text-accent-green shrink-0" />
              ) : (
                <TrendingDown size={13} className="text-accent-red shrink-0" />
              )
            }
          />
        </div>

        <div className="tx-receipt-message">
          <Shield size={15} className="text-accent-brand shrink-0 mt-0.5" />
          <p>{t("sell.receipt.confirmation")}</p>
        </div>
      </div>

      <div className="tx-receipt-actions px-1 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[44px] sm:flex-1"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download size={16} className="shrink-0" />
          {downloading ? t("common.processing") : t("sell.receipt.download")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[44px] sm:flex-1"
          onClick={handleCopy}
        >
          {copied ? (
            <Check size={16} className="shrink-0 text-accent-green" />
          ) : (
            <Copy size={16} className="shrink-0" />
          )}
          {t("sell.receipt.copyId")}
        </Button>
      </div>

      <div className="tx-receipt-footer-actions px-1 pb-1">
        <Link href="/dashboard/transactions" className="tx-receipt-link-btn" onClick={onClose}>
          <FileText size={15} />
          {t("sell.receipt.viewActivity")}
          <ArrowUpRight size={14} />
        </Link>
        <Button type="button" className="w-full min-h-[44px]" onClick={onClose}>
          {t("sell.receipt.close")}
        </Button>
      </div>
    </motion.div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  icon,
  valueClassName,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="tx-receipt-row">
      <span className="tx-receipt-row-label">{label}</span>
      <span
        className={cn(
          "tx-receipt-row-value inline-flex items-center gap-1 justify-end",
          mono && "tx-receipt-mono",
          valueClassName
        )}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}
