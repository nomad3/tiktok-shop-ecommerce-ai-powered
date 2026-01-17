"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Megaphone,
  FileText,
  Instagram,
  Zap,
  Hash,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AdCopyResult {
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
  variations: { headline: string; body: string; cta: string; hashtags: string[] }[];
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price_cents: number;
}

export default function MarketingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [platform, setPlatform] = useState("tiktok");
  const [goal, setGoal] = useState("conversions");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdCopyResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeVariation, setActiveVariation] = useState(0);

  // Custom input mode
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
    }
    if (status === "authenticated") {
      fetchProducts();
    }
  }, [status, router]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const generateAdCopy = async () => {
    const productName = useCustomInput ? customName : selectedProduct?.name;
    const productDesc = useCustomInput
      ? customDescription
      : selectedProduct?.description || `A trending ${selectedProduct?.name}`;

    if (!productName) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/ai/generate-ad-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          product_description: productDesc,
          platform,
          goal,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate ad copy");
      const data: AdCopyResult = await response.json();
      setResult(data);
      setActiveVariation(0);
    } catch (error) {
      console.error("Error generating ad copy:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const getCurrentCopy = () => {
    if (!result) return null;
    if (activeVariation === 0) {
      return {
        headline: result.headline,
        body: result.body,
        cta: result.cta,
        hashtags: result.hashtags,
      };
    }
    return result.variations[activeVariation - 1];
  };

  const currentCopy = getCurrentCopy();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  const platformOptions = [
    { value: "tiktok", label: "TikTok", icon: "🎵" },
    { value: "instagram", label: "Instagram", icon: "📸" },
    { value: "facebook", label: "Facebook", icon: "📘" },
  ];

  const goalOptions = [
    { value: "awareness", label: "Brand Awareness" },
    { value: "engagement", label: "Engagement" },
    { value: "conversions", label: "Conversions" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Marketing</h1>
        <p className="text-gray-400">
          AI-powered content generation for your marketing campaigns.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/marketing/social"
          className="group bg-gradient-to-br from-tiktok-red/20 to-tiktok-cyan/20 rounded-xl border border-tiktok-red/30 p-5 hover:border-tiktok-cyan/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-tiktok-red to-tiktok-cyan rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Social Content Generator</h3>
                <p className="text-gray-400 text-sm">Generate content for all platforms at once</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-tiktok-cyan group-hover:translate-x-1 transition-all" />
          </div>
          <div className="flex gap-2 mt-4">
            <span className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded text-xs">Instagram</span>
            <span className="px-2 py-1 bg-black text-tiktok-cyan rounded text-xs border border-tiktok-gray">TikTok</span>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">Facebook</span>
            <span className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded text-xs">Twitter</span>
            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">Pinterest</span>
          </div>
        </Link>

        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-tiktok-gray rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Content Calendar</h3>
                <p className="text-gray-400 text-sm">Schedule and manage your posts</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-tiktok-gray text-gray-400 rounded text-xs">Coming Soon</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Ad Copy Generator</h2>
              <p className="text-sm text-gray-400">Create compelling ads for any platform</p>
            </div>
          </div>

          {/* Source Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUseCustomInput(false)}
              className={clsx(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                !useCustomInput
                  ? "bg-tiktok-cyan/20 text-tiktok-cyan"
                  : "bg-tiktok-gray/50 text-gray-400 hover:text-white"
              )}
            >
              Select Product
            </button>
            <button
              onClick={() => setUseCustomInput(true)}
              className={clsx(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                useCustomInput
                  ? "bg-tiktok-cyan/20 text-tiktok-cyan"
                  : "bg-tiktok-gray/50 text-gray-400 hover:text-white"
              )}
            >
              Custom Input
            </button>
          </div>

          {/* Product Selection / Custom Input */}
          {!useCustomInput ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Product
              </label>
              <select
                value={selectedProduct?.id || ""}
                onChange={(e) => {
                  const product = products.find((p) => p.id === parseInt(e.target.value));
                  setSelectedProduct(product || null);
                }}
                className="w-full px-4 py-3 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter product name..."
                  className="w-full px-4 py-3 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Product Description
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe your product..."
                  rows={3}
                  className="w-full px-4 py-3 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan resize-none"
                />
              </div>
            </div>
          )}

          {/* Platform Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Platform
            </label>
            <div className="grid grid-cols-3 gap-2">
              {platformOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPlatform(opt.value)}
                  className={clsx(
                    "py-3 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    platform === opt.value
                      ? "bg-tiktok-cyan/20 text-tiktok-cyan border border-tiktok-cyan/30"
                      : "bg-tiktok-gray/50 text-gray-400 hover:text-white border border-transparent"
                  )}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Campaign Goal
            </label>
            <div className="grid grid-cols-3 gap-2">
              {goalOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGoal(opt.value)}
                  className={clsx(
                    "py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                    goal === opt.value
                      ? "bg-tiktok-red/20 text-tiktok-red border border-tiktok-red/30"
                      : "bg-tiktok-gray/50 text-gray-400 hover:text-white border border-transparent"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateAdCopy}
            disabled={loading || (!selectedProduct && !customName)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {loading ? "Generating..." : "Generate Ad Copy"}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Generated Copy</h2>
            {result && result.variations.length > 0 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveVariation(0)}
                  className={clsx(
                    "px-3 py-1 rounded text-xs font-medium transition-colors",
                    activeVariation === 0
                      ? "bg-tiktok-cyan text-black"
                      : "bg-tiktok-gray/50 text-gray-400 hover:text-white"
                  )}
                >
                  Original
                </button>
                {result.variations.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVariation(i + 1)}
                    className={clsx(
                      "px-3 py-1 rounded text-xs font-medium transition-colors",
                      activeVariation === i + 1
                        ? "bg-tiktok-cyan text-black"
                        : "bg-tiktok-gray/50 text-gray-400 hover:text-white"
                    )}
                  >
                    V{i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!result ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-tiktok-gray/30 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 mb-2">No content generated yet</p>
              <p className="text-sm text-gray-500">
                Select a product and click generate to create ad copy
              </p>
            </div>
          ) : currentCopy ? (
            <div className="space-y-4">
              {/* Headline */}
              <div className="p-4 bg-tiktok-gray/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 uppercase">
                    Headline
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentCopy.headline, "headline")}
                    className="p-1 hover:bg-tiktok-gray/50 rounded"
                  >
                    {copied === "headline" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-white font-semibold text-lg">{currentCopy.headline}</p>
              </div>

              {/* Body */}
              <div className="p-4 bg-tiktok-gray/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 uppercase">
                    Body Copy
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentCopy.body, "body")}
                    className="p-1 hover:bg-tiktok-gray/50 rounded"
                  >
                    {copied === "body" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-gray-300">{currentCopy.body}</p>
              </div>

              {/* CTA */}
              <div className="p-4 bg-tiktok-gray/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 uppercase">
                    Call to Action
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentCopy.cta, "cta")}
                    className="p-1 hover:bg-tiktok-gray/50 rounded"
                  >
                    {copied === "cta" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-tiktok-cyan font-semibold">{currentCopy.cta}</p>
              </div>

              {/* Hashtags */}
              <div className="p-4 bg-tiktok-gray/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 uppercase">
                    Hashtags
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        currentCopy.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "),
                        "hashtags"
                      )
                    }
                    className="p-1 hover:bg-tiktok-gray/50 rounded"
                  >
                    {copied === "hashtags" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentCopy.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-tiktok-gray/50 rounded text-sm text-tiktok-cyan"
                    >
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Copy All */}
              <button
                onClick={() =>
                  copyToClipboard(
                    `${currentCopy.headline}\n\n${currentCopy.body}\n\n${currentCopy.cta}\n\n${currentCopy.hashtags
                      .map((h) => (h.startsWith("#") ? h : `#${h}`))
                      .join(" ")}`,
                    "all"
                  )
                }
                className="w-full flex items-center justify-center gap-2 py-3 bg-tiktok-gray/50 text-white rounded-lg font-medium hover:bg-tiktok-gray transition-colors"
              >
                {copied === "all" ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                Copy All
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5 hover:border-tiktok-cyan/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h3 className="font-medium text-white">Quick Scripts</h3>
          </div>
          <p className="text-sm text-gray-400">
            Generate TikTok video scripts with viral hooks and CTAs.
          </p>
        </div>
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5 hover:border-tiktok-red/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <Instagram className="w-6 h-6 text-pink-400" />
            <h3 className="font-medium text-white">Story Ideas</h3>
          </div>
          <p className="text-sm text-gray-400">
            Create engaging Instagram story sequences for products.
          </p>
        </div>
        <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5 hover:border-purple-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <Hash className="w-6 h-6 text-purple-400" />
            <h3 className="font-medium text-white">Trending Tags</h3>
          </div>
          <p className="text-sm text-gray-400">
            Discover trending hashtags for your niche and products.
          </p>
        </div>
      </div>
    </div>
  );
}
