"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingCart, ExternalLink, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Order {
  id: number;
  product_id: number | null;
  product_name: string | null;
  email: string;
  amount_cents: number;
  status: string;
  stripe_session_id: string | null;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    abandoned: "bg-gray-500/20 text-gray-400",
    refunded: "bg-red-500/20 text-red-400",
    fulfilled: "bg-blue-500/20 text-blue-400"
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (authStatus === "authenticated") {
      fetchOrders();
    }
  }, [authStatus, router, filter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const url = filter
        ? `${API_URL}/admin/orders?status=${filter}&limit=100`
        : `${API_URL}/admin/orders?limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status === "paid" || o.status === "fulfilled")
    .reduce((acc, o) => acc + o.amount_cents, 0);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Orders</h1>
          <p className="text-gray-400">
            {orders.length} orders · {formatCurrency(totalRevenue)} total revenue
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-tiktok-gray text-white rounded-lg px-4 py-2 border border-tiktok-gray focus:border-tiktok-cyan outline-none"
          >
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="pending">Pending</option>
            <option value="abandoned">Abandoned</option>
            <option value="refunded">Refunded</option>
          </select>

          <button
            onClick={fetchOrders}
            className="p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-400 mb-2">No orders yet</h2>
          <p className="text-gray-500">
            Orders will appear here when customers complete checkout
          </p>
        </div>
      ) : (
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tiktok-gray">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-tiktok-gray/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium">#{order.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-300">
                        {order.product_name || `Product #${order.product_id}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-400">{order.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium">
                        {formatCurrency(order.amount_cents)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-400">{formatDate(order.created_at)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {order.stripe_session_id && (
                        <a
                          href={`https://dashboard.stripe.com/payments/${order.stripe_session_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-tiktok-cyan hover:underline text-sm"
                        >
                          Stripe <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
