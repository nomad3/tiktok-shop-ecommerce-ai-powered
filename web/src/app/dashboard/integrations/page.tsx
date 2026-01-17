"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Plug, ShoppingBag, Store, Package, Globe } from "lucide-react";

export default function IntegrationsPage() {
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

  const integrations = [
    {
      name: "Shopify",
      description: "Sync products and orders with your Shopify store",
      icon: ShoppingBag,
      status: "coming",
      color: "bg-green-500",
    },
    {
      name: "WooCommerce",
      description: "Connect your WordPress WooCommerce store",
      icon: Globe,
      status: "coming",
      color: "bg-purple-500",
    },
    {
      name: "TikTok Shop",
      description: "Sell directly on TikTok",
      icon: Store,
      status: "coming",
      color: "bg-tiktok-red",
    },
    {
      name: "Amazon Seller",
      description: "Expand to Amazon marketplace",
      icon: Package,
      status: "planned",
      color: "bg-orange-500",
    },
    {
      name: "eBay",
      description: "List products on eBay",
      icon: ShoppingBag,
      status: "planned",
      color: "bg-blue-500",
    },
    {
      name: "Etsy",
      description: "Sell on Etsy marketplace",
      icon: Store,
      status: "planned",
      color: "bg-orange-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Integrations</h1>
        <p className="text-gray-400">
          Connect your store to multiple sales channels.
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-br from-blue-500/20 to-tiktok-cyan/20 rounded-xl border border-tiktok-gray p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-tiktok-cyan rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Plug className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Multi-Channel Commerce
        </h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          Manage all your sales channels from one place. Sync products, orders,
          and inventory across Shopify, WooCommerce, TikTok Shop, and more.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Coming in Phase 3
        </p>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6 opacity-60"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 ${integration.color} rounded-xl flex items-center justify-center`}>
                <integration.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">
                  {integration.name}
                </h3>
                <span className="text-xs text-gray-500 uppercase">
                  {integration.status === "coming" ? "Coming Soon" : "Planned"}
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">{integration.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
