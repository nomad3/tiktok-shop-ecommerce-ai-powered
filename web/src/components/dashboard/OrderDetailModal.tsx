"use client";

import { X, Package, Mail, MapPin, CreditCard, Clock, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface Order {
  id: number;
  product_name: string | null;
  email: string;
  amount_cents: number;
  status: string;
  created_at: string;
  shipping_address?: string;
  stripe_session_id?: string;
  tracking_number?: string;
  tracking_url?: string;
}

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderId: number, status: string) => void;
  onAddTracking: (orderId: number, tracking: string, url?: string) => void;
}

const statusOptions = [
  { value: "paid", label: "Paid", color: "bg-blue-500" },
  { value: "processing", label: "Processing", color: "bg-yellow-500" },
  { value: "shipped", label: "Shipped", color: "bg-purple-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
  { value: "refunded", label: "Refunded", color: "bg-gray-500" },
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  onAddTracking,
}: OrderDetailModalProps) {
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || "");
  const [trackingUrl, setTrackingUrl] = useState(order?.tracking_url || "");
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTracking = () => {
    if (trackingNumber) {
      onAddTracking(order.id, trackingNumber, trackingUrl);
    }
  };

  const currentStatus = statusOptions.find((s) => s.value === order.status);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-tiktok-gray">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Order #{order.id}</h2>
            <span
              className={clsx(
                "px-2 py-1 rounded-full text-xs font-medium",
                currentStatus?.color,
                "bg-opacity-20"
              )}
              style={{ color: currentStatus?.color.replace("bg-", "") }}
            >
              {currentStatus?.label || order.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-tiktok-gray/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Product</span>
                </div>
                <p className="text-white font-medium">
                  {order.product_name || "Unknown Product"}
                </p>
              </div>
              <div className="bg-tiktok-gray/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">Amount</span>
                </div>
                <p className="text-white font-semibold text-xl">
                  {formatCurrency(order.amount_cents)}
                </p>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-tiktok-gray/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-3">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Customer</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-white">{order.email}</p>
                <button
                  onClick={() => copyToClipboard(order.email)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="bg-tiktok-gray/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Shipping Address</span>
                </div>
                <div className="flex items-start justify-between">
                  <p className="text-white whitespace-pre-line">
                    {order.shipping_address}
                  </p>
                  <button
                    onClick={() => copyToClipboard(order.shipping_address!)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="bg-tiktok-gray/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Order Date</span>
              </div>
              <p className="text-white">{formatDate(order.created_at)}</p>
            </div>

            {/* Status Change */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Update Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => onStatusChange(order.id, status.value)}
                    className={clsx(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      order.status === status.value
                        ? `${status.color} text-white`
                        : "bg-tiktok-gray/50 text-gray-300 hover:bg-tiktok-gray"
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tracking */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tracking Information
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Tracking number"
                  className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                />
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="Tracking URL (optional)"
                  className="w-full px-4 py-2 bg-tiktok-gray/50 border border-tiktok-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-tiktok-cyan"
                />
                <button
                  onClick={handleSaveTracking}
                  disabled={!trackingNumber}
                  className="px-4 py-2 bg-tiktok-cyan text-black font-medium rounded-lg hover:bg-tiktok-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Tracking
                </button>
              </div>
            </div>

            {/* Stripe Link */}
            {order.stripe_session_id && (
              <a
                href={`https://dashboard.stripe.com/payments/${order.stripe_session_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-tiktok-cyan hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                View in Stripe Dashboard
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-tiktok-gray">
          <button
            onClick={onClose}
            className="w-full py-2 bg-tiktok-gray text-white font-medium rounded-lg hover:bg-tiktok-gray/80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
