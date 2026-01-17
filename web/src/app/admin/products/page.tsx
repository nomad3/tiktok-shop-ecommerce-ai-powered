"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Package,
  Edit,
  ExternalLink,
  Play,
  Pause,
  Trash2,
  Loader2,
  Plus
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Product {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  main_image_url: string | null;
  status: string;
  trend_score: number;
  urgency_score: number;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    live: "bg-green-500/20 text-green-400",
    testing: "bg-yellow-500/20 text-yellow-400",
    paused: "bg-gray-500/20 text-gray-400",
    killed: "bg-red-500/20 text-red-400"
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.testing}`}>
      {status}
    </span>
  );
}

export default function ProductsPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (authStatus === "authenticated") {
      fetchProducts();
    }
  }, [authStatus, router]);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_URL}/products?limit=100`);
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(productId: number, newStatus: string) {
    setUpdating(productId);
    try {
      const res = await fetch(`${API_URL}/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(null);
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(cents / 100);
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Products</h1>
          <p className="text-gray-400">Manage your product catalog</p>
        </div>
        <button
          onClick={() => router.push("/admin/queue")}
          className="flex items-center gap-2 bg-tiktok-red hover:bg-tiktok-red/90 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add from AI Queue
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-400 mb-2">No products yet</h2>
          <p className="text-gray-500 mb-4">
            Approve AI suggestions or seed demo data
          </p>
          <button
            onClick={async () => {
              await fetch(`${API_URL}/seed`, { method: "POST" });
              fetchProducts();
            }}
            className="text-tiktok-cyan hover:underline"
          >
            Seed demo products
          </button>
        </div>
      ) : (
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-tiktok-gray/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Scores
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tiktok-gray">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-tiktok-gray/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {product.main_image_url ? (
                          <img
                            src={product.main_image_url}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-tiktok-gray flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-gray-500 text-sm">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">
                        {formatCurrency(product.price_cents)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <span className="text-tiktok-cyan text-sm">
                          T: {product.trend_score.toFixed(0)}
                        </span>
                        <span className="text-tiktok-red text-sm">
                          U: {product.urgency_score.toFixed(0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {updating === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <>
                            {product.status !== "live" && (
                              <button
                                onClick={() => updateStatus(product.id, "live")}
                                className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                                title="Set Live"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {product.status === "live" && (
                              <button
                                onClick={() => updateStatus(product.id, "paused")}
                                className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                                title="Pause"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            )}
                            {product.status !== "killed" && (
                              <button
                                onClick={() => updateStatus(product.id, "killed")}
                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Kill"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <a
                              href={`/p/${product.slug}`}
                              target="_blank"
                              className="p-2 text-gray-400 hover:bg-tiktok-gray rounded-lg transition-colors"
                              title="View"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </>
                        )}
                      </div>
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
