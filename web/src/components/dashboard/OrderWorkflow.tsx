"use client";

import { useState } from "react";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MapPin,
  Calendar,
  User,
  CreditCard,
  Phone,
  Mail,
  Copy,
  ExternalLink
} from "lucide-react";

interface OrderWorkflowProps {
  order: {
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
    customer_phone?: string;
    estimated_delivery?: string;
    carrier?: string;
    fulfillment_center?: string;
  };
  onStatusChange: (orderId: number, newStatus: string) => void;
  onAddTracking: (orderId: number, tracking: string, url?: string) => void;
}

interface WorkflowStep {
  status: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  completed: boolean;
  active: boolean;
  estimatedTime?: string;
}

export function OrderWorkflow({ order, onStatusChange, onAddTracking }: OrderWorkflowProps) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("usps");

  const workflowSteps: WorkflowStep[] = [
    {
      status: "paid",
      label: "Order Received",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      description: "Payment confirmed, order in queue",
      completed: ["paid", "processing", "shipped", "delivered"].includes(order.status),
      active: order.status === "paid",
      estimatedTime: "0-2 hours"
    },
    {
      status: "processing",
      label: "Processing",
      icon: <Package className="w-5 h-5" />,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      description: "Picking, packing, and preparing",
      completed: ["processing", "shipped", "delivered"].includes(order.status),
      active: order.status === "processing",
      estimatedTime: "1-24 hours"
    },
    {
      status: "shipped",
      label: "Shipped",
      icon: <Truck className="w-5 h-5" />,
      color: "text-purple-400", 
      bgColor: "bg-purple-500/20",
      description: "In transit to customer",
      completed: ["shipped", "delivered"].includes(order.status),
      active: order.status === "shipped",
      estimatedTime: "1-3 days"
    },
    {
      status: "delivered",
      label: "Delivered",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      description: "Package delivered successfully",
      completed: order.status === "delivered",
      active: order.status === "delivered",
    }
  ];

  const handleStatusUpdate = (newStatus: string) => {
    onStatusChange(order.id, newStatus);
  };

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      const trackingUrl = generateTrackingUrl(carrier, trackingNumber);
      onAddTracking(order.id, trackingNumber, trackingUrl);
      setTrackingNumber("");
    }
  };

  const generateTrackingUrl = (carrier: string, tracking: string) => {
    const urls = {
      usps: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${tracking}`,
      fedex: `https://www.fedex.com/fedextrack/?trknbr=${tracking}`,
      ups: `https://www.ups.com/track?tracknum=${tracking}`,
      dhl: `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${tracking}`
    };
    return urls[carrier as keyof typeof urls] || urls.usps;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="bg-tiktok-gray/30 rounded-lg p-4 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-lg">Order #{order.id}</span>
              <button
                onClick={() => copyToClipboard(order.id.toString())}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="text-gray-400 text-sm">
              {order.product_name || "Unknown Product"} • {formatCurrency(order.amount_cents)}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <Calendar className="w-3 h-3" />
              {formatDate(order.created_at)}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-400">Current Status</div>
              <div className="text-white font-semibold capitalize">{order.status}</div>
            </div>
            <select
              value={order.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="bg-tiktok-gray border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="paid">Order Received</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-tiktok-dark rounded-lg p-4 border border-tiktok-gray">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300">{order.email}</span>
              <button
                onClick={() => copyToClipboard(order.email)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            {order.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300">{order.customer_phone}</span>
              </div>
            )}
            {order.stripe_session_id && (
              <div className="flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300 font-mono text-xs">{order.stripe_session_id}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-tiktok-dark rounded-lg p-4 border border-tiktok-gray">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Shipping Address
          </h4>
          <div className="text-sm text-gray-300">
            {order.shipping_address || "Address not provided"}
          </div>
          {order.estimated_delivery && (
            <div className="mt-2 text-xs text-gray-400">
              Estimated delivery: {order.estimated_delivery}
            </div>
          )}
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-tiktok-dark rounded-lg p-6 border border-tiktok-gray">
        <h4 className="text-white font-semibold mb-6">Order Progress</h4>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-600"></div>
          <div 
            className="absolute left-6 top-8 w-0.5 bg-gradient-to-b from-tiktok-cyan to-purple-500 transition-all duration-1000"
            style={{ 
              height: `${(workflowSteps.findIndex(step => step.completed && !step.active) + 1) * 25}%` 
            }}
          ></div>

          <div className="space-y-6">
            {workflowSteps.map((step, index) => (
              <div key={step.status} className="relative flex items-start gap-4">
                {/* Step Icon */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                  step.completed 
                    ? `${step.bgColor} border-transparent ${step.color}`
                    : step.active
                    ? `bg-white/10 border-white/20 ${step.color}`
                    : "bg-gray-700 border-gray-600 text-gray-500"
                }`}>
                  {step.completed ? step.icon : step.active ? (
                    <Clock className="w-5 h-5 animate-pulse" />
                  ) : step.icon}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className={`font-semibold ${
                      step.completed || step.active ? "text-white" : "text-gray-400"
                    }`}>
                      {step.label}
                    </h5>
                    {step.estimatedTime && !step.completed && (
                      <span className="text-xs text-gray-500">{step.estimatedTime}</span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    step.completed || step.active ? "text-gray-300" : "text-gray-500"
                  }`}>
                    {step.description}
                  </p>

                  {/* Special Actions */}
                  {step.status === "processing" && step.active && (
                    <button
                      onClick={() => handleStatusUpdate("shipped")}
                      className="mt-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs hover:bg-purple-500/30 transition-colors"
                    >
                      Mark as Shipped
                    </button>
                  )}

                  {step.status === "shipped" && step.active && !order.tracking_number && (
                    <form onSubmit={handleTrackingSubmit} className="mt-3 flex gap-2">
                      <select
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="bg-tiktok-gray border border-white/20 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="usps">USPS</option>
                        <option value="fedex">FedEx</option>
                        <option value="ups">UPS</option>
                        <option value="dhl">DHL</option>
                      </select>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Tracking number"
                        className="bg-tiktok-gray border border-white/20 rounded px-2 py-1 text-xs text-white flex-1"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-tiktok-cyan text-black rounded text-xs font-medium hover:opacity-90"
                      >
                        Add
                      </button>
                    </form>
                  )}

                  {order.tracking_number && step.status === "shipped" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Tracking:</span>
                      <code className="bg-tiktok-gray px-2 py-1 rounded text-xs text-white">
                        {order.tracking_number}
                      </code>
                      {order.tracking_url && (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-tiktok-cyan transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => window.open(`mailto:${order.email}?subject=Order ${order.id} Update`)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Email Customer
        </button>
        <button
          onClick={() => handleStatusUpdate("cancelled")}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          Cancel Order
        </button>
        <button
          onClick={() => handleStatusUpdate("refunded")}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          Process Refund
        </button>
        <button
          onClick={() => copyToClipboard(`Order #${order.id}: ${order.product_name} - ${order.email}`)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy Details
        </button>
      </div>
    </div>
  );
}