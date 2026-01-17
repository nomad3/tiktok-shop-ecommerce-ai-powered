"use client";

import Link from "next/link";
import { Plus, Search, RefreshCw, FileText } from "lucide-react";

const actions = [
  {
    href: "/dashboard/products?action=new",
    label: "Add Product",
    icon: Plus,
    color: "from-tiktok-cyan to-blue-500",
  },
  {
    href: "/dashboard/discover",
    label: "Find Trends",
    icon: Search,
    color: "from-purple-500 to-pink-500",
  },
  {
    href: "/dashboard/orders",
    label: "Process Orders",
    icon: RefreshCw,
    color: "from-green-500 to-emerald-500",
  },
  {
    href: "/dashboard/marketing",
    label: "Generate Content",
    icon: FileText,
    color: "from-tiktok-red to-orange-500",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group bg-tiktok-dark rounded-xl p-4 border border-tiktok-gray hover:border-transparent hover:shadow-lg transition-all"
        >
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
          >
            <action.icon className="w-5 h-5 text-white" />
          </div>
          <p className="font-medium text-white group-hover:text-tiktok-cyan transition-colors">
            {action.label}
          </p>
        </Link>
      ))}
    </div>
  );
}
