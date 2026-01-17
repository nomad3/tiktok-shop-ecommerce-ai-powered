"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Plug,
  ShoppingBag,
  Store,
  Package,
  Globe,
  Check,
  X,
  RefreshCw,
  Settings,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Platform {
  id: string;
  name: string;
  description: string;
  status: string;
  features: string[];
  setup_fields: {
    name: string;
    label: string;
    type: string;
    placeholder: string;
    required: boolean;
  }[];
}

interface Integration {
  id: number;
  platform: string;
  name: string;
  store_url: string | null;
  is_active: boolean;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_status: string;
  sync_error: string | null;
  auto_sync_products: boolean;
  auto_sync_orders: boolean;
  products_synced: number;
  orders_synced: number;
}

const platformIcons: Record<string, typeof ShoppingBag> = {
  shopify: ShoppingBag,
  woocommerce: Globe,
  tiktok_shop: Store,
  amazon: Package,
  ebay: ShoppingBag,
};

const platformColors: Record<string, string> = {
  shopify: "bg-green-500",
  woocommerce: "bg-purple-500",
  tiktok_shop: "bg-tiktok-red",
  amazon: "bg-orange-500",
  ebay: "bg-blue-500",
};

export default function IntegrationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [platformsRes, integrationsRes] = await Promise.all([
        fetch(`${API_URL}/api/integrations/platforms`),
        fetch(`${API_URL}/api/integrations/`),
      ]);

      if (platformsRes.ok) {
        setPlatforms(await platformsRes.json());
      }
      if (integrationsRes.ok) {
        setIntegrations(await integrationsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnect = async (platform: Platform) => {
    setFormError(null);

    // Validate form
    for (const field of platform.setup_fields) {
      if (field.required && !formData[field.name]) {
        setFormError(`${field.label} is required`);
        return;
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/integrations/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platform.id,
          name: `My ${platform.name} Store`,
          store_url: formData.store_url || "",
          api_key: formData.api_key || null,
          api_secret: formData.api_secret || null,
          access_token: formData.access_token || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to connect");
      }

      const newIntegration = await response.json();

      // Test the connection
      const testResponse = await fetch(
        `${API_URL}/api/integrations/${newIntegration.id}/test`,
        { method: "POST" }
      );

      if (testResponse.ok) {
        await fetchData();
        setConnectingPlatform(null);
        setFormData({});
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Connection failed");
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      return;
    }

    try {
      await fetch(`${API_URL}/api/integrations/${integration.id}`, {
        method: "DELETE",
      });
      await fetchData();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const handleSync = async (integration: Integration) => {
    setSyncing(integration.id);
    try {
      await fetch(`${API_URL}/api/integrations/${integration.id}/sync`, {
        method: "POST",
      });
      await fetchData();
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setSyncing(null);
    }
  };

  const getConnectedIntegration = (platformId: string) => {
    return integrations.find((i) => i.platform === platformId && i.is_active);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  const connectedCount = integrations.filter((i) => i.is_connected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Integrations</h1>
          <p className="text-gray-400">
            Connect your store to multiple sales channels.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-tiktok-dark rounded-lg px-4 py-2 border border-tiktok-gray">
          <Plug className="w-4 h-4 text-tiktok-cyan" />
          <span className="text-white font-medium">{connectedCount}</span>
          <span className="text-gray-400">connected</span>
        </div>
      </div>

      {/* Connected Integrations */}
      {connectedCount > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Connected</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter((i) => i.is_connected)
              .map((integration) => {
                const Icon = platformIcons[integration.platform] || ShoppingBag;
                const color = platformColors[integration.platform] || "bg-gray-500";
                const platform = platforms.find((p) => p.id === integration.platform);

                return (
                  <div
                    key={integration.id}
                    className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{integration.name}</h3>
                          <p className="text-xs text-gray-400 truncate max-w-[150px]">
                            {integration.store_url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-xs text-green-400">Connected</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-tiktok-gray/30 rounded-lg p-3">
                        <div className="text-lg font-bold text-white">
                          {integration.products_synced}
                        </div>
                        <div className="text-xs text-gray-400">Products</div>
                      </div>
                      <div className="bg-tiktok-gray/30 rounded-lg p-3">
                        <div className="text-lg font-bold text-white">
                          {integration.orders_synced}
                        </div>
                        <div className="text-xs text-gray-400">Orders</div>
                      </div>
                    </div>

                    {/* Last sync */}
                    {integration.last_sync_at && (
                      <p className="text-xs text-gray-500 mb-3">
                        Last synced: {new Date(integration.last_sync_at).toLocaleString()}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(integration)}
                        disabled={syncing === integration.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-tiktok-cyan/20 text-tiktok-cyan rounded-lg text-sm font-medium hover:bg-tiktok-cyan/30 disabled:opacity-50"
                      >
                        {syncing === integration.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Sync
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Available Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const Icon = platformIcons[platform.id] || ShoppingBag;
            const color = platformColors[platform.id] || "bg-gray-500";
            const connected = getConnectedIntegration(platform.id);
            const isAvailable = platform.status === "available";
            const isConnecting = connectingPlatform === platform.id;

            if (connected?.is_connected) return null;

            return (
              <div
                key={platform.id}
                className={clsx(
                  "bg-tiktok-dark rounded-xl border border-tiktok-gray p-5",
                  !isAvailable && "opacity-60"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{platform.name}</h3>
                    <span
                      className={clsx(
                        "text-xs uppercase",
                        platform.status === "available"
                          ? "text-green-400"
                          : platform.status === "coming_soon"
                          ? "text-yellow-400"
                          : "text-gray-500"
                      )}
                    >
                      {platform.status === "available"
                        ? "Available"
                        : platform.status === "coming_soon"
                        ? "Coming Soon"
                        : "Planned"}
                    </span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4">{platform.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {platform.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-0.5 bg-tiktok-gray/50 rounded text-xs text-gray-300"
                    >
                      {feature.replace("_", " ")}
                    </span>
                  ))}
                </div>

                {/* Connect Form */}
                {isConnecting && (
                  <div className="border-t border-tiktok-gray pt-4 mt-4 space-y-3">
                    {platform.setup_fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          {field.label} {field.required && "*"}
                        </label>
                        <input
                          type={field.type}
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.name]: e.target.value })
                          }
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                        />
                      </div>
                    ))}

                    {formError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {formError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setConnectingPlatform(null);
                          setFormData({});
                          setFormError(null);
                        }}
                        className="flex-1 py-2 bg-tiktok-gray text-white rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConnect(platform)}
                        className="flex-1 py-2 bg-tiktok-cyan text-black rounded-lg text-sm font-medium"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                )}

                {/* Connect Button */}
                {!isConnecting && isAvailable && (
                  <button
                    onClick={() => setConnectingPlatform(platform.id)}
                    className="w-full py-2 bg-tiktok-gray/50 text-white rounded-lg text-sm font-medium hover:bg-tiktok-gray transition-colors"
                  >
                    Connect
                  </button>
                )}

                {!isAvailable && (
                  <div className="w-full py-2 text-center text-gray-500 text-sm">
                    {platform.status === "coming_soon" ? "Coming Soon" : "Planned"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
