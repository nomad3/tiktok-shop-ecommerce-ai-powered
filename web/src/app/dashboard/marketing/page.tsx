"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Megaphone, FileText, Instagram, Zap, Calendar, Hash } from "lucide-react";

export default function MarketingPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  const features = [
    {
      icon: FileText,
      title: "AI Copywriter",
      description: "Generate compelling product descriptions, SEO meta tags, and bullet points",
      color: "text-tiktok-cyan",
    },
    {
      icon: Megaphone,
      title: "Ad Generator",
      description: "Create Facebook, Instagram, TikTok, and Google ad copy with A/B variations",
      color: "text-tiktok-red",
    },
    {
      icon: Instagram,
      title: "Social Posts",
      description: "Generate engaging posts for all social platforms with hashtag suggestions",
      color: "text-purple-400",
    },
    {
      icon: Calendar,
      title: "Content Calendar",
      description: "Plan and schedule your marketing content across channels",
      color: "text-green-400",
    },
    {
      icon: Zap,
      title: "TikTok Scripts",
      description: "Get viral video scripts with hooks, body, and CTAs",
      color: "text-yellow-400",
    },
    {
      icon: Hash,
      title: "Hashtag Research",
      description: "Find trending hashtags for maximum reach",
      color: "text-pink-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Marketing</h1>
        <p className="text-gray-400">
          AI-powered content generation and marketing tools.
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-tiktok-gray p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          AI Marketing Suite
        </h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          Generate professional marketing content in seconds with Claude AI.
          From product descriptions to viral TikTok scripts.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Coming in Phase 2
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6 opacity-60"
          >
            <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
            <h3 className="text-lg font-medium text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
