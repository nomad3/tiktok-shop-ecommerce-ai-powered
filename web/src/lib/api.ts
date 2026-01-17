const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  main_image_url: string | null;
  video_url: string | null;
  status: string;
  trend_score: number;
  urgency_score: number;
  created_at: string;
  supplier_url?: string;
  supplier_name?: string;
  supplier_cost_cents?: number;
  profit_margin?: number;
  import_source?: string;
}

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      console.error("Failed to fetch products:", res.status);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      console.error("Failed to fetch product:", res.status);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export async function createCheckoutSession(
  productId: number,
  quantity: number = 1
): Promise<CheckoutSession | null> {
  try {
    const res = await fetch(`${API_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        quantity,
      }),
    });

    if (!res.ok) {
      console.error("Failed to create checkout session:", res.status);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return null;
  }
}
