"use client";

import { X } from "lucide-react";
import { OrderWorkflow } from "./OrderWorkflow";

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

export function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  onAddTracking,
}: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-tiktok-dark rounded-xl border border-tiktok-gray w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-tiktok-gray">
          <h2 className="text-xl font-bold text-white">Order Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-tiktok-gray/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enhanced Workflow Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          <OrderWorkflow
            order={order}
            onStatusChange={onStatusChange}
            onAddTracking={onAddTracking}
          />
        </div>
      </div>
    </div>
  );
}