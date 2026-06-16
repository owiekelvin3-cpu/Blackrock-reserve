"use client";

import { useI18n } from "@/components/providers/I18nProvider";

interface AdminFetchStateProps {
  loading: boolean;
  error: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry: () => void;
  lastUpdated?: Date | null;
  children: React.ReactNode;
}

export default function AdminFetchState({
  loading,
  error,
  isEmpty,
  emptyMessage,
  onRetry,
  lastUpdated,
  children,
}: AdminFetchStateProps) {
  const { t } = useI18n();
  const empty = emptyMessage ?? t("adminFetch.emptyDefault");

  if (loading) {
    return (
      <div className="admin-page-skeleton" aria-busy="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="admin-page-skeleton-row" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-data-card p-8 text-center">
        <p className="text-[var(--admin-text)] font-medium">{t("adminFetch.loadFailed")}</p>
        <p className="text-sm text-[var(--admin-muted)] mt-2">{error}</p>
        <button type="button" onClick={onRetry} className="admin-btn-primary mt-4 px-6 py-2 text-sm">
          {t("adminFetch.retry")}
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="admin-data-card p-12 text-center text-[var(--admin-muted)] text-sm">{empty}</div>
    );
  }

  return (
    <>
      {lastUpdated && (
        <p className="text-[10px] text-[var(--admin-muted)] mb-3 text-right px-1">
          {t("adminFetch.liveSync", { time: lastUpdated.toLocaleTimeString() })}
        </p>
      )}
      {children}
    </>
  );
}
