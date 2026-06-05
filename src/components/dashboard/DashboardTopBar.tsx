"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, HelpCircle, Mail, Bell, Share2 } from "lucide-react";
import Button from "@/components/ui/Button";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/accounts": "Invoices",
  "/dashboard/analytics": "Analytics",
  "/dashboard/transfers": "Transactions",
  "/dashboard/investments": "Recurring",
  "/dashboard/cards": "Subscriptions",
  "/dashboard/settings": "Feedback",
};

export default function DashboardTopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const title = titles[pathname] || "Dashboard";
  const initial = session?.user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1">
          <button className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="text-sm text-text-secondary">
          <Link href="/dashboard" className="hover:text-white transition-colors">Platinum Crest</Link>
          <span className="mx-2">›</span>
          <span className="text-white">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="hidden sm:block p-2 rounded-xl text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors" aria-label="Help">
          <HelpCircle size={18} />
        </button>
        <button className="hidden sm:block p-2 rounded-xl text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors" aria-label="Messages">
          <Mail size={18} />
        </button>
        <button className="relative p-2 rounded-xl text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="h-9 w-9 rounded-full brand-gradient-bg flex items-center justify-center text-white text-sm font-bold ml-1">
          {initial}
        </div>
        <Button size="sm" className="hidden sm:inline-flex ml-2">
          <Share2 size={14} /> Share
        </Button>
      </div>
    </header>
  );
}
