"use client";

import { Bell, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import Badge from "@/components/ui/Badge";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-text-muted hover:text-accent-brand transition-colors" aria-label="Search">
          <Search size={18} />
        </button>
        <button className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 text-text-muted hover:text-accent-brand transition-colors" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent-brand" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent-brand to-accent-brand-red flex items-center justify-center text-white text-sm font-bold">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
          <Badge variant="gold">Premium</Badge>
        </div>
      </div>
    </header>
  );
}
