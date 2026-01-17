"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Search, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DiscoverPage() {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Discover</h1>
        <p className="text-gray-400">
          Find trending products and import them to your store with AI-powered insights.
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-br from-tiktok-cyan/20 to-tiktok-red/20 rounded-xl border border-tiktok-gray p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-tiktok-cyan to-tiktok-red rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          AI Product Discovery
        </h2>
        <p className="text-gray-400 max-w-lg mx-auto mb-6">
          Automatically find viral products on TikTok, analyze their potential,
          and import them to your store with one click.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
          <div className="bg-tiktok-dark/50 rounded-lg p-4">
            <Search className="w-6 h-6 text-tiktok-cyan mb-2" />
            <h3 className="font-medium text-white">Trend Detection</h3>
            <p className="text-sm text-gray-400">Scan TikTok for viral products</p>
          </div>
          <div className="bg-tiktok-dark/50 rounded-lg p-4">
            <TrendingUp className="w-6 h-6 text-tiktok-red mb-2" />
            <h3 className="font-medium text-white">AI Scoring</h3>
            <p className="text-sm text-gray-400">Get profit potential scores</p>
          </div>
          <div className="bg-tiktok-dark/50 rounded-lg p-4">
            <ArrowRight className="w-6 h-6 text-green-400 mb-2" />
            <h3 className="font-medium text-white">One-Click Import</h3>
            <p className="text-sm text-gray-400">Add products instantly</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Coming in Phase 2 • Check the AI Queue in the meantime
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/queue"
          className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6 hover:border-tiktok-cyan transition-colors group"
        >
          <h3 className="text-lg font-medium text-white mb-2 group-hover:text-tiktok-cyan">
            AI Suggestion Queue
          </h3>
          <p className="text-gray-400 text-sm">
            Review AI-generated product suggestions from trend analysis
          </p>
        </Link>

        <Link
          href="/dashboard/products?action=new"
          className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6 hover:border-tiktok-red transition-colors group"
        >
          <h3 className="text-lg font-medium text-white mb-2 group-hover:text-tiktok-red">
            Add Product Manually
          </h3>
          <p className="text-gray-400 text-sm">
            Create a new product with supplier details
          </p>
        </Link>
      </div>
    </div>
  );
}
