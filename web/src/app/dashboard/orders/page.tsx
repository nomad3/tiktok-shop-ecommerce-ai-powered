"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, RefreshCw, Download } from "lucide-react";
import { OrderKanban } from "@/components/dashboard/OrderKanban";
import { OrderDetailModal } from "@/components/dashboard/OrderDetailModal";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Order {
  id: number;
  product_name: string | null;
  email: string;
  amount_cents: number;
  status: string;
  created_at: string;
  shipping_address?: string;
  stripe_session_id?: string;
  tracking_number?: string;
  tracking_url?: string;
}

interface OrderStats {
  new: number;
  processing: number;
  shipped: number;
  delivered: number;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function OrdersPage() {
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState<OrderStats>({ new: 0, processing: 0, shipped: 0, delivered: 0 });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
      return;
    }

    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/orders?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);

        // Calculate stats
        const newStats = { new: 0, processing: 0, shipped: 0, delivered: 0 };
        data.forEach((order: Order) => {
          if (order.status === "paid") newStats.new++;
          else if (order.status === "processing") newStats.processing++;
          else if (order.status === "shipped") newStats.shipped++;
          else if (["delivered", "fulfilled"].includes(order.status)) newStats.delivered++;
        });
        setStats(newStats);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: number, newStatus: string) {
    try {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  }

  async function addTracking(orderId: number, tracking: string, url?: string) {
    try {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: tracking, tracking_url: url }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, tracking_number: tracking, tracking_url: url }
              : o
          )
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            tracking_number: tracking,
            tracking_url: url,
          });
        }
        // Auto-update status to shipped if adding tracking
        if (tracking) {
          updateOrderStatus(orderId, "shipped");
        }
      }
    } catch (error) {
      console.error("Failed to add tracking:", error);
    }
  }

  function exportOrders() {
    const csv = [
      ["ID", "Product", "Email", "Amount", "Status", "Date"].join(","),
      ...orders.map((o) =>
        [
          o.id,
          `"${o.product_name || ""}"`,
          o.email,
          (o.amount_cents / 100).toFixed(2),
          o.status,
          o.created_at,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Orders</h1>
          <p className="text-gray-400">Manage and fulfill customer orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={exportOrders}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <div className="flex bg-tiktok-gray rounded-lg p-1">
            <button
              onClick={() => setView("kanban")}
              className={clsx(
                "p-2 rounded-md transition-colors",
                view === "kanban"
                  ? "bg-tiktok-red text-white"
                  : "text-gray-400 hover:text-white"
              )}
              title="Kanban view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={clsx(
                "p-2 rounded-md transition-colors",
                view === "list"
                  ? "bg-tiktok-red text-white"
                  : "text-gray-400 hover:text-white"
              )}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-tiktok-dark rounded-xl p-4 border border-tiktok-gray">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-400 text-sm">New</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.new}</p>
        </div>
        <div className="bg-tiktok-dark rounded-xl p-4 border border-tiktok-gray">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-400 text-sm">Processing</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.processing}</p>
        </div>
        <div className="bg-tiktok-dark rounded-xl p-4 border border-tiktok-gray">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-gray-400 text-sm">Shipped</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.shipped}</p>
        </div>
        <div className="bg-tiktok-dark rounded-xl p-4 border border-tiktok-gray">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400 text-sm">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.delivered}</p>
        </div>
      </div>

      {/* Content */}
      {view === "kanban" ? (
        <OrderKanban
          orders={orders}
          onStatusChange={updateOrderStatus}
          onViewDetails={setSelectedOrder}
          loading={loading}
        />
      ) : (
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
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
                    Customer
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tiktok-gray/50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
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
                        <span className="text-gray-400">{order.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-white font-medium">
                          {formatCurrency(order.amount_cents)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-tiktok-gray border-none rounded text-sm text-white px-2 py-1 cursor-pointer"
                        >
                          <option value="paid">New</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-tiktok-cyan hover:underline text-sm"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={updateOrderStatus}
        onAddTracking={addTracking}
      />
    </div>
  );
}
