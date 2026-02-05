"use client";

import { TrendingDown, TrendingUp, Users, Eye, ShoppingCart, CreditCard } from "lucide-react";

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  change?: number;
}

interface ConversionFunnelProps {
  data?: FunnelData[];
  timeframe?: string;
}

export function ConversionFunnel({ data, timeframe = "Last 30 days" }: ConversionFunnelProps) {
  const defaultData: FunnelData[] = [
    {
      stage: "Visitors",
      count: 12547,
      percentage: 100,
      icon: <Eye className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600",
      change: 8.2
    },
    {
      stage: "Product Views", 
      count: 8934,
      percentage: 71.2,
      icon: <Users className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600", 
      change: 12.1
    },
    {
      stage: "Added to Cart",
      count: 2156,
      percentage: 17.2,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "from-orange-500 to-orange-600",
      change: -3.4
    },
    {
      stage: "Started Checkout",
      count: 891,
      percentage: 7.1,
      icon: <CreditCard className="w-5 h-5" />,
      color: "from-green-500 to-green-600",
      change: 5.7
    },
    {
      stage: "Completed Purchase",
      count: 234,
      percentage: 1.9,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-tiktok-cyan to-cyan-400",
      change: 15.3
    }
  ];

  const funnelData = data || defaultData;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    return change > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  };

  const getChangeColor = (change?: number) => {
    if (!change) return "text-gray-400";
    return change > 0 ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Conversion Funnel</h3>
          <p className="text-sm text-gray-400">{timeframe}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Overall Conversion</div>
          <div className="text-2xl font-bold text-tiktok-cyan">1.9%</div>
        </div>
      </div>

      <div className="space-y-4">
        {funnelData.map((stage, index) => {
          const nextStage = funnelData[index + 1];
          const dropoffCount = nextStage ? stage.count - nextStage.count : 0;
          const dropoffRate = nextStage ? ((dropoffCount / stage.count) * 100) : 0;

          return (
            <div key={stage.stage}>
              {/* Stage Bar */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${stage.color} text-white`}>
                      {stage.icon}
                    </div>
                    <div>
                      <div className="text-white font-medium">{stage.stage}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">{formatNumber(stage.count)}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{stage.percentage.toFixed(1)}%</span>
                        {stage.change && (
                          <div className={`flex items-center gap-1 ${getChangeColor(stage.change)}`}>
                            {getChangeIcon(stage.change)}
                            <span className="text-xs">{Math.abs(stage.change)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stage.color} transition-all duration-1000 ease-out relative`}
                    style={{ width: `${stage.percentage}%` }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>

              {/* Dropoff Indicator */}
              {nextStage && dropoffCount > 0 && (
                <div className="flex items-center justify-center py-2">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1">
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">
                        -{formatNumber(dropoffCount)} ({dropoffRate.toFixed(1)}% drop-off)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Key Insights</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-400">Biggest drop-off: Product View → Add to Cart (71% loss)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-400">Strong: Checkout → Purchase (26% conversion)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-400">Opportunity: Improve product page engagement</span>
          </div>
        </div>
      </div>
    </div>
  );
}