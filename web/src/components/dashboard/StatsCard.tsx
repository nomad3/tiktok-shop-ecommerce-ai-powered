"use client";

import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
  href?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  href,
  variant = "default",
}: StatsCardProps) {
  const iconColors = {
    default: "text-tiktok-cyan",
    success: "text-green-400",
    warning: "text-yellow-400",
    danger: "text-red-400",
  };

  const content = (
    <div className="bg-tiktok-dark rounded-xl p-5 border border-tiktok-gray hover:border-tiktok-gray/80 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-tiktok-gray rounded-lg">
          <Icon className={clsx("w-5 h-5", iconColors[variant])} />
        </div>
        {href && (
          <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={change >= 0 ? "text-green-400" : "text-red-400"}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-gray-500 text-sm">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
