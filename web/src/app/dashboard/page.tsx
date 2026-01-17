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
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentOrders } from "@/components/dashboard/RecentOrders";

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

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function DashboardOverview() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
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
        fetch(`${API_URL}/admin/orders?limit=5`),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (ordersRes.ok) {
        setRecentOrders(await ordersRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-gray-400">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <QuickActions />
      </section>

      {/* Stats Grid */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Today&apos;s Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Orders Today"
            value={stats?.orders_today?.toString() || "0"}
            icon={ShoppingCart}
            href="/dashboard/orders"
          />
          <StatsCard
            title="Revenue Today"
            value={formatCurrency(stats?.revenue_today_cents || 0)}
            icon={DollarSign}
            variant="success"
          />
          <StatsCard
            title="Live Products"
            value={`${stats?.live_products || 0} / ${stats?.total_products || 0}`}
            icon={Package}
            href="/dashboard/products"
          />
          <StatsCard
            title="AI Queue"
            value={stats?.pending_suggestions?.toString() || "0"}
            icon={Sparkles}
            href="/dashboard/discover"
            variant={stats?.pending_suggestions ? "warning" : "default"}
          />
        </div>
      </section>

      {/* Secondary Stats */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard
            title="Views Today"
            value={stats?.views_today?.toString() || "0"}
            icon={Eye}
          />
          <StatsCard
            title="Conversion Rate (7d)"
            value={`${stats?.conversion_rate?.toFixed(2) || "0.00"}%`}
            icon={TrendingUp}
            variant={
              (stats?.conversion_rate || 0) > 2
                ? "success"
                : (stats?.conversion_rate || 0) > 1
                ? "default"
                : "warning"
            }
          />
        </div>
      </section>

      {/* Recent Orders */}
      <section>
        <RecentOrders orders={recentOrders} loading={loading} />
      </section>
    </div>
  );
}
