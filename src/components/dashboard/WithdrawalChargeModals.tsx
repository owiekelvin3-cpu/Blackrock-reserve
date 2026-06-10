"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, Copy, Check, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type ChargeMethods = {
  bitcoinWalletAddress: string;
  bitcoinPurchaseLink: string;
  depositInstructions: string;
};

export function WithdrawalChargeNoticeModal({
  chargeAmount,
  open,
  onCancel,
  onContinue,
}: {
  chargeAmount: number;
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border-accent-brand/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-amber-400" size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Withdrawal Charge Required</h2>
            <p className="text-xs text-text-muted mt-1">Account-specific processing fee</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Your account has a withdrawal processing charge of{" "}
          <span className="font-semibold text-white">{formatCurrency(chargeAmount)}</span>. This charge{" "}
          <strong className="text-white">cannot be paid using funds already available</strong> in your account
          (main balance, profit balance, invested balance, or referral earnings).
        </p>
        <p className="text-sm text-text-secondary leading-relaxed mt-3">
          A <strong className="text-white">new deposit</strong> must be made to cover this charge before your
          withdrawal request can be processed.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <Button type="button" variant="outline" className="w-full sm:flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" className="w-full sm:flex-1" onClick={onContinue}>
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function PayWithdrawalChargeModal({
  open,
  onClose,
  withdrawalId,
  chargeAmount,
  methods,
  qrCodeDataUrl,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  withdrawalId: string;
  chargeAmount: number;
  methods: ChargeMethods;
  qrCodeDataUrl?: string;
  onPaid: () => void;
}) {
  const [txHash, setTxHash] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const copyAddress = async () => {
    if (!methods.bitcoinWalletAddress) return;
    await navigator.clipboard.writeText(methods.bitcoinWalletAddress);
    setCopied(true);
    toast.success("Wallet address copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/dashboard/withdrawals/${withdrawalId}/pay-charge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ txHash, proofNote: proofNote || undefined, paymentMethod: "BITCOIN" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");
      toast.success(json.message);
      setTxHash("");
      setProofNote("");
      onPaid();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Pay Withdrawal Charge</h2>
            <p className="text-sm text-accent-brand font-semibold mt-0.5">{formatCurrency(chargeAmount)}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-text-muted" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed mb-4">
          {methods.depositInstructions ||
            "Send a new deposit to the wallet below. This payment is separate from your account balances and will be verified by our team."}
        </p>

        {methods.bitcoinWalletAddress ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-4">
            {qrCodeDataUrl && (
              <div className="flex justify-center mb-4">
                <Image src={qrCodeDataUrl} alt="Bitcoin QR" width={160} height={160} className="rounded-lg" unoptimized />
              </div>
            )}
            <p className="text-[10px] uppercase text-text-muted mb-1">Bitcoin wallet address</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-text-primary break-all flex-1 font-mono">{methods.bitcoinWalletAddress}</code>
              <button type="button" onClick={copyAddress} className="p-2 rounded-lg hover:bg-white/5 shrink-0" aria-label="Copy address">
                {copied ? <Check size={16} className="text-accent-green" /> : <Copy size={16} className="text-text-muted" />}
              </button>
            </div>
            {methods.bitcoinPurchaseLink && (
              <a
                href={methods.bitcoinPurchaseLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs text-accent-brand hover:underline"
              >
                Buy Bitcoin →
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-amber-400 mb-4">Payment wallet not configured. Contact support.</p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Transaction hash / reference"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="Paste your transaction ID"
            required
          />
          <Input
            label="Payment note (optional)"
            value={proofNote}
            onChange={(e) => setProofNote(e.target.value)}
            placeholder="Any additional payment details"
          />
          <Button type="submit" className="w-full" disabled={submitting || !txHash.trim()}>
            {submitting ? "Submitting…" : "Submit Charge Payment Proof"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
