"use client";

import { useState } from "react";
import { Sparkles, Wand2, RefreshCw, Copy, Check, ChevronDown, DollarSign, Megaphone, FileText } from "lucide-react";
import clsx from "clsx";

interface AIContentGeneratorProps {
  productName: string;
  category?: string;
  features?: string[];
  supplierCostCents?: number;
  onDescriptionGenerated?: (description: string) => void;
  onPricingGenerated?: (priceCents: number) => void;
}

interface DescriptionResult {
  success: boolean;
  description: string;
  variations: string[];
  tokens_used: number;
}

interface AdCopyResult {
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
  variations: { headline: string; body: string; cta: string; hashtags: string[] }[];
}

interface PricingResult {
  suggested_price_cents: number;
  min_price_cents: number;
  max_price_cents: number;
  confidence: number;
  reasoning: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Tab = "description" | "adcopy" | "pricing";

export function AIContentGenerator({
  productName,
  category,
  features,
  supplierCostCents,
  onDescriptionGenerated,
  onPricingGenerated,
}: AIContentGeneratorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Description state
  const [tone, setTone] = useState("engaging");
  const [length, setLength] = useState("medium");
  const [descriptionResult, setDescriptionResult] = useState<DescriptionResult | null>(null);
  const [selectedVariation, setSelectedVariation] = useState(0);

  // Ad copy state
  const [platform, setPlatform] = useState("tiktok");
  const [goal, setGoal] = useState("conversions");
  const [adCopyResult, setAdCopyResult] = useState<AdCopyResult | null>(null);

  // Pricing state
  const [targetMargin, setTargetMargin] = useState(0.5);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);

