"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import clsx from "clsx";

interface DataPoint {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: DataPoint[];
  loading?: boolean;
}

const periods = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  const [period, setPeriod] = useState(7);

  const filteredData = data.slice(-period);
  const total = filteredData.reduce((sum, d) => sum + d.revenue, 0);

  if (loading) {
    return (
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Revenue</h3>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(total)}</p>
        </div>
        <div className="flex gap-1 bg-tiktok-gray rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={clsx(
                "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                period === p.value
                  ? "bg-tiktok-red text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#25F4EE" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#25F4EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "12px",
              }}
              labelStyle={{ color: "#999" }}
              formatter={(value) => [formatCurrency(value as number), "Revenue"]}
              labelFormatter={(label) => formatDate(label)}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#25F4EE"
              strokeWidth={2}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
