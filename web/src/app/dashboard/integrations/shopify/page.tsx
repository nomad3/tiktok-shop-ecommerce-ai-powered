"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  ShoppingBag,
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Copy,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Step = "store_url" | "access_token" | "testing" | "success" | "error";

function ShopifyConnectContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("store_url");
  const [storeUrl, setStoreUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
    }
  }, [status, router]);

  // Check for OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    const shop = searchParams.get("shop");
    if (code && shop) {
      handleOAuthCallback(code, shop);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (code: string, shop: string) => {
    setStep("testing");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/integrations/shopify/oauth/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, shop }),
      });

      if (response.ok) {
        setStep("success");
      } else {
        const data = await response.json();
        setError(data.detail || "OAuth callback failed");
        setStep("error");
      }
    } catch {
      setError("Failed to complete OAuth flow");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const handleStoreUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeUrl.trim()) {
      setError("Please enter your store URL");
      return;
    }
    setError(null);
    setStep("access_token");
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken.trim()) {
      setError("Please enter your access token");
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
          platform: "shopify",
          name: `Shopify - ${storeUrl}`,
          store_url: storeUrl,
          access_token: accessToken,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStep = () => {
    switch (step) {
      case "store_url":
        return (
          <form onSubmit={handleStoreUrlSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Step 1: Enter Your Store URL
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Enter your Shopify store URL (e.g., your-store.myshopify.com)
              </p>
              <input
                type="text"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="your-store.myshopify.com"
                className="w-full px-4 py-3 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Continue
            </button>
          </form>
        );

      case "access_token":
        return (
          <form onSubmit={handleConnect} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Step 2: Enter Access Token
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Create a private app in Shopify Admin and enter the access token.
              </p>

              {/* Instructions */}
              <div className="bg-tiktok-gray/30 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-white mb-2">How to get your access token:</h3>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Go to your Shopify Admin &gt; Settings &gt; Apps</li>
                  <li>Click &quot;Develop apps&quot; &gt; &quot;Create an app&quot;</li>
                  <li>Name it &quot;TikTok Urgency Engine&quot;</li>
                  <li>Configure Admin API scopes (products, orders, inventory)</li>
                  <li>Install the app and copy the Admin API access token</li>
                </ol>
                <a
                  href={`https://${storeUrl}/admin/settings/apps/development`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-tiktok-cyan text-xs mt-2 hover:underline"
                >
                  Open App Development <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Store URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={storeUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-tiktok-gray/30 border border-tiktok-gray rounded-lg text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setStep("store_url")}
                    className="px-3 py-2 text-tiktok-cyan text-sm hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Access Token</label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                />
              </div>

              {/* Required scopes */}
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Required API scopes:</p>
                <div className="flex flex-wrap gap-1">
                  {[
                    "read_products",
                    "write_products",
                    "read_orders",
                    "write_orders",
                    "read_inventory",
                    "write_inventory",
                  ].map((scope) => (
                    <span
                      key={scope}
                      onClick={() => copyToClipboard(scope)}
                      className="px-2 py-0.5 bg-tiktok-gray/50 rounded text-xs text-gray-300 cursor-pointer hover:bg-tiktok-gray"
                    >
                      {scope}
                    </span>
                  ))}
                  {copied && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Copied!
                    </span>
                  )}
                </div>
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
              className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Testing Connection...
            </h2>
            <p className="text-gray-400">
              Please wait while we verify your Shopify credentials.
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Successfully Connected!
            </h2>
            <p className="text-gray-400 mb-6">
              Your Shopify store is now connected. You can sync products and orders.
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
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
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
            <p className="text-gray-400 mb-4">{error || "Unable to connect to your Shopify store."}</p>
            <button
              onClick={() => {
                setStep("access_token");
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
          <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Connect Shopify</h1>
            <p className="text-gray-400">Sync products and orders with your Shopify store</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {step !== "success" && step !== "error" && (
        <div className="flex items-center gap-2 mb-8">
          <div
            className={`flex-1 h-1 rounded ${
              step === "store_url" ? "bg-green-500" : "bg-green-500"
            }`}
          />
          <div
            className={`flex-1 h-1 rounded ${
              step === "access_token" || step === "testing"
                ? "bg-green-500"
                : "bg-tiktok-gray"
            }`}
          />
          <div
            className={`flex-1 h-1 rounded ${
              step === "testing" ? "bg-green-500" : "bg-tiktok-gray"
            }`}
          />
        </div>
      )}

      {/* Content Card */}
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
        {renderStep()}
      </div>

      {/* Help */}
      {(step === "store_url" || step === "access_token") && (
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Need help?{" "}
            <a
              href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-tiktok-cyan hover:underline"
            >
              Read Shopify documentation
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export default function ShopifyConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
        </div>
      }
    >
      <ShopifyConnectContent />
    </Suspense>
  );
}
