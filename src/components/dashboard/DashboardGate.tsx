"use client";

import { useSession } from "next-auth/react";
import EmptyState from "@/components/dashboard/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useI18n } from "@/components/providers/I18nProvider";

interface DashboardGateProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
}

export default function DashboardGate({
  children,
  isLoading,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionHref,
}: DashboardGateProps) {
  const { t } = useI18n();
  const { status } = useSession();
  const resolvedTitle = emptyTitle ?? t("dashboardExtra.noDataYet");
  const resolvedDescription = emptyDescription ?? t("dashboardExtra.noDataDesc");

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={resolvedTitle}
        description={resolvedDescription}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    );
  }

  return <>{children}</>;
}
