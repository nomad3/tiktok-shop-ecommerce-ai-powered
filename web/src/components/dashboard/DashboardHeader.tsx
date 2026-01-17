"use client";

import { Bell, Search, Menu } from "lucide-react";
import { useState } from "react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
}

export function DashboardHeader({ title, subtitle, onMenuClick, showMobileMenu }: DashboardHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-tiktok-black/80 backdrop-blur-lg border-b border-tiktok-gray">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {showMobileMenu && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search..."
              className="w-64 px-4 py-2 pl-10 bg-tiktok-dark border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-tiktok-red rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
