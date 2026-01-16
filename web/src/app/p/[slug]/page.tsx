
import { BuyButton } from "@/components/ui/BuyButton";
import { getProduct } from "@/lib/api";
import { ArrowLeft, ShieldCheck, Star, Truck, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const price = product.price_cents / 100;
  const originalPrice = (price * 1.5).toFixed(2); // Fake original price

  return (
    <div className="pb-24 bg-tiktok-black min-h-screen">
      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-20 p-4 flex justify-between items-center max-w-md mx-auto">
        <Link href="/" className="bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 transition">
          <ArrowLeft size={24} />
        </Link>
        <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-tiktok-cyan border border-tiktok-cyan/20">
          🔥 Trending #{Math.floor(Math.random() * 5) + 1}
        </div>
      </div>

      {/* Hero Media (Vertical) */}
      <div className="relative w-full aspect-[4/5] bg-tiktok-gray">
        {product.main_image_url && (
          <Image
            src={product.main_image_url}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-tiktok-black to-transparent" />
      </div>

      {/* Product Info */}
      <div className="px-5 -mt-6 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-white leading-tight w-3/4">{product.name}</h1>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-tiktok-cyan">${price}</span>
            <span className="text-sm text-gray-500 line-through">${originalPrice}</span>
          </div>
        </div>

        {/* Social Proof */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
          </div>
          <span className="text-sm text-gray-300">4.9 ({Math.floor(product.trend_score * 5)} reviews)</span>
        </div>

        {/* Urgency Box */}
        <div className="bg-tiktok-gray/50 border border-tiktok-red/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="bg-tiktok-red/10 p-2 rounded-full">
            <Zap size={20} className="text-tiktok-red" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Low Stock Alert</p>
            <p className="text-xs text-gray-400">Only {Math.floor(product.urgency_score / 5)} units left at this price.</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-bold text-white">Why it went viral</h3>
          <p className="text-gray-300 leading-relaxed text-sm">
            {product.description}
          </p>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/5 rounded-lg p-3 flex flex-col items-center text-center gap-2">
            <Truck size={20} className="text-tiktok-cyan" />
            <span className="text-xs text-gray-300">Fast Shipping</span>
          </div>
          <div className="bg-white/5 rounded-lg p-3 flex flex-col items-center text-center gap-2">
            <ShieldCheck size={20} className="text-tiktok-cyan" />
            <span className="text-xs text-gray-300">30-Day Returns</span>
          </div>
        </div>
      </div>



      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-tiktok-black/90 backdrop-blur-lg border-t border-white/10 max-w-md mx-auto z-20">
        <BuyButton productId={product.id} price={price} />
      </div>
    </div>
  );
}
