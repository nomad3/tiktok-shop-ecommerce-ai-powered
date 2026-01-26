import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}) {
  return (
    <div className="min-h-screen bg-tiktok-black flex flex-col items-center justify-center p-6">
      <div className="bg-gradient-to-b from-tiktok-dark to-tiktok-gray/50 p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl max-w-lg w-full text-center">
        <div className="bg-green-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={48} className="text-green-500" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Order Confirmed!</h1>
        <p className="text-gray-400 mb-8 text-lg">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        {/* What's Next */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left">
          <h2 className="text-white font-semibold mb-4">What happens next?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-tiktok-cyan/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-tiktok-cyan" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Email Confirmation</p>
                <p className="text-gray-500 text-sm">You'll receive an order confirmation email shortly.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-tiktok-cyan/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-tiktok-cyan" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Fast Shipping</p>
                <p className="text-gray-500 text-sm">We'll ship your order within 24-48 hours.</p>
              </div>
            </div>
          </div>
        </div>

        {searchParams.session_id && (
          <div className="bg-black/30 p-4 rounded-xl mb-8">
            <p className="text-xs text-gray-500 mb-1">Order Reference</p>
            <p className="text-sm text-gray-300 font-mono break-all">
              {searchParams.session_id}
            </p>
          </div>
        )}

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full bg-tiktok-red hover:bg-tiktok-red/90 text-white font-bold py-4 px-8 rounded-full transition-all hover:scale-105"
        >
          Continue Shopping
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
