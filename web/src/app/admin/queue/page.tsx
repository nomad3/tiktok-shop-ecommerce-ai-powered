"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Eye,
  MessageCircle,
  Check,
  X,
  Loader2
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Suggestion {
  id: number;
  hashtag: string;
  views: number;
  growth_rate: number;
  engagement: number;
  video_count: number;
  trend_score: number;
  urgency_score: number;
  ai_reasoning: string | null;
  suggested_name: string | null;
  suggested_description: string | null;
  suggested_price_cents: number | null;
  status: string;
  created_at: string;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500/20 text-green-400 border-green-500/30";
    if (s >= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <div className={`px-3 py-1 rounded-lg border ${getColor(score)}`}>
      <span className="text-xs font-medium">{label}</span>
      <span className="ml-2 font-bold">{score.toFixed(0)}</span>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onApprove,
  onReject,
  loading
}: {
  suggestion: Suggestion;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  loading: number | null;
}) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              #{suggestion.hashtag}
            </h3>
            {suggestion.suggested_name && (
              <p className="text-tiktok-cyan text-sm">
                → {suggestion.suggested_name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <ScoreBadge score={suggestion.trend_score} label="Trend" />
            <ScoreBadge score={suggestion.urgency_score} label="Urgency" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <Eye className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-white font-medium">{formatNumber(suggestion.views)}</p>
            <p className="text-gray-500 text-xs">Views</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-white font-medium">{suggestion.growth_rate.toFixed(1)}%</p>
            <p className="text-gray-500 text-xs">Growth</p>
          </div>
          <div className="text-center">
            <MessageCircle className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-white font-medium">{formatNumber(suggestion.engagement)}</p>
            <p className="text-gray-500 text-xs">Engagement</p>
          </div>
          <div className="text-center">
            <Sparkles className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-white font-medium">{formatNumber(suggestion.video_count)}</p>
            <p className="text-gray-500 text-xs">Videos</p>
          </div>
        </div>

        {/* AI Reasoning */}
        {suggestion.ai_reasoning && (
          <div className="bg-tiktok-gray/50 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm">{suggestion.ai_reasoning}</p>
          </div>
        )}

        {/* Description */}
        {suggestion.suggested_description && (
          <p className="text-gray-400 text-sm mb-4">
            {suggestion.suggested_description}
          </p>
        )}

        {/* Price suggestion */}
        {suggestion.suggested_price_cents && (
          <p className="text-gray-500 text-sm mb-4">
            Suggested price:{" "}
            <span className="text-white font-medium">
              ${(suggestion.suggested_price_cents / 100).toFixed(2)}
            </span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-tiktok-gray/30 border-t border-tiktok-gray flex gap-3">
        <button
          onClick={() => onApprove(suggestion.id)}
          disabled={loading === suggestion.id}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading === suggestion.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Approve
        </button>
        <button
          onClick={() => onReject(suggestion.id)}
          disabled={loading === suggestion.id}
          className="flex-1 flex items-center justify-center gap-2 bg-tiktok-gray hover:bg-tiktok-gray/70 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const { status } = useSession();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (status === "authenticated") {
      fetchSuggestions();
    }
  }, [status, router, filter]);

  async function fetchSuggestions() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/queue?status=${filter}`);
      if (res.ok) {
        setSuggestions(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/admin/queue/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: number) {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/admin/queue/${id}/reject`, {
        method: "POST"
      });
      if (res.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setActionLoading(null);
    }
  }

  if (status === "loading" || loading) {
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
          <h1 className="text-2xl font-bold text-white mb-2">AI Suggestion Queue</h1>
          <p className="text-gray-400">Review and approve trending product opportunities</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 bg-tiktok-gray rounded-lg p-1">
          {(["pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-tiktok-dark text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-400 mb-2">
            No {filter} suggestions
          </h2>
          <p className="text-gray-500">
            {filter === "pending"
              ? "Run trend ingestion to get AI suggestions"
              : `No suggestions have been ${filter} yet`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
