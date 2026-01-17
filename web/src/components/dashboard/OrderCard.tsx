"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, ExternalLink, MoreVertical, Package } from "lucide-react";
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
}

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function OrderCard({ order, onViewDetails }: OrderCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const copyAddress = () => {
    if (order.shipping_address) {
      navigator.clipboard.writeText(order.shipping_address);
    }
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        "bg-tiktok-gray/50 rounded-lg p-4 cursor-grab active:cursor-grabbing",
        "hover:bg-tiktok-gray/70 transition-colors",
        isDragging && "opacity-50 shadow-xl"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-white font-medium">#{order.id}</span>
          <span className="text-gray-500 text-sm ml-2">{timeAgo(order.created_at)}</span>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-400 hover:text-white rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-tiktok-dark border border-tiktok-gray rounded-lg shadow-xl z-10 py-1 w-40">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(order);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-tiktok-gray/50 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyAddress();
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-tiktok-gray/50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Address
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-gray-400" />
        <span className="text-gray-300 text-sm truncate flex-1">
          {order.product_name || "Unknown Product"}
        </span>
      </div>

      <p className="text-gray-400 text-xs truncate mb-3">{order.email}</p>

      <div className="flex items-center justify-between">
        <span className="text-white font-semibold">
          {formatCurrency(order.amount_cents)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(order);
          }}
          className="text-tiktok-cyan text-xs hover:underline"
        >
          Details
        </button>
      </div>
    </div>
  );
}
