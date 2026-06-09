"use client";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardAuthGuard from "@/components/dashboard/DashboardAuthGuard";

/** Client-side auth fallback when server session is unavailable */
export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGuard>
      <div className="min-h-screen bg-bg-primary">
        <DashboardSidebar />
        <div className="lg:ml-[260px] min-h-screen">
          <main className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-[1400px]">
            <DashboardTopBar />
            {children}
          </main>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
