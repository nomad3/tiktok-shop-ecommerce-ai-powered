"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Target,
  AlertCircle,
  Info,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DailyDigest {
  summary: string;
  key_metrics: {
    revenue_cents: number;
    orders: number;
    conversion_rate: number;
    avg_order_value_cents: number;
  };
  highlights: string[];
  concerns: string[];
  recommendations: string[];
  generated_at: string;
}

interface Anomaly {
  type: string;
  severity: string;
  message: string;
  product_id: number | null;
  suggested_action: string;
  detected_at: string;
}

interface TrendPrediction {
  product_id: number | null;
  product_name: string;
  predicted_score: number;
  confidence: number;
  reasoning: string;
}

interface PricingSuggestion {
  product_id: number;
  product_name: string;
  current_price_cents: number;
  suggested_price_cents: number;
  expected_impact: string;
  reasoning: string;
}

const severityConfig = {
  critical: { color: "text-red-400", bgColor: "bg-red-500/20", icon: AlertCircle },
  warning: { color: "text-yellow-400", bgColor: "bg-yellow-500/20", icon: AlertTriangle },
  info: { color: "text-blue-400", bgColor: "bg-blue-500/20", icon: Info },
};

export default function InsightsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [predictions, setPredictions] = useState<TrendPrediction[]>([]);
  const [priceSuggestions, setPriceSuggestions] = useState<PricingSuggestion[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
    }
    if (status === "authenticated") {
      fetchAllInsights();
    }
  }, [status, router]);

  const fetchAllInsights = async () => {
    setLoading(true);
    try {
      const [digestRes, anomaliesRes, predictionsRes, pricesRes] = await Promise.all([
        fetch(`${API_URL}/api/insights/daily-digest`).catch(() => null),
        fetch(`${API_URL}/api/insights/anomalies`).catch(() => null),
        fetch(`${API_URL}/api/insights/predictions`).catch(() => null),
        fetch(`${API_URL}/api/insights/price-optimization`).catch(() => null),
      ]);

      if (digestRes?.ok) setDigest(await digestRes.json());
      if (anomaliesRes?.ok) setAnomalies(await anomaliesRes.json());
      if (predictionsRes?.ok) setPredictions(await predictionsRes.json());
      if (pricesRes?.ok) setPriceSuggestions(await pricesRes.json());
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllInsights();
    setRefreshing(false);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Brain className="w-12 h-12 text-tiktok-cyan animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Analyzing your business data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-tiktok-cyan rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Insights</h1>
              <p className="text-gray-400">Intelligent analysis and recommendations</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-tiktok-gray text-white rounded-lg hover:bg-tiktok-gray/80 disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Daily Digest */}
      {digest && (
        <div className="bg-gradient-to-br from-purple-500/20 to-tiktok-cyan/20 rounded-xl border border-purple-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Daily Digest</h2>
          </div>
          <p className="text-white text-lg mb-6">{digest.summary}</p>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Revenue</p>
              <p className="text-white text-xl font-bold">
                {formatCurrency(digest.key_metrics.revenue_cents)}
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Orders</p>
              <p className="text-white text-xl font-bold">{digest.key_metrics.orders}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Conversion</p>
              <p className="text-white text-xl font-bold">
                {digest.key_metrics.conversion_rate.toFixed(2)}%
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Avg Order</p>
              <p className="text-white text-xl font-bold">
                {formatCurrency(digest.key_metrics.avg_order_value_cents)}
              </p>
            </div>
          </div>

          {/* Highlights & Concerns */}
          <div className="grid md:grid-cols-2 gap-4">
            {digest.highlights.length > 0 && (
              <div>
                <h3 className="text-green-400 text-sm font-medium mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Highlights
                </h3>
                <ul className="space-y-1">
                  {digest.highlights.map((h, i) => (
                    <li key={i} className="text-white text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-1">+</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {digest.concerns.length > 0 && (
              <div>
                <h3 className="text-yellow-400 text-sm font-medium mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Watch Out
                </h3>
                <ul className="space-y-1">
                  {digest.concerns.map((c, i) => (
                    <li key={i} className="text-white text-sm flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">!</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {digest.recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h3 className="text-tiktok-cyan text-sm font-medium mb-2 flex items-center gap-1">
                <Lightbulb className="w-4 h-4" /> Recommendations
              </h3>
              <ul className="space-y-1">
                {digest.recommendations.map((r, i) => (
                  <li key={i} className="text-white text-sm flex items-start gap-2">
                    <span className="text-tiktok-cyan">{i + 1}.</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Alerts & Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Alerts & Anomalies</h2>
            <span className="ml-auto px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              {anomalies.length} active
            </span>
          </div>
          <div className="space-y-3">
            {anomalies.map((anomaly, i) => {
              const config = severityConfig[anomaly.severity as keyof typeof severityConfig] || severityConfig.info;
              const Icon = config.icon;

              return (
                <div key={i} className={clsx("rounded-lg p-4", config.bgColor)}>
                  <div className="flex items-start gap-3">
                    <Icon className={clsx("w-5 h-5 mt-0.5", config.color)} />
                    <div className="flex-1">
                      <p className="text-white font-medium">{anomaly.message}</p>
                      <p className="text-gray-400 text-sm mt-1">{anomaly.suggested_action}</p>
                    </div>
                    <span className={clsx("text-xs px-2 py-0.5 rounded capitalize", config.bgColor, config.color)}>
                      {anomaly.severity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trend Predictions */}
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-tiktok-cyan" />
            <h2 className="text-lg font-semibold text-white">Trend Predictions</h2>
          </div>
          {predictions.length > 0 ? (
            <div className="space-y-3">
              {predictions.slice(0, 5).map((prediction) => (
                <div
                  key={prediction.product_id}
                  className="flex items-center gap-3 p-3 bg-tiktok-gray/30 rounded-lg"
                >
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      prediction.predicted_score >= 70
                        ? "bg-green-500/20"
                        : prediction.predicted_score >= 50
                        ? "bg-yellow-500/20"
                        : "bg-red-500/20"
                    )}
                  >
                    {prediction.predicted_score >= 50 ? (
                      <TrendingUp
                        className={clsx(
                          "w-5 h-5",
                          prediction.predicted_score >= 70 ? "text-green-400" : "text-yellow-400"
                        )}
                      />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {prediction.product_name}
                    </p>
                    <p className="text-gray-400 text-xs truncate">{prediction.reasoning}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={clsx(
                        "text-lg font-bold",
                        prediction.predicted_score >= 70
                          ? "text-green-400"
                          : prediction.predicted_score >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                      )}
                    >
                      {prediction.predicted_score.toFixed(0)}
                    </p>
                    <p className="text-gray-500 text-xs">{(prediction.confidence * 100).toFixed(0)}% conf</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No predictions available</p>
          )}
        </div>

        {/* Pricing Optimization */}
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Pricing Suggestions</h2>
          </div>
          {priceSuggestions.length > 0 ? (
            <div className="space-y-3">
              {priceSuggestions.slice(0, 5).map((suggestion) => {
                const isIncrease = suggestion.suggested_price_cents > suggestion.current_price_cents;
                const changePercent = Math.abs(
                  ((suggestion.suggested_price_cents - suggestion.current_price_cents) /
                    suggestion.current_price_cents) *
                    100
                );

                return (
                  <div
                    key={suggestion.product_id}
                    className="p-3 bg-tiktok-gray/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium text-sm truncate flex-1">
                        {suggestion.product_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">
                          {formatCurrency(suggestion.current_price_cents)}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span
                          className={clsx(
                            "font-medium text-sm",
                            isIncrease ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {formatCurrency(suggestion.suggested_price_cents)}
                        </span>
                        <span
                          className={clsx(
                            "flex items-center text-xs",
                            isIncrease ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {isIncrease ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          {changePercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs">{suggestion.reasoning}</p>
                    <p className="text-tiktok-cyan text-xs mt-1">{suggestion.expected_impact}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No pricing suggestions at this time</p>
          )}
        </div>
      </div>
    </div>
  );
}
