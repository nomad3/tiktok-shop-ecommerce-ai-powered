import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}) {
  return (
    <div className="min-h-screen bg-tiktok-black flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-tiktok-gray/50 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full">
        <div className="bg-green-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h1>
        <p className="text-gray-400 mb-8">
          Your order has been placed successfully. You will receive an email confirmation shortly.
        </p>

        {searchParams.session_id && (
          <div className="bg-black/30 p-3 rounded-lg mb-6">
            <p className="text-xs text-gray-500 font-mono break-all">
              ID: {searchParams.session_id}
            </p>
          </div>
        )}

        <Link
          href="/"
          className="block w-full bg-tiktok-red hover:bg-red-600 text-white font-bold py-3 rounded-full transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
