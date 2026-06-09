"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, HelpCircle, Mail } from "lucide-react";
import DashboardNotifications from "@/components/dashboard/DashboardNotifications";
import ThemeToggle from "@/components/ui/ThemeToggle";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/accounts": "Accounts",
  "/dashboard/analytics": "Analytics",
  "/dashboard/deposit": "Deposit",
  "/dashboard/withdrawals": "Withdraw",
  "/dashboard/investments": "Investments",
  "/dashboard/capital-markets": "Capital Markets",
  "/dashboard/settings": "Settings",
};

export default function DashboardTopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const title = titles[pathname] || "Dashboard";
  const initial = session?.user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <header className="flex items-center justify-between gap-3 mb-6 pl-12 lg:pl-0 min-w-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <button className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="text-sm text-text-secondary min-w-0 truncate">
          <Link href="/dashboard" className="hover:text-white transition-colors hidden sm:inline">Blackrock Reserve</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors sm:hidden">BR</Link>
          <span className="mx-1.5 sm:mx-2">›</span>
          <span className="text-white">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <ThemeToggle size="sm" />
        <button className="hidden sm:block p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors" aria-label="Help">
          <HelpCircle size={18} />
        </button>
        <button className="hidden sm:block p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors" aria-label="Messages">
          <Mail size={18} />
        </button>
        <DashboardNotifications />
        <div className="h-9 w-9 rounded-full brand-gradient-bg flex items-center justify-center text-white text-sm font-bold ml-1">
          {initial}
        </div>
      </div>
    </header>
  );
}
