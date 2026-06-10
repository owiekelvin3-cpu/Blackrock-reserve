"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, ArrowUpFromLine, LineChart, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardLayout } from "@/components/dashboard/DashboardLayoutContext";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/deposit", label: "Deposit", icon: Wallet, match: (p: string) => p.startsWith("/dashboard/deposit") },
  { href: "/dashboard/withdrawals", label: "Withdraw", icon: ArrowUpFromLine, match: (p: string) => p.startsWith("/dashboard/withdrawals") },
  { href: "/dashboard/capital-markets", label: "Markets", icon: LineChart, match: (p: string) => p.startsWith("/dashboard/capital-markets") },
] as const;

export default function DashboardMobileNav() {
  const pathname = usePathname();
  const { openSidebar, sidebarOpen } = useDashboardLayout();

  const moreActive =
    sidebarOpen ||
    (!tabs.some((t) => t.match(pathname)) &&
      pathname.startsWith("/dashboard") &&
      pathname !== "/dashboard");

  return (
    <nav
      className="dash-mobile-nav lg:hidden"
      aria-label="Primary mobile navigation"
    >
      <div className="dash-mobile-nav-inner">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn("dash-mobile-nav-item", active && "dash-mobile-nav-item-active")}
            >
              <tab.icon size={20} strokeWidth={active ? 2.25 : 1.75} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openSidebar}
          className={cn("dash-mobile-nav-item", moreActive && "dash-mobile-nav-item-active")}
          aria-label="Open full menu"
          aria-expanded={sidebarOpen}
        >
          <Menu size={20} strokeWidth={moreActive ? 2.25 : 1.75} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
