"use client";

import Link from "next/link";
import { TrendingUp, ExternalLink } from "lucide-react";

interface Product {
  id: number;
  name: string;
  main_image_url: string | null;
  units_sold: number;
  revenue: number;
}

interface TopProductsProps {
  products: Product[];
  loading?: boolean;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function TopProducts({ products, loading }: TopProductsProps) {
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
    <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
      <div className="p-5 border-b border-tiktok-gray flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-tiktok-cyan" />
          <h3 className="text-lg font-semibold text-white">Top Products</h3>
        </div>
        <Link
          href="/dashboard/products"
          className="text-sm text-tiktok-cyan hover:underline flex items-center gap-1"
        >
          View all
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-tiktok-gray/50">
        {products.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No sales data yet
          </div>
        ) : (
          products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-4 hover:bg-tiktok-gray/20 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-tiktok-gray flex items-center justify-center">
                <span className="text-sm font-bold text-gray-400">
                  {index + 1}
                </span>
              </div>

              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-tiktok-gray">
                {product.main_image_url ? (
                  <img
                    src={product.main_image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{product.name}</p>
                <p className="text-sm text-gray-400">{product.units_sold} sold</p>
              </div>

              <div className="text-right">
                <p className="text-white font-semibold">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
