"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Store,
  Palette,
  Mail,
  Share2,
  FileText,
  Save,
  Check,
} from "lucide-react";
import clsx from "clsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Settings {
  store_name: string;
  store_logo_url: string | null;
  store_favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  contact_email: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  shipping_policy: string | null;
  return_policy: string | null;
  privacy_policy: string | null;
}

const defaultSettings: Settings = {
  store_name: "My Store",
  store_logo_url: null,
  store_favicon_url: null,
  primary_color: "#FE2C55",
  accent_color: "#25F4EE",
  contact_email: null,
  social_instagram: null,
  social_tiktok: null,
  social_facebook: null,
  social_twitter: null,
  shipping_policy: null,
  return_policy: null,
  privacy_policy: null,
};

const tabs = [
  { id: "general", label: "General", icon: Store },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "contact", label: "Contact & Social", icon: Mail },
  { id: "policies", label: "Policies", icon: FileText },
];

const colorPresets = [
  { name: "TikTok Red", value: "#FE2C55" },
  { name: "TikTok Cyan", value: "#25F4EE" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
  { name: "Yellow", value: "#EAB308" },
];

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dashboard/login");
      return;
    }

    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router]);

  async function fetchSettings() {
    try {
      const res = await fetch(`${API_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  }

  const updateSetting = (key: keyof Settings, value: string | null) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tiktok-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gray-400">Configure your store settings and preferences.</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors",
            saved
              ? "bg-green-500 text-white"
              : "bg-tiktok-red text-white hover:bg-tiktok-red/90",
            saving && "opacity-50 cursor-not-allowed"
          )}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-tiktok-red text-white"
                : "bg-tiktok-dark text-gray-400 hover:text-white hover:bg-tiktok-gray/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray p-6">
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Store Name
              </label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => updateSetting("store_name", e.target.value)}
                className="w-full max-w-md px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={settings.store_logo_url || ""}
                onChange={(e) => updateSetting("store_logo_url", e.target.value || null)}
                placeholder="https://example.com/logo.png"
                className="w-full max-w-md px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
              />
              {settings.store_logo_url && (
                <div className="mt-3">
                  <img
                    src={settings.store_logo_url}
                    alt="Logo preview"
                    className="h-16 rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Favicon URL
              </label>
              <input
                type="url"
                value={settings.store_favicon_url || ""}
                onChange={(e) => updateSetting("store_favicon_url", e.target.value || null)}
                placeholder="https://example.com/favicon.ico"
                className="w-full max-w-md px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
              />
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Primary Color
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateSetting("primary_color", color.value)}
                    className={clsx(
                      "w-10 h-10 rounded-lg transition-all",
                      settings.primary_color === color.value
                        ? "ring-2 ring-white ring-offset-2 ring-offset-tiktok-dark"
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => updateSetting("primary_color", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => updateSetting("primary_color", e.target.value)}
                  className="w-32 px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Accent Color
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateSetting("accent_color", color.value)}
                    className={clsx(
                      "w-10 h-10 rounded-lg transition-all",
                      settings.accent_color === color.value
                        ? "ring-2 ring-white ring-offset-2 ring-offset-tiktok-dark"
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.accent_color}
                  onChange={(e) => updateSetting("accent_color", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.accent_color}
                  onChange={(e) => updateSetting("accent_color", e.target.value)}
                  className="w-32 px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white focus:outline-none focus:border-tiktok-cyan"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border-t border-tiktok-gray pt-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Preview
              </label>
              <div className="bg-tiktok-black rounded-lg p-6">
                <button
                  style={{ backgroundColor: settings.primary_color }}
                  className="px-6 py-2 rounded-lg text-white font-medium mr-3"
                >
                  Primary Button
                </button>
                <button
                  style={{ backgroundColor: settings.accent_color }}
                  className="px-6 py-2 rounded-lg text-black font-medium"
                >
                  Accent Button
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contact_email || ""}
                onChange={(e) => updateSetting("contact_email", e.target.value || null)}
                placeholder="support@yourstore.com"
                className="w-full max-w-md px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
              />
            </div>

            <div className="border-t border-tiktok-gray pt-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Social Links
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={settings.social_instagram || ""}
                    onChange={(e) => updateSetting("social_instagram", e.target.value || null)}
                    placeholder="https://instagram.com/yourstore"
                    className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    TikTok
                  </label>
                  <input
                    type="url"
                    value={settings.social_tiktok || ""}
                    onChange={(e) => updateSetting("social_tiktok", e.target.value || null)}
                    placeholder="https://tiktok.com/@yourstore"
                    className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={settings.social_facebook || ""}
                    onChange={(e) => updateSetting("social_facebook", e.target.value || null)}
                    placeholder="https://facebook.com/yourstore"
                    className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Twitter / X
                  </label>
                  <input
                    type="url"
                    value={settings.social_twitter || ""}
                    onChange={(e) => updateSetting("social_twitter", e.target.value || null)}
                    placeholder="https://x.com/yourstore"
                    className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "policies" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Shipping Policy
              </label>
              <textarea
                value={settings.shipping_policy || ""}
                onChange={(e) => updateSetting("shipping_policy", e.target.value || null)}
                rows={6}
                placeholder="Enter your shipping policy..."
                className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Return Policy
              </label>
              <textarea
                value={settings.return_policy || ""}
                onChange={(e) => updateSetting("return_policy", e.target.value || null)}
                rows={6}
                placeholder="Enter your return policy..."
                className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Privacy Policy
              </label>
              <textarea
                value={settings.privacy_policy || ""}
                onChange={(e) => updateSetting("privacy_policy", e.target.value || null)}
                rows={6}
                placeholder="Enter your privacy policy..."
                className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
