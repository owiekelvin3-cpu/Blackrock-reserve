import { LucideIcon, Inbox } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="dash-card flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-2xl bg-bg-primary border border-white/10 flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-text-secondary mt-2 max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-6">
          <Button size="sm">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
