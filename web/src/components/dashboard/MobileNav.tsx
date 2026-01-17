"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  Package,
  ShoppingCart,
  Megaphone,
  BarChart3,
  Plug,
  Settings,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/discover", label: "Discover", icon: Search, badge: "AI" },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone, badge: "AI" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug, disabled: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-tiktok-dark z-50 lg:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-tiktok-gray">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
              <div className="w-10 h-10 bg-gradient-to-br from-tiktok-cyan to-tiktok-red rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">Command</span>
                <span className="block text-xs text-gray-400">AI E-Commerce</span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.disabled ? "#" : item.href}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                    } else {
                      onClose();
                    }
                  }}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-tiktok-red/10 text-tiktok-red"
                      : item.disabled
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-white hover:bg-tiktok-gray/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-tiktok-cyan to-tiktok-red text-white rounded">
                      {item.badge}
                    </span>
                  )}
                  {item.disabled && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-tiktok-gray text-gray-400 rounded">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-tiktok-gray">
            {session?.user && (
              <div className="flex items-center gap-3 mb-3 px-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/dashboard/login" })}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