  const generateDescription = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          category,
          features,
          tone,
          length,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate description");
      const data: DescriptionResult = await response.json();
      setDescriptionResult(data);
      setSelectedVariation(0);
      if (onDescriptionGenerated) {
        onDescriptionGenerated(data.description);
      }
    } catch (error) {
      console.error("Error generating description:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAdCopy = async () => {
    setLoading(true);
    try {
      const description = descriptionResult?.description || `A trending ${productName}`;
      const response = await fetch(`${API_URL}/api/ai/generate-ad-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          product_description: description,
          platform,
          goal,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate ad copy");
      const data: AdCopyResult = await response.json();
      setAdCopyResult(data);
    } catch (error) {
      console.error("Error generating ad copy:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePricing = async () => {
    if (!supplierCostCents) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/recommend-pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          supplier_cost_cents: supplierCostCents,
          category,
          target_margin: targetMargin,
        }),
      });

      if (!response.ok) throw new Error("Failed to get pricing recommendation");
      const data: PricingResult = await response.json();
      setPricingResult(data);
      if (onPricingGenerated) {
        onPricingGenerated(data.suggested_price_cents);
      }
    } catch (error) {
      console.error("Error getting pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const tabs = [
    { id: "description" as Tab, label: "Description", icon: FileText },
    { id: "adcopy" as Tab, label: "Ad Copy", icon: Megaphone },
    { id: "pricing" as Tab, label: "Pricing", icon: DollarSign },
  ];

  return (
    <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-tiktok-gray">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tiktok-cyan to-tiktok-red flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">AI Content Generator</h3>
            <p className="text-xs text-gray-400">Generate optimized content with AI</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-tiktok-gray/30 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-tiktok-gray text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description Tab */}
        {activeTab === "description" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white text-sm focus:outline-none focus:border-tiktok-cyan"
                >
                  <option value="engaging">Engaging</option>
                  <option value="professional">Professional</option>
                  <option value="fun">Fun & Playful</option>
                  <option value="luxurious">Luxurious</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full px-3 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white text-sm focus:outline-none focus:border-tiktok-cyan"
                >
                  <option value="short">Short (50-100 words)</option>
                  <option value="medium">Medium (100-200 words)</option>
                  <option value="long">Long (200-400 words)</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateDescription}
              disabled={loading || !productName}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-tiktok-cyan to-tiktok-red text-white rounded-lg font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {loading ? "Generating..." : "Generate Description"}
            </button>

            {descriptionResult && (
              <div className="space-y-3">
                <div className="relative">
                  <div className="p-3 bg-tiktok-gray/30 rounded-lg text-gray-300 text-sm whitespace-pre-wrap">
                    {selectedVariation === 0
                      ? descriptionResult.description
                      : descriptionResult.variations[selectedVariation - 1]}
                  </div>
                  <button
                    onClick={() => copyToClipboard(
                      selectedVariation === 0
                        ? descriptionResult.description
                        : descriptionResult.variations[selectedVariation - 1]
                    )}
                    className="absolute top-2 right-2 p-1.5 bg-tiktok-gray rounded hover:bg-tiktok-gray/80 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {descriptionResult.variations.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedVariation(0)}
                      className={clsx(
                        "px-3 py-1 rounded text-xs font-medium transition-colors",
                        selectedVariation === 0
                          ? "bg-tiktok-cyan text-black"
                          : "bg-tiktok-gray/50 text-gray-400 hover:text-white"
                      )}
                    >
                      Original
                    </button>
                    {descriptionResult.variations.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariation(i + 1)}
                        className={clsx(
                          "px-3 py-1 rounded text-xs font-medium transition-colors",
                          selectedVariation === i + 1
                            ? "bg-tiktok-cyan text-black"
                            : "bg-tiktok-gray/50 text-gray-400 hover:text-white"
                        )}
                      >
                        Variation {i + 1}
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Tokens used: {descriptionResult.tokens_used}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ad Copy Tab */}
        {activeTab === "adcopy" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white text-sm focus:outline-none focus:border-tiktok-cyan"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white text-sm focus:outline-none focus:border-tiktok-cyan"
                >
                  <option value="awareness">Brand Awareness</option>
                  <option value="engagement">Engagement</option>
                  <option value="conversions">Conversions</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateAdCopy}
              disabled={loading || !productName}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-tiktok-cyan to-tiktok-red text-white rounded-lg font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Megaphone className="w-4 h-4" />
              )}
              {loading ? "Generating..." : "Generate Ad Copy"}
            </button>

            {adCopyResult && (
              <div className="space-y-3">
                <div className="p-3 bg-tiktok-gray/30 rounded-lg space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Headline</span>
                    <p className="text-white font-medium">{adCopyResult.headline}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Body</span>
                    <p className="text-gray-300 text-sm">{adCopyResult.body}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">CTA</span>
                    <p className="text-tiktok-cyan font-medium">{adCopyResult.cta}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Hashtags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {adCopyResult.hashtags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-tiktok-gray rounded text-xs text-tiktok-cyan">
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(
                    `${adCopyResult.headline}\n\n${adCopyResult.body}\n\n${adCopyResult.cta}\n\n${adCopyResult.hashtags.join(" ")}`
                  )}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  Copy all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="space-y-4">
            {!supplierCostCents ? (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
                Please provide a supplier cost to get pricing recommendations.
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Target Margin: {(targetMargin * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="0.8"
                    step="0.05"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(parseFloat(e.target.value))}
                    className="w-full accent-tiktok-cyan"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>20%</span>
                    <span>50%</span>
                    <span>80%</span>
                  </div>
                </div>

                <div className="p-3 bg-tiktok-gray/30 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Supplier Cost</div>
                  <div className="text-lg font-medium text-white">
                    {formatCurrency(supplierCostCents)}
                  </div>
                </div>

                <button
                  onClick={generatePricing}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-tiktok-cyan to-tiktok-red text-white rounded-lg font-medium disabled:opacity-50 transition-opacity"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                  {loading ? "Analyzing..." : "Get Pricing Recommendation"}
                </button>

                {pricingResult && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-tiktok-gray/30 rounded-lg text-center">
                        <div className="text-xs text-gray-400">Min</div>
                        <div className="text-lg font-medium text-gray-300">
                          {formatCurrency(pricingResult.min_price_cents)}
                        </div>
                      </div>
                      <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
                        <div className="text-xs text-green-400">Suggested</div>
                        <div className="text-xl font-bold text-green-400">
                          {formatCurrency(pricingResult.suggested_price_cents)}
                        </div>
                      </div>
                      <div className="p-3 bg-tiktok-gray/30 rounded-lg text-center">
                        <div className="text-xs text-gray-400">Max</div>
                        <div className="text-lg font-medium text-gray-300">
                          {formatCurrency(pricingResult.max_price_cents)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-tiktok-gray rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-tiktok-cyan to-green-400"
                          style={{ width: `${pricingResult.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {(pricingResult.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>

                    <div className="p-3 bg-tiktok-gray/30 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">AI Reasoning</div>
                      <p className="text-sm text-gray-300">{pricingResult.reasoning}</p>
                    </div>

                    {pricingResult.suggested_price_cents && supplierCostCents && (
                      <div className="p-3 bg-tiktok-gray/30 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-gray-400">Projected Margin</span>
                        <span className="text-lg font-bold text-green-400">
                          {(((pricingResult.suggested_price_cents - supplierCostCents) / pricingResult.suggested_price_cents) * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
