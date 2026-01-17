"use client";

import { useState } from "react";
import {
  X,
  Link,
  RefreshCw,
  Sparkles,
  Check,
  AlertTriangle,
  Package,
  DollarSign,
  Image,
  FileText,
} from "lucide-react";
import clsx from "clsx";

interface ImportProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (product: ParsedProduct) => void;
}

interface ParsedProduct {
  title: string;
  description: string;
  images: string[];
  price_cents: number;
  supplier_cost_cents: number;
  supplier_url: string;
  supplier_name: string;
  category?: string;
}

interface ParseResult {
  success: boolean;
  data?: ParsedProduct;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ImportProductModal({
  isOpen,
  onClose,
  onImport,
}: ImportProductModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct | null>(null);
  const [editedData, setEditedData] = useState<ParsedProduct | null>(null);
  const [step, setStep] = useState<"input" | "preview" | "customize">("input");

  const detectSource = (url: string): string => {
    if (url.includes("aliexpress.com")) return "aliexpress";
    if (url.includes("cjdropshipping.com")) return "cjdropshipping";
    if (url.includes("alibaba.com")) return "alibaba";
    if (url.includes("amazon.com")) return "amazon";
    return "unknown";
  };

  const parseUrl = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/import/parse-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const result: ParseResult = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to parse URL");
      }

      if (result.data) {
        setParsedData(result.data);
        setEditedData({ ...result.data });
        setStep("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse product URL");
    } finally {
      setLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!editedData) return;

    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: editedData.title,
          tone: "engaging",
          length: "medium",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate description");
      const data = await response.json();

      setEditedData({
        ...editedData,
        description: data.description,
      });
    } catch (err) {
      console.error("Error generating description:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleImport = () => {
    if (editedData) {
      onImport(editedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setUrl("");
    setParsedData(null);
    setEditedData(null);
    setError(null);
    setStep("input");
    onClose();
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const calculateMargin = () => {
    if (!editedData) return 0;
    if (editedData.supplier_cost_cents === 0) return 0;
    return ((editedData.price_cents - editedData.supplier_cost_cents) / editedData.price_cents) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-tiktok-gray">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-tiktok-cyan to-tiktok-red flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import Product</h2>
              <p className="text-sm text-gray-400">
                {step === "input" && "Paste a product URL to import"}
                {step === "preview" && "Review imported data"}
                {step === "customize" && "Customize before adding to store"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step 1: URL Input */}
          {step === "input" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Product URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://aliexpress.com/item/..."
                    className="w-full px-4 py-3 pl-10 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                  />
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
                {url && (
                  <p className="text-xs text-gray-500 mt-2">
                    Detected source:{" "}
                    <span className="text-tiktok-cyan capitalize">{detectSource(url)}</span>
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Supported platforms */}
              <div className="bg-tiktok-gray/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-3">Supported platforms:</p>
                <div className="grid grid-cols-2 gap-2">
                  {["AliExpress", "CJ Dropshipping", "Alibaba", "Amazon"].map((platform) => (
                    <div
                      key={platform}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <Check className="w-4 h-4 text-green-400" />
                      {platform}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 & 3: Preview/Customize */}
          {(step === "preview" || step === "customize") && editedData && (
            <div className="space-y-4">
              {/* Images */}
              {editedData.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Product Images
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {editedData.images.slice(0, 5).map((img, i) => (
                      <div
                        key={i}
                        className="w-20 h-20 rounded-lg bg-tiktok-gray/50 flex-shrink-0 overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`Product ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "";
                            e.currentTarget.parentElement!.innerHTML =
                              '<div class="w-full h-full flex items-center justify-center text-gray-500"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                          }}
                        />
                      </div>
                    ))}
                    {editedData.images.length > 5 && (
                      <div className="w-20 h-20 rounded-lg bg-tiktok-gray/50 flex-shrink-0 flex items-center justify-center text-gray-400 text-sm">
                        +{editedData.images.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editedData.title}
                  onChange={(e) =>
                    setEditedData({ ...editedData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-400">
                    Description
                  </label>
                  <button
                    onClick={generateDescription}
                    disabled={generating}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-gradient-to-r from-tiktok-cyan to-tiktok-red text-white rounded-full hover:opacity-90 disabled:opacity-50"
                  >
                    {generating ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {generating ? "Generating..." : "Generate with AI"}
                  </button>
                </div>
                <textarea
                  value={editedData.description}
                  onChange={(e) =>
                    setEditedData({ ...editedData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan resize-none"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Supplier Cost
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      value={(editedData.supplier_cost_cents / 100).toFixed(2)}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          supplier_cost_cents: Math.round(parseFloat(e.target.value) * 100) || 0,
                        })
                      }
                      className="w-full px-4 py-2 pl-8 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Selling Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      value={(editedData.price_cents / 100).toFixed(2)}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          price_cents: Math.round(parseFloat(e.target.value) * 100) || 0,
                        })
                      }
                      className="w-full px-4 py-2 pl-8 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                    />
                  </div>
                </div>
              </div>

              {/* Margin indicator */}
              <div
                className={clsx(
                  "p-3 rounded-lg flex items-center justify-between",
                  calculateMargin() >= 50
                    ? "bg-green-500/10 border border-green-500/30"
                    : calculateMargin() >= 30
                    ? "bg-yellow-500/10 border border-yellow-500/30"
                    : "bg-red-500/10 border border-red-500/30"
                )}
              >
                <span className="text-sm text-gray-400">Profit Margin</span>
                <span
                  className={clsx(
                    "text-xl font-bold",
                    calculateMargin() >= 50
                      ? "text-green-400"
                      : calculateMargin() >= 30
                      ? "text-yellow-400"
                      : "text-red-400"
                  )}
                >
                  {calculateMargin().toFixed(0)}%
                </span>
              </div>

              {/* Supplier info */}
              <div className="bg-tiktok-gray/30 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Importing from</p>
                <p className="text-sm text-white font-medium">{editedData.supplier_name}</p>
                <a
                  href={editedData.supplier_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-tiktok-cyan hover:underline truncate block"
                >
                  {editedData.supplier_url}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-tiktok-gray">
          {step === "input" && (
            <>
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-tiktok-gray text-white font-medium rounded-lg hover:bg-tiktok-gray/80"
              >
                Cancel
              </button>
              <button
                onClick={parseUrl}
                disabled={!url.trim() || loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-tiktok-cyan text-black font-medium rounded-lg hover:bg-tiktok-cyan/90 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                {loading ? "Parsing..." : "Parse URL"}
              </button>
            </>
          )}

          {(step === "preview" || step === "customize") && (
            <>
              <button
                onClick={() => {
                  setStep("input");
                  setParsedData(null);
                  setEditedData(null);
                }}
                className="flex-1 py-3 bg-tiktok-gray text-white font-medium rounded-lg hover:bg-tiktok-gray/80"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={!editedData?.title}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-tiktok-red text-white font-medium rounded-lg hover:bg-tiktok-red/90 disabled:opacity-50"
              >
                <Package className="w-4 h-4" />
                Add to Store
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
