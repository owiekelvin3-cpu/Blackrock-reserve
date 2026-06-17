"use client";

import { useState } from "react";
import { ArrowDownToLine, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ProfitWithdrawPanel from "@/components/dashboard/ProfitWithdrawPanel";
import { useI18n } from "@/components/providers/I18nProvider";

interface ProfitWithdrawButtonProps {
  profitBalance: number;
  onSuccess: () => void;
  className?: string;
}

export default function ProfitWithdrawButton({
  profitBalance,
  onSuccess,
  className = "",
}: ProfitWithdrawButtonProps) {
  const { t, formatCurrency } = useI18n();
  const [open, setOpen] = useState(false);

  if (profitBalance <= 0) return null;

  const handleSuccess = () => {
    onSuccess();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`dash-profit-withdraw-btn ${className}`.trim()}
        aria-label={t("investments.profitWithdrawTitle")}
      >
        <ArrowDownToLine size={12} strokeWidth={2.5} />
        {t("dashboard.profitWithdraw")}
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 bg-bg-secondary p-5 sm:p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profit-withdraw-title"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5"
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>

              <div className="pr-10 mb-4">
                <p id="profit-withdraw-title" className="text-lg font-semibold text-text-primary">
                  {t("investments.profitWithdrawTitle")}
                </p>
                <p className="text-sm text-text-muted mt-1">
                  {t("investments.profitBalance")}:{" "}
                  <span className="text-accent-green font-semibold tabular-nums">
                    {formatCurrency(profitBalance)}
                  </span>
                </p>
              </div>

              <ProfitWithdrawPanel
                profitBalance={profitBalance}
                onSuccess={handleSuccess}
                embedded
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
