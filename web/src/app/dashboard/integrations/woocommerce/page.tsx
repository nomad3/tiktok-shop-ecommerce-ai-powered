"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Globe,
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Step = "credentials" | "testing" | "success" | "error";

export default function WooCommerceConnectPage() {
  const { status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [storeUrl, setStoreUrl] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
    }
  }, [status, router]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeUrl.trim()) {
      setError("Please enter your store URL");
      return;
    }
    if (!consumerKey.trim()) {
      setError("Please enter your consumer key");
      return;
    }
    if (!consumerSecret.trim()) {
      setError("Please enter your consumer secret");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("testing");

    try {
      // Create integration
      const createResponse = await fetch(`${API_URL}/api/integrations/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "woocommerce",
          name: `WooCommerce - ${new URL(storeUrl.startsWith("http") ? storeUrl : `https://${storeUrl}`).hostname}`,
          store_url: storeUrl,
          api_key: consumerKey,
          api_secret: consumerSecret,
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json();
        throw new Error(data.detail || "Failed to create integration");
      }

      const integration = await createResponse.json();

      // Test connection
      const testResponse = await fetch(
        `${API_URL}/api/integrations/${integration.id}/test`,
        { method: "POST" }
      );

      const testResult = await testResponse.json();

      if (testResult.success) {
        setStep("success");
      } else {
        setError(testResult.message || "Connection test failed");
        setStep("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "credentials":
        return (
          <form onSubmit={handleConnect} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Connect Your WooCommerce Store
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Enter your store URL and REST API credentials.
              </p>

              {/* Instructions */}
              <div className="bg-tiktok-gray/30 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-white mb-2">How to get your API keys:</h3>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Go to WooCommerce &gt; Settings &gt; Advanced &gt; REST API</li>
                  <li>Click &quot;Add key&quot;</li>
                  <li>Set a description (e.g., &quot;TikTok Urgency Engine&quot;)</li>
                  <li>Select &quot;Read/Write&quot; permissions</li>
                  <li>Click &quot;Generate API key&quot;</li>
                  <li>Copy the Consumer Key and Consumer Secret</li>
                </ol>
              </div>

              {/* Store URL */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Store URL *</label>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://your-store.com"
                  className="w-full px-4 py-3 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                />
                <p className="text-xs text-gray-500 mt-1">Include https:// if using SSL</p>
              </div>

              {/* Consumer Key */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Consumer Key *</label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={consumerKey}
                    onChange={(e) => setConsumerKey(e.target.value)}
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 pr-12 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Consumer Secret */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Consumer Secret *</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={consumerSecret}
                    onChange={(e) => setConsumerSecret(e.target.value)}
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 pr-12 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-start gap-2 bg-blue-500/10 rounded-lg p-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-300">
                  Your credentials are transmitted securely and stored encrypted.
                  We recommend using a dedicated API key for this integration.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Store"
              )}
            </button>
          </form>
        );

      case "testing":
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Testing Connection...
            </h2>
            <p className="text-gray-400">
              Please wait while we verify your WooCommerce credentials.
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Successfully Connected!
            </h2>
            <p className="text-gray-400 mb-6">
              Your WooCommerce store is now connected. You can sync products and orders.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard/integrations"
                className="px-6 py-2 bg-tiktok-gray text-white rounded-lg font-medium hover:bg-tiktok-gray/80"
              >
                View Integrations
              </Link>
              <Link
                href="/dashboard/products"
                className="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
              >
                Sync Products
              </Link>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-400 mb-2">{error || "Unable to connect to your WooCommerce store."}</p>
            <p className="text-gray-500 text-sm mb-4">
              Common issues: incorrect URL, invalid API keys, or REST API not enabled.
            </p>
            <button
              onClick={() => {
                setStep("credentials");
                setError(null);
              }}
              className="px-6 py-2 bg-tiktok-cyan text-black rounded-lg font-medium hover:bg-tiktok-cyan/80"
            >
              Try Again
            </button>
          </div>
        );
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/integrations"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Connect WooCommerce</h1>
            <p className="text-gray-400">Sync products and orders with your WordPress store</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {step !== "success" && step !== "error" && (
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1 h-1 rounded bg-purple-500" />
          <div
            className={`flex-1 h-1 rounded ${
              step === "testing" ? "bg-purple-500" : "bg-tiktok-gray"
            }`}
          />
        </div>
      )}

      {/* Content Card */}
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
        {renderStep()}
      </div>

      {/* Help */}
      {step === "credentials" && (
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Need help?{" "}
            <a
              href="https://woocommerce.com/document/woocommerce-rest-api/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-tiktok-cyan hover:underline inline-flex items-center gap-1"
            >
              Read WooCommerce REST API docs <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
