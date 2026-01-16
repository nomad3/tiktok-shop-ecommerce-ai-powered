"use client";

import { createCheckoutSession } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function BuyButton({ productId, price }: { productId: number; price: number }) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    const res = await createCheckoutSession(productId);
    if (res?.checkout_url) {
      window.location.href = res.checkout_url;
    } else {
      alert("Checkout failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="w-full bg-tiktok-red hover:bg-red-600 text-white font-bold py-4 rounded-full text-lg shadow-lg shadow-tiktok-red/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" /> Processing...
        </>
      ) : (
        `Buy Now - $${price}`
      )}
    </button>
  );
}
