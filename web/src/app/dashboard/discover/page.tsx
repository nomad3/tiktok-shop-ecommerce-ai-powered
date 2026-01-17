"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Sparkles, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { TrendFilters, FilterState } from "@/components/dashboard/TrendFilters";
import { TrendProductCard } from "@/components/dashboard/TrendProductCard";

interface TrendProduct {
  id: number;
  external_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  source: string;
  category: string | null;
  trend_score: number;
  trend_velocity: string;
  view_count: number;
  like_count: number;
  supplier_url: string | null;
  supplier_price_cents: number | null;
  suggested_price_cents: number | null;
  estimated_margin: number | null;
  ai_recommendation: string | null;
  ai_reasoning: string | null;
  is_imported: boolean;
}

interface TrendStats {
  total_products: number;
  imported_products: number;
  rising_trends: number;
  ai_recommended: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DiscoverPage() {
  const { status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<TrendProduct[]>([]);
  const [stats, setStats] = useState<TrendStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    minPrice: 0,
    maxPrice: 10000,
    minScore: 0,
    velocity: [],
    sortBy: "trend_score",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
    }
  }, [status, router]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "12",
        sort_by: filters.sortBy,
      });

      if (filters.category !== "all") {
        params.append("category", filters.category);
      }
      if (filters.minPrice > 0) {
        params.append("min_price", (filters.minPrice * 100).toString());
      }
      if (filters.maxPrice < 10000) {
        params.append("max_price", (filters.maxPrice * 100).toString());
      }
      if (filters.minScore > 0) {
        params.append("min_score", filters.minScore.toString());
      }
      if (filters.velocity.length > 0) {
        filters.velocity.forEach((v) => params.append("velocity", v));
      }

      const response = await fetch(`${API_URL}/api/trends/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(Math.ceil(data.total / 12));
    } catch (error) {
      console.error("Error fetching trend products:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/trends/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  const handleSeedProducts = async () => {
    setSeeding(true);
    try {
      const response = await fetch(`${API_URL}/api/trends/seed`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to seed products");
      await fetchProducts();
      await fetchStats();
    } catch (error) {
      console.error("Error seeding products:", error);
    } finally {
      setSeeding(false);
    }
  };

  const handleImport = async (product: TrendProduct) => {
    setImporting(product.id);
    try {
      const response = await fetch(`${API_URL}/api/trends/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trend_product_id: product.id }),
      });

      if (!response.ok) throw new Error("Failed to import product");

      // Update local state to reflect the import
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_imported: true } : p))
      );
      await fetchStats();
    } catch (error) {
      console.error("Error importing product:", error);
    } finally {
      setImporting(null);
    }
  };

  const handlePreview = (product: TrendProduct) => {
    // Could open a modal or navigate to a detail view
    console.log("Preview product:", product);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  if (status === "loading") {
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
          <h1 className="text-2xl font-bold text-white mb-1">Discover</h1>
          <p className="text-gray-400">
            Find trending products and import them to your store with AI-powered insights.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedProducts}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-tiktok-gray/50 text-gray-300 rounded-lg hover:bg-tiktok-gray transition-colors disabled:opacity-50"
          >
            {seeding ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {seeding ? "Seeding..." : "Seed Demo Data"}
          </button>
          <button
            onClick={() => {
              fetchProducts();
              fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-tiktok-cyan text-black rounded-lg hover:bg-tiktok-cyan/90 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
            <div className="text-2xl font-bold text-white">{stats.total_products}</div>
            <div className="text-sm text-gray-400">Trending Products</div>
          </div>
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
            <div className="text-2xl font-bold text-green-400">{stats.rising_trends}</div>
            <div className="text-sm text-gray-400">Rising Trends</div>
          </div>
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
            <div className="text-2xl font-bold text-tiktok-cyan">{stats.ai_recommended}</div>
            <div className="text-sm text-gray-400">AI Recommended</div>
          </div>
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-4">
            <div className="text-2xl font-bold text-tiktok-red">{stats.imported_products}</div>
            <div className="text-sm text-gray-400">Imported</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <TrendFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Product Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiktok-cyan"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-12 text-center">
          <Sparkles className="w-12 h-12 text-tiktok-cyan mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Trending Products Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Click &quot;Seed Demo Data&quot; to add sample trending products, or run the trend
            ingestion to fetch real viral products.
          </p>
          <button
            onClick={handleSeedProducts}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-6 py-3 bg-tiktok-red text-white rounded-lg hover:bg-tiktok-red/90 transition-colors font-medium"
          >
            {seeding ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {seeding ? "Seeding..." : "Load Demo Products"}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <TrendProductCard
                key={product.id}
                product={product}
                onImport={handleImport}
                onPreview={handlePreview}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-400">
                Showing {(page - 1) * 12 + 1}-{Math.min(page * 12, total)} of {total} products
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-tiktok-gray/50 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? "bg-tiktok-cyan text-black"
                            : "bg-tiktok-gray/50 text-gray-400 hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-tiktok-gray/50 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
