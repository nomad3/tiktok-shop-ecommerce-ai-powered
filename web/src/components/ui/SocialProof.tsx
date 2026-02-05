"use client";

import { useState, useEffect } from "react";
import { Eye, ShoppingCart, Star, Users, MapPin, Clock } from "lucide-react";
import Image from "next/image";

interface SocialProofProps {
  productId: number;
  productName: string;
  viewCount?: number;
  purchaseCount?: number;
  rating?: number;
  reviewCount?: number;
}

interface RecentActivity {
  id: string;
  type: "view" | "purchase" | "review";
  customerName: string;
  customerLocation: string;
  timeAgo: string;
  message?: string;
  rating?: number;
}

export function SocialProof({ 
  productId, 
  productName, 
  viewCount = 0, 
  purchaseCount = 0,
  rating = 4.8,
  reviewCount = 0 
}: SocialProofProps) {
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [currentViewers, setCurrentViewers] = useState(0);
  const [showActivity, setShowActivity] = useState(false);

  // Generate mock real-time activity
  useEffect(() => {
    const activities: RecentActivity[] = [
      {
        id: "1",
        type: "purchase",
        customerName: "Sarah M.",
        customerLocation: "New York, NY",
        timeAgo: "2 minutes ago",
        message: "Just ordered this! Can't wait!"
      },
      {
        id: "2", 
        type: "review",
        customerName: "Mike C.",
        customerLocation: "Los Angeles, CA",
        timeAgo: "5 minutes ago",
        message: "Amazing quality, exactly as described",
        rating: 5
      },
      {
        id: "3",
        type: "purchase",
        customerName: "Emma L.",
        customerLocation: "Chicago, IL", 
        timeAgo: "8 minutes ago",
        message: "Third time buying this!"
      },
      {
        id: "4",
        type: "view",
        customerName: "Alex K.",
        customerLocation: "Miami, FL",
        timeAgo: "12 minutes ago"
      },
      {
        id: "5",
        type: "purchase",
        customerName: "Jess R.",
        customerLocation: "Seattle, WA",
        timeAgo: "15 minutes ago",
        message: "Finally got one!"
      }
    ];

    setRecentActivity(activities);

    // Simulate current viewers (15-45 people)
    setCurrentViewers(Math.floor(Math.random() * 30) + 15);

    // Update viewers count every 10-30 seconds
    const viewerInterval = setInterval(() => {
      setCurrentViewers(prev => {
        const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
        return Math.max(5, Math.min(50, prev + change));
      });
    }, Math.random() * 20000 + 10000);

    // Show activity popup every 8-15 seconds
    const activityInterval = setInterval(() => {
      setShowActivity(true);
      setTimeout(() => setShowActivity(false), 4000);
    }, Math.random() * 7000 + 8000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(activityInterval);
    };
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="w-3 h-3 text-green-400" />;
      case "review":
        return <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />;
      case "view":
        return <Eye className="w-3 h-3 text-blue-400" />;
      default:
        return <Eye className="w-3 h-3 text-gray-400" />;
    }
  };

  const getActivityColor = (type: RecentActivity["type"]) => {
    switch (type) {
      case "purchase":
        return "border-green-500/20 bg-green-500/10";
      case "review":
        return "border-yellow-500/20 bg-yellow-500/10";
      case "view":
        return "border-blue-500/20 bg-blue-500/10";
      default:
        return "border-gray-500/20 bg-gray-500/10";
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Live Viewers */}
        <div className="bg-tiktok-dark/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Live viewers</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-white font-bold">{currentViewers}</span>
            <span className="text-xs text-green-400">online now</span>
          </div>
        </div>

        {/* Purchase Count */}
        <div className="bg-tiktok-dark/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-3 h-3 text-tiktok-cyan" />
            <span className="text-xs text-gray-400">Sold today</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{formatNumber(purchaseCount || 127)}</span>
            <span className="text-xs text-tiktok-cyan">+12 this hour</span>
          </div>
        </div>
      </div>

      {/* Reviews Summary */}
      <div className="bg-tiktok-dark/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400' : 'fill-gray-600'}`}
                />
              ))}
            </div>
            <span className="text-white font-bold">{rating}</span>
            <span className="text-gray-400 text-sm">({formatNumber(reviewCount || 234)} reviews)</span>
          </div>
          <div className="text-xs text-gray-400">98% recommend</div>
        </div>
      </div>

      {/* Recent Activity Popup */}
      {showActivity && recentActivity.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 lg:left-auto lg:right-8 lg:bottom-8 lg:w-80 z-50 animate-slideInUp">
          <div className={`${getActivityColor(recentActivity[0].type)} border rounded-lg p-3 backdrop-blur-sm`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(recentActivity[0].type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium text-sm">{recentActivity[0].customerName}</span>
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{recentActivity[0].customerLocation}</span>
                </div>
                {recentActivity[0].message && (
                  <p className="text-gray-300 text-sm mb-1">"{recentActivity[0].message}"</p>
                )}
                {recentActivity[0].rating && (
                  <div className="flex text-yellow-400 mb-1">
                    {[...Array(recentActivity[0].rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400" />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {recentActivity[0].timeAgo}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-tiktok-cyan font-bold text-sm">30K+</div>
          <div className="text-xs text-gray-400">Happy customers</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-green-400 font-bold text-sm">4.8★</div>
          <div className="text-xs text-gray-400">Average rating</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center">
          <div className="text-purple-400 font-bold text-sm">24h</div>
          <div className="text-xs text-gray-400">Fast shipping</div>
        </div>
      </div>
    </div>
  );
}