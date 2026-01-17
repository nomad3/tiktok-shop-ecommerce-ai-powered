"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  Copy,
  Check,
  Loader2,
  Hash,
  Clock,
  ArrowLeft,
  Music,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Product {
  id: number;
  name: string;
  description: string;
  main_image_url: string | null;
}

type Platform = "instagram" | "tiktok" | "facebook" | "twitter" | "pinterest";

interface GeneratedContent {
  instagram?: {
    caption: string;
    hashtags: string[];
    suggested_image_style: string;
    best_posting_time: string;
  };
  tiktok?: {
    caption: string;
    hashtags: string[];
    trending_sounds: string[];
    video_ideas: string[];
  };
  facebook?: {
    text: string;
    call_to_action: string;
    suggested_link_preview: string;
  };
  twitter?: {
    tweets: string[];
    hashtags: string[];
  };
  pinterest?: {
    title: string;
    description: string;
    board_suggestions: string[];
    keywords: string[];
  };
}

const platformConfig: Record<Platform, { icon: typeof Instagram; color: string; bgColor: string }> = {
  instagram: { icon: Instagram, color: "text-pink-500", bgColor: "bg-gradient-to-br from-purple-600 to-pink-500" },
  tiktok: { icon: Music, color: "text-tiktok-cyan", bgColor: "bg-black" },
  facebook: { icon: Facebook, color: "text-blue-500", bgColor: "bg-blue-600" },
  twitter: { icon: Twitter, color: "text-sky-400", bgColor: "bg-sky-500" },
  pinterest: { icon: Lightbulb, color: "text-red-500", bgColor: "bg-red-600" },
};

const styleOptions = [
  { value: "lifestyle", label: "Lifestyle" },
  { value: "promotional", label: "Promotional" },
  { value: "educational", label: "Educational" },
  { value: "ugc", label: "UGC Style" },
];

