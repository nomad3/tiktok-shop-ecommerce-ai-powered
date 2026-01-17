"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  X,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { AIContentGenerator } from "@/components/dashboard/AIContentGenerator";

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
  supplier_url?: string;
  supplier_name?: string;
  supplier_cost_cents?: number;
  profit_margin?: number;
  import_source?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  live: { bg: "bg-green-500/20", text: "text-green-400" },
  testing: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  paused: { bg: "bg-gray-500/20", text: "text-gray-400" },
  killed: { bg: "bg-red-500/20", text: "text-red-400" },
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function calculateMargin(price: number, cost: number): number {
  if (!cost || cost === 0) return 0;
  return ((price - cost) / price) * 100;
}

function ProductsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
      return;
    }

    if (status === "authenticated") {
      fetchProducts();
    }
  }, [status, router]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShowAddModal(true);
    }
  }, [searchParams]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProduct(productId: number, updates: Partial<Product>) {
    try {
      const res = await fetch(`${API_URL}/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? updated : p))
        );
        setEditingProduct(null);
      }
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  }

  async function createProduct(product: Partial<Product>) {
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (res.ok) {
        const newProduct = await res.json();
        setProducts((prev) => [newProduct, ...prev]);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error("Failed to create product:", error);
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-white mb-1">Products</h1>
          <p className="text-gray-400">Manage your product catalog.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-tiktok-red text-white font-medium rounded-lg hover:bg-tiktok-red/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-2 pl-10 bg-tiktok-dark border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-tiktok-dark border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
        >
          <option value="all">All Status</option>
          <option value="live">Live</option>
          <option value="testing">Testing</option>
          <option value="paused">Paused</option>
          <option value="killed">Killed</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            No products found
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden group"
            >
              {/* Image */}
              <div className="aspect-square relative bg-tiktok-gray">
                {product.main_image_url ? (
                  <img
                    src={product.main_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={clsx(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      statusColors[product.status]?.bg || "bg-gray-500/20",
                      statusColors[product.status]?.text || "text-gray-400"
                    )}
                  >
                    {product.status}
                  </span>
                </div>
                {/* Quick Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="p-2 bg-tiktok-dark/80 rounded-lg text-white hover:bg-tiktok-dark"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <h3 className="text-white font-medium truncate mb-1">
                  {product.name}
                </h3>
                <p className="text-gray-400 text-sm truncate mb-3">
                  {product.slug}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-bold">
                    {formatCurrency(product.price_cents)}
                  </span>
                  {product.supplier_cost_cents && (
                    <span className="text-xs text-gray-400">
                      Cost: {formatCurrency(product.supplier_cost_cents)}
                    </span>
                  )}
                </div>

                {/* Scores */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-tiktok-gray/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">Trend</span>
                    <p className="text-sm font-medium text-tiktok-cyan">
                      {product.trend_score.toFixed(0)}
                    </p>
                  </div>
                  <div className="flex-1 bg-tiktok-gray/50 rounded px-2 py-1">
                    <span className="text-xs text-gray-400">Urgency</span>
                    <p className="text-sm font-medium text-tiktok-red">
                      {product.urgency_score.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateProduct(product.id, {
                        status: product.status === "live" ? "paused" : "live",
                      })
                    }
                    className={clsx(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      product.status === "live"
                        ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                        : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    )}
                  >
                    {product.status === "live" ? (
                      <>
                        <EyeOff className="w-4 h-4 inline mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 inline mr-1" />
                        Go Live
                      </>
                    )}
                  </button>
                  <a
                    href={`/p/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-tiktok-gray/50 rounded-lg text-gray-400 hover:text-white hover:bg-tiktok-gray transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(updates) => updateProduct(editingProduct.id, updates)}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <ProductModal
          product={null}
          onClose={() => setShowAddModal(false)}
          onSave={createProduct}
        />
      )}
    </div>
  );
}

// Product Modal Component
function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
}) {
  const [formData, setFormData] = useState({
    slug: product?.slug || "",
    name: product?.name || "",
    description: product?.description || "",
    price_cents: product?.price_cents || 1999,
    main_image_url: product?.main_image_url || "",
    status: product?.status || "testing",
    supplier_url: product?.supplier_url || "",
    supplier_name: product?.supplier_name || "",
    supplier_cost_cents: product?.supplier_cost_cents || 0,
  });
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const margin = calculateMargin(formData.price_cents, formData.supplier_cost_cents);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      profit_margin: margin,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-tiktok-gray">
          <h2 className="text-xl font-bold text-white">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {!product && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.main_image_url}
                onChange={(e) =>
                  setFormData({ ...formData, main_image_url: e.target.value })
                }
                className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Price (cents) *
                </label>
                <input
                  type="number"
                  value={formData.price_cents}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_cents: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  = {formatCurrency(formData.price_cents)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                >
                  <option value="testing">Testing</option>
                  <option value="live">Live</option>
                  <option value="paused">Paused</option>
                  <option value="killed">Killed</option>
                </select>
              </div>
            </div>

            {/* Supplier Section */}
            <div className="border-t border-tiktok-gray pt-4 mt-4">
              <h3 className="text-lg font-medium text-white mb-4">
                Supplier Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Supplier URL
                  </label>
                  <input
                    type="url"
                    value={formData.supplier_url}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_url: e.target.value })
                    }
                    placeholder="https://aliexpress.com/item/..."
                    className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier_name: e.target.value })
                      }
                      placeholder="AliExpress, CJ Dropshipping..."
                      className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Supplier Cost (cents)
                    </label>
                    <input
                      type="number"
                      value={formData.supplier_cost_cents}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          supplier_cost_cents: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      = {formatCurrency(formData.supplier_cost_cents)}
                    </p>
                  </div>
                </div>

                {/* Profit Margin Display */}
                {formData.supplier_cost_cents > 0 && (
                  <div className="bg-tiktok-gray/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Profit Margin</span>
                      <span
                        className={clsx(
                          "text-xl font-bold",
                          margin >= 50
                            ? "text-green-400"
                            : margin >= 30
                            ? "text-yellow-400"
                            : "text-red-400"
                        )}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Profit per sale:{" "}
                      {formatCurrency(formData.price_cents - formData.supplier_cost_cents)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Content Generator Section */}
            <div className="border-t border-tiktok-gray pt-4 mt-4">
              <button
                type="button"
                onClick={() => setShowAIGenerator(!showAIGenerator)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tiktok-cyan to-tiktok-red flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">AI Content Generator</h3>
                    <p className="text-xs text-gray-400">Generate descriptions, ad copy & pricing</p>
                  </div>
                </div>
                <ChevronDown
                  className={clsx(
                    "w-5 h-5 text-gray-400 transition-transform",
                    showAIGenerator && "rotate-180"
                  )}
                />
              </button>

              {showAIGenerator && formData.name && (
                <div className="mt-4">
                  <AIContentGenerator
                    productName={formData.name}
                    supplierCostCents={formData.supplier_cost_cents || undefined}
                    onDescriptionGenerated={(desc) =>
                      setFormData({ ...formData, description: desc })
                    }
                    onPricingGenerated={(price) =>
                      setFormData({ ...formData, price_cents: price })
                    }
                  />
                </div>
              )}

              {showAIGenerator && !formData.name && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
                  Please enter a product name first to use the AI generator.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-tiktok-gray text-white font-medium rounded-lg hover:bg-tiktok-gray/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-tiktok-red text-white font-medium rounded-lg hover:bg-tiktok-red/90"
            >
              {product ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
