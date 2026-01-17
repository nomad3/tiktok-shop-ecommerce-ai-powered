"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationBell from "@/components/dashboard/NotificationBell";
import clsx from "clsx";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/dashboard/login";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Don't show sidebar on login page
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-tiktok-black">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tiktok-black">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Nav */}
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main content */}
      <main
        className={clsx(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-tiktok-black/80 backdrop-blur-lg border-b border-tiktok-gray">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-white flex-1">Command Center</span>
            <NotificationBell />
          </div>
        </div>

        <div className="p-4 lg:p-8 pb-20 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
