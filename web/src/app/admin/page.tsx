"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Eye,
  Sparkles,
  TrendingUp,
  ArrowUpRight
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Stats {
  orders_today: number;
  revenue_today_cents: number;
  total_products: number;
  live_products: number;
  pending_suggestions: number;
  views_today: number;
  conversion_rate: number;
}

interface Order {
  id: number;
  product_name: string | null;
  email: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  href
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  href?: string;
}) {
  return (
    <div className="bg-tiktok-dark rounded-xl p-6 border border-tiktok-gray">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-tiktok-gray rounded-lg">
          <Icon className="w-5 h-5 text-tiktok-cyan" />
        </div>
        {href && (
          <a href={href} className="text-gray-400 hover:text-white">
            <ArrowUpRight className="w-5 h-5" />
          </a>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {trend && (
        <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          {trend}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  async function fetchData() {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`),
        fetch(`${API_URL}/admin/orders?limit=5`)
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (ordersRes.ok) {
        setRecentOrders(await ordersRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your store performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Orders Today"
          value={stats?.orders_today?.toString() || "0"}
          icon={ShoppingCart}
          href="/admin/orders"
        />
        <StatCard
          title="Revenue Today"
          value={formatCurrency(stats?.revenue_today_cents || 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Live Products"
          value={`${stats?.live_products || 0} / ${stats?.total_products || 0}`}
          icon={Package}
          href="/admin/products"
        />
        <StatCard
          title="AI Queue"
          value={stats?.pending_suggestions?.toString() || "0"}
          icon={Sparkles}
          href="/admin/queue"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard
          title="Views Today"
          value={stats?.views_today?.toString() || "0"}
          icon={Eye}
        />
        <StatCard
          title="Conversion Rate (7d)"
          value={`${stats?.conversion_rate?.toFixed(2) || "0.00"}%`}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
        <div className="p-6 border-b border-tiktok-gray">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-tiktok-gray/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tiktok-gray">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-tiktok-gray/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium">#{order.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-300">{order.product_name || "Unknown"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-400">{order.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white">{formatCurrency(order.amount_cents)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "paid"
                            ? "bg-green-500/20 text-green-400"
                            : order.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-400">{formatDate(order.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {recentOrders.length > 0 && (
          <div className="p-4 border-t border-tiktok-gray">
            <a
              href="/admin/orders"
              className="text-tiktok-cyan hover:underline text-sm"
            >
              View all orders →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
