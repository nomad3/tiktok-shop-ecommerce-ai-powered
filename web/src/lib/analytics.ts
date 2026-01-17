/**
 * Analytics tracking utility for the frontend.
 * Tracks user interactions and sends them to the backend analytics service.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TrackingData {
  event_type: string;
  product_id?: string | number;
  order_id?: string | number;
  page?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}

interface SessionData {
  session_id: string;
  user_id?: string;
}

// Generate or retrieve session ID
function getSessionData(): SessionData {
  if (typeof window === "undefined") {
    return { session_id: "server" };
  }

  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }

  const userId = localStorage.getItem("user_id") || undefined;

  return { session_id: sessionId, user_id: userId };
}

// Get device info
function getDeviceInfo(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const ua = navigator.userAgent;
  let deviceType = "desktop";
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    deviceType = /iPad/.test(ua) ? "tablet" : "mobile";
  }

  return {
    device_type: deviceType,
    browser: getBrowserName(ua),
    os: getOSName(ua),
    screen_width: window.screen.width.toString(),
    screen_height: window.screen.height.toString(),
  };
}

function getBrowserName(ua: string): string {
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Other";
}

function getOSName(ua: string): string {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Other";
}

// Parse UTM parameters from URL
function getUTMParams(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  utmKeys.forEach((key) => {
    const value = params.get(key);
    if (value) {
      utm[key.replace("utm_", "")] = value;
    }
  });

  return utm;
}

// Main tracking function
async function track(data: TrackingData): Promise<void> {
  try {
    const session = getSessionData();
    const device = getDeviceInfo();
    const utm = getUTMParams();

    const payload = {
      ...data,
      ...session,
      ...device,
      source: utm.source || "direct",
      medium: utm.medium || "none",
      campaign: utm.campaign,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      timestamp: new Date().toISOString(),
    };

    // Use sendBeacon for better reliability (doesn't block page unload)
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(`${API_URL}/api/track/event`, blob);
    } else {
      // Fallback to fetch
      await fetch(`${API_URL}/api/track/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    // Silently fail - don't break user experience for analytics
    console.debug("Analytics tracking error:", error);
  }
}

/**
 * Analytics tracking API
 */
export const analytics = {
  /**
   * Track a custom event
   */
  track,

  /**
   * Track a page view
   */
  pageView: (page: string) => {
    return track({
      event_type: "page_view",
      page,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
    });
  },

  /**
   * Track a product view
   */
  productView: (productId: string | number, productName?: string) => {
    return track({
      event_type: "product_view",
      product_id: productId,
      metadata: productName ? { product_name: productName } : undefined,
    });
  },

  /**
   * Track add to cart
   */
  addToCart: (productId: string | number, quantity: number = 1, priceCents?: number) => {
    return track({
      event_type: "add_to_cart",
      product_id: productId,
      metadata: { quantity, price_cents: priceCents },
    });
  },

  /**
   * Track remove from cart
   */
  removeFromCart: (productId: string | number) => {
    return track({
      event_type: "remove_from_cart",
      product_id: productId,
    });
  },

  /**
   * Track checkout start
   */
  checkoutStart: (cartTotal: number, itemCount: number) => {
    return track({
      event_type: "checkout_start",
      metadata: { cart_total_cents: cartTotal, item_count: itemCount },
    });
  },

  /**
   * Track purchase completion
   */
  purchase: (orderId: string | number, totalCents: number, itemCount: number) => {
    return track({
      event_type: "purchase",
      order_id: orderId,
      metadata: { total_cents: totalCents, item_count: itemCount },
    });
  },

  /**
   * Track search
   */
  search: (query: string, resultCount: number) => {
    return track({
      event_type: "search",
      metadata: { query, result_count: resultCount },
    });
  },

  /**
   * Track share
   */
  share: (productId: string | number, platform: string) => {
    return track({
      event_type: "share",
      product_id: productId,
      metadata: { platform },
    });
  },

  /**
   * Track wishlist add
   */
  wishlistAdd: (productId: string | number) => {
    return track({
      event_type: "wishlist_add",
      product_id: productId,
    });
  },

  /**
   * Track click event
   */
  click: (element: string, metadata?: Record<string, unknown>) => {
    return track({
      event_type: "click",
      metadata: { element, ...metadata },
    });
  },

  /**
   * Track form submission
   */
  formSubmit: (formName: string, success: boolean) => {
    return track({
      event_type: "form_submit",
      metadata: { form_name: formName, success },
    });
  },

  /**
   * Track error
   */
  error: (errorType: string, message: string, stack?: string) => {
    return track({
      event_type: "error",
      metadata: { error_type: errorType, message, stack },
    });
  },

  /**
   * Set user ID for attribution
   */
  setUserId: (userId: string) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("user_id", userId);
    }
  },

  /**
   * Clear user ID (on logout)
   */
  clearUserId: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("user_id");
    }
  },
};

export default analytics;