export default function SocialGeneratorPage() {
  const { status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["instagram", "tiktok"]);
  const [style, setStyle] = useState("lifestyle");
  const [hook, setHook] = useState("Wait till you see this...");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
      const response = await fetch(`${API_URL}/products?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        if (data.length > 0) {
          setSelectedProduct(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const generateContent = async () => {
    if (!selectedProduct || selectedPlatforms.length === 0) return;

    setLoading(true);
    setContent(null);

    try {
      const newContent: GeneratedContent = {};

      // Generate content for each selected platform
      for (const platform of selectedPlatforms) {
        let endpoint = "";
        let body: Record<string, unknown> = { product_id: selectedProduct.id };

        switch (platform) {
          case "instagram":
            endpoint = "/api/social/generate/instagram";
            body.style = style;
            body.hashtag_count = 20;
            break;
          case "tiktok":
            endpoint = "/api/social/generate/tiktok";
            body.hook = hook;
            break;
          case "facebook":
            endpoint = "/api/social/generate/facebook";
            body.post_type = "product";
            break;
          case "twitter":
            endpoint = "/api/social/generate/twitter";
            body.tweet_count = 5;
            break;
          case "pinterest":
            endpoint = "/api/social/generate/pinterest";
            body.category = "lifestyle";
            break;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          newContent[platform] = await response.json();
        }
      }

      setContent(newContent);
    } catch (error) {
      console.error("Failed to generate content:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/marketing"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketing
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-tiktok-red to-tiktok-cyan rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Social Content Generator</h1>
            <p className="text-gray-400">Generate AI-powered content for all your social platforms</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Product Selection */}
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5">
            <h3 className="text-white font-medium mb-4">Select Product</h3>
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

            {selectedProduct && (
              <div className="mt-4 p-3 bg-tiktok-gray/30 rounded-lg">
                <p className="text-white font-medium text-sm">{selectedProduct.name}</p>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                  {selectedProduct.description}
                </p>
              </div>
            )}
          </div>

          {/* Platform Selection */}
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5">
            <h3 className="text-white font-medium mb-4">Platforms</h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(platformConfig) as Platform[]).map((platform) => {
                const config = platformConfig[platform];
                const Icon = config.icon;
                const isSelected = selectedPlatforms.includes(platform);

                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={clsx(
                      "p-3 rounded-lg border transition-all flex flex-col items-center gap-1",
                      isSelected
                        ? "border-tiktok-cyan bg-tiktok-cyan/10"
                        : "border-tiktok-gray hover:border-gray-600"
                    )}
                  >
                    <Icon className={clsx("w-5 h-5", isSelected ? config.color : "text-gray-400")} />
                    <span className={clsx("text-xs capitalize", isSelected ? "text-white" : "text-gray-400")}>
                      {platform}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Style Selection */}
          <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5">
            <h3 className="text-white font-medium mb-4">Content Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {styleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStyle(option.value)}
                  className={clsx(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    style === option.value
                      ? "bg-tiktok-cyan text-black"
                      : "bg-tiktok-gray/50 text-gray-300 hover:bg-tiktok-gray"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* TikTok Hook */}
          {selectedPlatforms.includes("tiktok") && (
            <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5">
              <h3 className="text-white font-medium mb-4">TikTok Video Hook</h3>
              <input
                type="text"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="Wait till you see this..."
                className="w-full px-4 py-3 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
              />
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateContent}
            disabled={loading || !selectedProduct || selectedPlatforms.length === 0}
            className="w-full py-4 bg-gradient-to-r from-tiktok-red to-tiktok-cyan text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Content
              </>
            )}
          </button>
        </div>

        {/* Generated Content */}
        <div className="lg:col-span-2 space-y-4">
          {!content && !loading && (
            <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-12 text-center">
              <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                Select a product and platforms, then click Generate to create social content
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-12 text-center">
              <Loader2 className="w-12 h-12 text-tiktok-cyan animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Generating content for {selectedPlatforms.length} platforms...</p>
            </div>
          )}

          {content && (
            <>
              {/* Instagram */}
              {content.instagram && (
                <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", platformConfig.instagram.bgColor)}>
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-medium">Instagram</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Caption</span>
                        <button
                          onClick={() => copyToClipboard(content.instagram!.caption, "ig-caption")}
                          className="text-tiktok-cyan hover:text-tiktok-cyan/80"
                        >
                          {copiedField === "ig-caption" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-white text-sm bg-tiktok-gray/30 rounded-lg p-3">
                        {content.instagram.caption}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">Hashtags</span>
                        <button
                          onClick={() => copyToClipboard(content.instagram!.hashtags.map(h => `#${h}`).join(" "), "ig-hashtags")}
                          className="text-tiktok-cyan hover:text-tiktok-cyan/80 ml-auto"
                        >
                          {copiedField === "ig-hashtags" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {content.instagram.hashtags.slice(0, 10).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                        {content.instagram.hashtags.length > 10 && (
                          <span className="px-2 py-1 text-gray-400 text-xs">
                            +{content.instagram.hashtags.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Best time: {content.instagram.best_posting_time}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TikTok */}
              {content.tiktok && (
                <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center border border-tiktok-gray", platformConfig.tiktok.bgColor)}>
                      <Music className="w-5 h-5 text-tiktok-cyan" />
                    </div>
                    <h3 className="text-white font-medium">TikTok</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Caption</span>
                        <button
                          onClick={() => copyToClipboard(content.tiktok!.caption, "tt-caption")}
                          className="text-tiktok-cyan hover:text-tiktok-cyan/80"
                        >
                          {copiedField === "tt-caption" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-white text-sm bg-tiktok-gray/30 rounded-lg p-3">
                        {content.tiktok.caption}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm block mb-2">Video Ideas</span>
                      <ul className="space-y-1">
                        {content.tiktok.video_ideas.map((idea, i) => (
                          <li key={i} className="text-white text-sm flex items-start gap-2">
                            <span className="text-tiktok-cyan">•</span>
                            {idea}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm block mb-2">Trending Sounds</span>
                      <div className="flex flex-wrap gap-2">
                        {content.tiktok.trending_sounds.map((sound) => (
                          <span key={sound} className="px-2 py-1 bg-tiktok-cyan/20 text-tiktok-cyan rounded text-xs flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            {sound}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Facebook */}
              {content.facebook && (
                <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", platformConfig.facebook.bgColor)}>
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-medium">Facebook</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Post Text</span>
                        <button
                          onClick={() => copyToClipboard(content.facebook!.text, "fb-text")}
                          className="text-tiktok-cyan hover:text-tiktok-cyan/80"
                        >
                          {copiedField === "fb-text" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-white text-sm bg-tiktok-gray/30 rounded-lg p-3">
                        {content.facebook.text}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <span className="text-gray-400 text-xs block mb-1">Call to Action</span>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                          {content.facebook.call_to_action}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Twitter */}
              {content.twitter && (
                <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", platformConfig.twitter.bgColor)}>
                      <Twitter className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-medium">Twitter Thread</h3>
                  </div>

                  <div className="space-y-3">
                    {content.twitter.tweets.map((tweet, i) => (
                      <div key={i} className="relative">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                            {i + 1}
                          </div>
                          <p className="text-white text-sm flex-1">{tweet}</p>
                          <button
                            onClick={() => copyToClipboard(tweet, `tw-${i}`)}
                            className="text-tiktok-cyan hover:text-tiktok-cyan/80 flex-shrink-0"
                          >
                            {copiedField === `tw-${i}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        {i < content.twitter!.tweets.length - 1 && (
                          <div className="absolute left-3 top-6 bottom-0 w-px bg-sky-500/30" style={{ height: "calc(100% + 12px)" }} />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => copyToClipboard(content.twitter!.tweets.join("\n\n"), "tw-all")}
                    className="mt-4 w-full py-2 bg-sky-500/20 text-sky-400 rounded-lg text-sm font-medium hover:bg-sky-500/30"
                  >
                    {copiedField === "tw-all" ? "Copied!" : "Copy Entire Thread"}
                  </button>
                </div>
              )}

              {/* Pinterest */}
              {content.pinterest && (
                <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", platformConfig.pinterest.bgColor)}>
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-white font-medium">Pinterest</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Pin Title</span>
                      <p className="text-white font-medium">{content.pinterest.title}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Description</span>
                        <button
                          onClick={() => copyToClipboard(content.pinterest!.description, "pin-desc")}
                          className="text-tiktok-cyan hover:text-tiktok-cyan/80"
                        >
                          {copiedField === "pin-desc" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-white text-sm bg-tiktok-gray/30 rounded-lg p-3">
                        {content.pinterest.description}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400 text-sm block mb-2">Suggested Boards</span>
                      <div className="flex flex-wrap gap-2">
                        {content.pinterest.board_suggestions.map((board) => (
                          <span key={board} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                            {board}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
