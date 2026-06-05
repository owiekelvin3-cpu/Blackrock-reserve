"use client";

import { useSession } from "next-auth/react";
import EmptyState from "@/components/dashboard/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { LogIn } from "lucide-react";

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
  emptyTitle = "No data yet",
  emptyDescription = "Your account activity will appear here once you start using the platform.",
  emptyActionLabel,
  emptyActionHref,
}: DashboardGateProps) {
  const { status } = useSession();

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <EmptyState
        icon={LogIn}
        title="Sign in to view your dashboard"
        description="Log in to your account to see balances, transactions, and portfolio data."
        actionLabel="Sign In"
        actionHref="/login"
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    );
  }

  return <>{children}</>;
}
