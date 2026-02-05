"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Zap, Eye, ShoppingCart, Hash, Clock, Target } from "lucide-react";

interface TrendMetrics {
  hashtag: string;
  views: number;
  engagement: number;
  conversion_rate: number;
  revenue: number;
  velocity: "viral" | "hot" | "trending" | "stable" | "declining";
  category: string;
  timeOnTrend: string;
  peakViews: number;
  change24h: number;
}

interface TrendPerformanceProps {
  trends?: TrendMetrics[];
  timeframe?: string;
}

export function TrendPerformance({ trends, timeframe = "Last 7 days" }: TrendPerformanceProps) {
  const [sortBy, setSortBy] = useState<"revenue" | "views" | "conversion">("revenue");

  const defaultTrends: TrendMetrics[] = [
    {
      hashtag: "tiktokmademebuyit",
      views: 2400000,
      engagement: 180000,
      conversion_rate: 3.2,
      revenue: 15600,
      velocity: "viral",
      category: "Lifestyle",
      timeOnTrend: "2d 14h",
      peakViews: 850000,
      change24h: 127.3
    },
    {
      hashtag: "aestheticfinds",
      views: 1800000,
      engagement: 126000,
      conversion_rate: 2.8,
      revenue: 12300,
      velocity: "hot", 
      category: "Fashion",
      timeOnTrend: "4d 8h",
      peakViews: 620000,
      change24h: 45.7
    },
    {
      hashtag: "productreview",
      views: 950000,
      engagement: 87000,
      conversion_rate: 4.1,
      revenue: 8900,
      velocity: "trending",
      category: "Tech",
      timeOnTrend: "1d 3h",
      peakViews: 340000,
      change24h: -12.4
    },
    {
      hashtag: "selfcarefinds",
      views: 720000,
      engagement: 54000,
      conversion_rate: 2.3,
      revenue: 5600,
      velocity: "stable",
      category: "Beauty",
      timeOnTrend: "6d 12h",
      peakViews: 180000,
      change24h: 8.9
    },
    {
      hashtag: "budgetfinds",
      views: 430000,
      engagement: 31000,
      conversion_rate: 1.8,
      revenue: 2100,
      velocity: "declining",
      category: "Lifestyle", 
      timeOnTrend: "8d 5h",
      peakViews: 95000,
      change24h: -28.6
    }
  ];

  const trendData = trends || defaultTrends;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case "viral": return "text-red-400 bg-red-500/20";
      case "hot": return "text-orange-400 bg-orange-500/20";
      case "trending": return "text-yellow-400 bg-yellow-500/20";
      case "stable": return "text-blue-400 bg-blue-500/20";
      case "declining": return "text-gray-400 bg-gray-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };

  const getVelocityIcon = (velocity: string) => {
    switch (velocity) {
      case "viral": return <Zap className="w-3 h-3 animate-pulse" />;
      case "hot": return <TrendingUp className="w-3 h-3" />;
      case "trending": return <Target className="w-3 h-3" />;
      case "stable": return <Clock className="w-3 h-3" />;
      case "declining": return <TrendingDown className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? "text-green-400" : "text-red-400";
  };

  const sortedTrends = [...trendData].sort((a, b) => {
    switch (sortBy) {
      case "revenue": return b.revenue - a.revenue;
      case "views": return b.views - a.views;
      case "conversion": return b.conversion_rate - a.conversion_rate;
      default: return b.revenue - a.revenue;
    }
  });

  return (
    <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Trend Performance</h3>
          <p className="text-sm text-gray-400">{timeframe} • Top performing hashtags</p>
        </div>
        
        {/* Sort Controls */}
        <div className="flex bg-tiktok-gray rounded-lg p-1">
          {[
            { key: "revenue", label: "Revenue" },
            { key: "views", label: "Views" },
            { key: "conversion", label: "CVR" }
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key as typeof sortBy)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                sortBy === option.key
                  ? "bg-tiktok-red text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {sortedTrends.map((trend, index) => (
          <div key={trend.hashtag} className="bg-tiktok-gray/30 rounded-lg p-4 border border-white/5 hover:bg-tiktok-gray/50 transition-colors">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-tiktok-cyan" />
                  <span className="text-white font-semibold">{trend.hashtag}</span>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getVelocityColor(trend.velocity)}`}>
                  {getVelocityIcon(trend.velocity)}
                  {trend.velocity}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="text-gray-400">{trend.category}</div>
                <div className={`flex items-center gap-1 ${getChangeColor(trend.change24h)}`}>
                  {trend.change24h > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(trend.change24h).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Eye className="w-3 h-3" />
                  Views
                </div>
                <div className="text-white font-bold">{formatNumber(trend.views)}</div>
                <div className="text-xs text-gray-500">Peak: {formatNumber(trend.peakViews)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <TrendingUp className="w-3 h-3" />
                  Engagement
                </div>
                <div className="text-white font-bold">{formatNumber(trend.engagement)}</div>
                <div className="text-xs text-gray-500">{((trend.engagement / trend.views) * 100).toFixed(1)}% rate</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Target className="w-3 h-3" />
                  Conversion
                </div>
                <div className="text-white font-bold">{trend.conversion_rate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Above avg</div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <ShoppingCart className="w-3 h-3" />
                  Revenue
                </div>
                <div className="text-tiktok-cyan font-bold">{formatCurrency(trend.revenue)}</div>
                <div className="text-xs text-gray-500">On trend: {trend.timeOnTrend}</div>
              </div>
            </div>

            {/* Progress Bar for Trend Lifecycle */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Trend Lifecycle</span>
                <span>{trend.timeOnTrend}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    trend.velocity === "viral" ? "bg-gradient-to-r from-red-500 to-pink-500" :
                    trend.velocity === "hot" ? "bg-gradient-to-r from-orange-500 to-red-500" :
                    trend.velocity === "trending" ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                    trend.velocity === "stable" ? "bg-gradient-to-r from-blue-500 to-purple-500" :
                    "bg-gradient-to-r from-gray-500 to-gray-600"
                  }`}
                  style={{ 
                    width: `${Math.min(100, (parseInt(trend.timeOnTrend.split('d')[0]) * 10) + 20)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-tiktok-gray/20 rounded-lg p-3">
            <div className="text-gray-400 mb-1">Total Trend Revenue</div>
            <div className="text-white font-bold text-lg">
              {formatCurrency(trendData.reduce((sum, t) => sum + t.revenue, 0))}
            </div>
          </div>
          <div className="bg-tiktok-gray/20 rounded-lg p-3">
            <div className="text-gray-400 mb-1">Avg. Conversion Rate</div>
            <div className="text-white font-bold text-lg">
              {(trendData.reduce((sum, t) => sum + t.conversion_rate, 0) / trendData.length).toFixed(1)}%
            </div>
          </div>
          <div className="bg-tiktok-gray/20 rounded-lg p-3">
            <div className="text-gray-400 mb-1">Active Viral Trends</div>
            <div className="text-white font-bold text-lg">
              {trendData.filter(t => t.velocity === "viral" || t.velocity === "hot").length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}