"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Minus, Eye, ExternalLink, Sparkles } from "lucide-react";
import { TrendScoreIndicator } from "./TrendScoreIndicator";
import clsx from "clsx";

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

interface TrendProductCardProps {
  product: TrendProduct;
  onImport: (product: TrendProduct) => void;
  onPreview: (product: TrendProduct) => void;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function VelocityBadge({ velocity }: { velocity: string }) {
  const configs = {
    rising: { icon: TrendingUp, text: "Rising Fast", color: "text-green-400 bg-green-400/10" },
    stable: { icon: Minus, text: "Stable", color: "text-yellow-400 bg-yellow-400/10" },
    declining: { icon: TrendingDown, text: "Declining", color: "text-red-400 bg-red-400/10" },
  };

  const config = configs[velocity as keyof typeof configs] || configs.stable;
  const Icon = config.icon;

  return (
    <span className={clsx("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
      <Icon className="w-3 h-3" />
      {config.text}
    </span>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string | null }) {
  if (!recommendation) return null;

  const configs = {
    import: { text: "Import", color: "bg-green-500 text-white" },
    watch: { text: "Watch", color: "bg-yellow-500 text-black" },
    skip: { text: "Skip", color: "bg-gray-500 text-white" },
  };

  const config = configs[recommendation as keyof typeof configs];
  if (!config) return null;

  return (
    <span className={clsx("px-2 py-0.5 rounded text-xs font-bold", config.color)}>
      AI: {config.text}
    </span>
  );
}

export function TrendProductCard({ product, onImport, onPreview }: TrendProductCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden group hover:border-tiktok-gray/80 transition-all">
      {/* Image */}
      <div className="aspect-[4/3] relative bg-tiktok-gray">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <VelocityBadge velocity={product.trend_velocity} />
          <RecommendationBadge recommendation={product.ai_recommendation} />
        </div>

        {/* Score indicator */}
        <div className="absolute top-2 right-2">
          <TrendScoreIndicator score={product.trend_score} size="sm" />
        </div>

        {/* Source badge */}
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-0.5 rounded bg-black/60 text-white text-xs">
            {product.source}
          </span>
        </div>

        {/* Imported indicator */}
        {product.is_imported && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
              Already Imported
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-medium line-clamp-2 mb-2 min-h-[48px]">
          {product.title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {formatNumber(product.view_count)}
          </span>
          {product.category && (
            <span className="text-xs bg-tiktok-gray/50 px-2 py-0.5 rounded">
              {product.category}
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-3">
          <div>
            {product.supplier_price_cents && (
              <div className="text-xs text-gray-500">
                Cost: {formatCurrency(product.supplier_price_cents)}
              </div>
            )}
            {product.suggested_price_cents && (
              <div className="text-lg font-bold text-white">
                Sell: {formatCurrency(product.suggested_price_cents)}
              </div>
            )}
          </div>
          {product.estimated_margin && (
            <div
              className={clsx(
                "text-right",
                product.estimated_margin >= 50 ? "text-green-400" :
                product.estimated_margin >= 30 ? "text-yellow-400" : "text-red-400"
              )}
            >
              <div className="text-xs text-gray-400">Margin</div>
              <div className="text-lg font-bold">{product.estimated_margin.toFixed(0)}%</div>
            </div>
          )}
        </div>

        {/* AI Reasoning */}
        {product.ai_reasoning && (
          <div className="mb-3">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1 text-xs text-tiktok-cyan hover:underline"
            >
              <Sparkles className="w-3 h-3" />
              {showReasoning ? "Hide AI Analysis" : "Show AI Analysis"}
            </button>
            {showReasoning && (
              <p className="mt-2 text-xs text-gray-400 bg-tiktok-gray/30 rounded p-2">
                {product.ai_reasoning}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onImport(product)}
            disabled={product.is_imported}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
              product.is_imported
                ? "bg-gray-500/20 text-gray-500 cursor-not-allowed"
                : "bg-tiktok-red text-white hover:bg-tiktok-red/90"
            )}
          >
            <Plus className="w-4 h-4" />
            {product.is_imported ? "Imported" : "Add to Store"}
          </button>
          {product.supplier_url && (
            <a
              href={product.supplier_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-tiktok-gray/50 rounded-lg text-gray-400 hover:text-white hover:bg-tiktok-gray transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
