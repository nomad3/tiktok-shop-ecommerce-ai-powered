"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  ArrowUp,
  ArrowDown,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { OrdersChart } from "@/components/dashboard/OrdersChart";
import { TopProducts } from "@/components/dashboard/TopProducts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface OverviewStats {
  total_revenue_cents: number;
  total_orders: number;
  conversion_rate: number;
  avg_order_value_cents: number;
  revenue_change: number;
  orders_change: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface OrdersData {
  date: string;
  paid: number;
  pending: number;
  cancelled: number;
}

interface TopProduct {
  id: number;
  name: string;
  main_image_url: string | null;
  units_sold: number;
  revenue: number;
}

// Generate mock data for development
function generateMockRevenueData(days: number): RevenueData[] {
  const data: RevenueData[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      revenue: Math.floor(Math.random() * 500 + 100),
    });
  }
  return data;
}

function generateMockOrdersData(days: number): OrdersData[] {
  const data: OrdersData[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      paid: Math.floor(Math.random() * 10 + 1),
      pending: Math.floor(Math.random() * 3),
      cancelled: Math.floor(Math.random() * 2),
    });
  }
  return data;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [ordersData, setOrdersData] = useState<OrdersData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
      return;
    }

    if (status === "authenticated") {
      fetchAnalytics();
    }
  }, [status, router]);

  async function fetchAnalytics() {
    try {
      // Try to fetch from API
      const [overviewRes, revenueRes, ordersRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/analytics/overview`).catch(() => null),
        fetch(`${API_URL}/analytics/revenue?days=90`).catch(() => null),
        fetch(`${API_URL}/analytics/orders?days=30`).catch(() => null),
        fetch(`${API_URL}/analytics/top-products?limit=5`).catch(() => null),
      ]);

      if (overviewRes?.ok) {
        setOverview(await overviewRes.json());
      } else {
        // Use mock data
        setOverview({
          total_revenue_cents: 125000,
          total_orders: 47,
          conversion_rate: 2.4,
          avg_order_value_cents: 2660,
          revenue_change: 12.5,
          orders_change: 8.3,
        });
      }

      if (revenueRes?.ok) {
        setRevenueData(await revenueRes.json());
      } else {
        setRevenueData(generateMockRevenueData(90));
      }

      if (ordersRes?.ok) {
        setOrdersData(await ordersRes.json());
      } else {
        setOrdersData(generateMockOrdersData(30));
      }

      if (productsRes?.ok) {
        setTopProducts(await productsRes.json());
      } else {
        setTopProducts([]);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      // Fallback to mock data
      setOverview({
        total_revenue_cents: 125000,
        total_orders: 47,
        conversion_rate: 2.4,
        avg_order_value_cents: 2660,
        revenue_change: 12.5,
        orders_change: 8.3,
      });
      setRevenueData(generateMockRevenueData(90));
      setOrdersData(generateMockOrdersData(30));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-gray-400">Track your store performance and insights.</p>
        </div>
        <Link
          href="/dashboard/analytics/insights"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-tiktok-cyan text-white rounded-lg font-medium hover:opacity-90"
        >
          <Brain className="w-5 h-5" />
          AI Insights
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(overview?.total_revenue_cents || 0)}
          icon={DollarSign}
          change={overview?.revenue_change}
          changeLabel="vs last period"
          variant="success"
        />
        <StatsCard
          title="Total Orders"
          value={overview?.total_orders?.toString() || "0"}
          icon={ShoppingCart}
          change={overview?.orders_change}
          changeLabel="vs last period"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${overview?.conversion_rate?.toFixed(2) || "0.00"}%`}
          icon={TrendingUp}
          variant={
            (overview?.conversion_rate || 0) > 2
              ? "success"
              : (overview?.conversion_rate || 0) > 1
              ? "default"
              : "warning"
          }
        />
        <StatsCard
          title="Avg. Order Value"
          value={formatCurrency(overview?.avg_order_value_cents || 0)}
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} loading={loading} />
        <OrdersChart data={ordersData} loading={loading} />
      </div>

      {/* Top Products */}
      <TopProducts products={topProducts} loading={loading} />
    </div>
  );
}
