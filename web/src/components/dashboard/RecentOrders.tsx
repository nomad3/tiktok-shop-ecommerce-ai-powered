"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import clsx from "clsx";

interface Order {
  id: number;
  product_name: string | null;
  email: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

interface RecentOrdersProps {
  orders: Order[];
  loading?: boolean;
}

const statusStyles: Record<string, string> = {
  paid: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  processing: "bg-blue-500/20 text-blue-400",
  shipped: "bg-purple-500/20 text-purple-400",
  delivered: "bg-tiktok-cyan/20 text-tiktok-cyan",
  cancelled: "bg-red-500/20 text-red-400",
  refunded: "bg-gray-500/20 text-gray-400",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentOrders({ orders, loading }: RecentOrdersProps) {
  if (loading) {
    return (
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
        <div className="p-5 border-b border-tiktok-gray flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
      <div className="p-5 border-b border-tiktok-gray flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
        <Link
          href="/dashboard/orders"
          className="text-sm text-tiktok-cyan hover:underline flex items-center gap-1"
        >
          View all
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-tiktok-gray/30">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Order
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Product
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Amount
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tiktok-gray/50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No orders yet
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-tiktok-gray/20 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-white font-medium">#{order.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-gray-300 truncate max-w-[150px] block">
                      {order.product_name || "Unknown"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white font-medium">
                      {formatCurrency(order.amount_cents)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={clsx(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        statusStyles[order.status] || "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-gray-400 text-sm">
                      {formatDate(order.created_at)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
