"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Package,
  ShoppingBag,
  BarChart3,
  Menu,
} from "lucide-react";
import clsx from "clsx";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
    matchPaths: ["/dashboard"],
  },
  {
    href: "/dashboard/products",
    label: "Products",
    icon: Package,
    matchPaths: ["/dashboard/products", "/dashboard/trends"],
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    icon: ShoppingBag,
    matchPaths: ["/dashboard/orders"],
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    matchPaths: ["/dashboard/analytics"],
  },
  {
    href: "/dashboard/settings",
    label: "More",
    icon: Menu,
    matchPaths: [
      "/dashboard/settings",
      "/dashboard/integrations",
      "/dashboard/marketing",
      "/dashboard/support",
    ],
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPaths) {
      return item.matchPaths.some((path) => {
        if (path === "/dashboard") {
          return pathname === path;
        }
        return pathname.startsWith(path);
      });
    }
    return pathname === item.href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-tiktok-dark border-t border-tiktok-gray lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                active ? "text-tiktok-cyan" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon
                className={clsx(
                  "w-5 h-5",
                  active && "text-tiktok-cyan"
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-tiktok-cyan rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
