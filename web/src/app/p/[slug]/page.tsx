import { BuyButton } from "@/components/ui/BuyButton";
import { ViewTracker } from "@/components/ui/ViewTracker";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { SocialProof } from "@/components/ui/SocialProof";
import { getProduct } from "@/lib/api";
import { ArrowLeft, ShieldCheck, Star, Truck, Zap, Package, RotateCcw, Clock, TrendingUp, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const price = product.price_cents / 100;
  const originalPrice = (price * 1.5).toFixed(2);

  return (
    <div className="bg-tiktok-black min-h-screen">
      <ViewTracker slug={slug} />

      {/* Desktop/Tablet Header */}
      <header className="sticky top-0 z-50 bg-tiktok-black/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-white hover:text-tiktok-cyan transition-colors">
            <ArrowLeft size={20} />
            <span className="hidden sm:inline font-medium">Back to Shop</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-tiktok-red/10 border border-tiktok-red/20 px-4 py-1.5 rounded-full text-sm font-bold text-tiktok-red flex items-center gap-2">
              <Zap size={14} className="animate-pulse" />
              Trending Now
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-purple-300 flex items-center gap-1">
              <TrendingUp size={12} />
              #{Math.floor(product.trend_score / 10)} on TikTok
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs font-medium text-blue-300 flex items-center gap-1">
              <Eye size={12} />
              {Math.floor(product.trend_score * 1000)}+ views
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Left Column - Image */}
          <div className="space-y-4">
            <div className="relative aspect-square lg:aspect-[4/5] bg-tiktok-dark rounded-2xl overflow-hidden">
              {product.main_image_url && (
                <Image
                  src={product.main_image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              {/* Trend Score Badge */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-semibold">{Math.round(product.trend_score)}</span>
              </div>
            </div>

            {/* Thumbnail Gallery Placeholder */}
            <div className="hidden lg:grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`aspect-square rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-tiktok-cyan' : 'border-transparent'} cursor-pointer hover:border-tiktok-cyan/50 transition-colors`}>
                  {product.main_image_url && (
                    <Image
                      src={product.main_image_url}
                      alt={`${product.name} view ${i + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="flex flex-col">
            {/* Title & Price */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-4">
                <span className="text-3xl lg:text-4xl font-bold text-tiktok-cyan">${price}</span>
                <span className="text-lg text-gray-500 line-through">${originalPrice}</span>
                <span className="bg-tiktok-red/20 text-tiktok-red text-sm font-semibold px-3 py-1 rounded-full">
                  Save {Math.round((1 - price / parseFloat(originalPrice)) * 100)}%
                </span>
              </div>
            </div>

            {/* Enhanced Social Proof */}
            <div className="mb-6">
              <SocialProof 
                productId={product.id}
                productName={product.name}
                viewCount={Math.floor(product.trend_score * 100)}
                purchaseCount={Math.floor(product.urgency_score * 1.5)}
                rating={4.8}
                reviewCount={Math.floor(product.trend_score * 5)}
              />
            </div>

            {/* Enhanced Countdown Timer */}
            <div className="mb-6">
              <CountdownTimer 
                urgencyLevel={product.urgency_score > 70 ? "high" : product.urgency_score > 40 ? "medium" : "low"}
                title="Limited time offer ends in"
                showSeconds={product.urgency_score > 70}
              />
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-3">Why it went viral</h3>
              <p className="text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Guarantees Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-colors">
                <Truck size={24} className="text-tiktok-cyan" />
                <span className="text-xs text-gray-300 font-medium">Free Shipping</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-colors">
                <ShieldCheck size={24} className="text-tiktok-cyan" />
                <span className="text-xs text-gray-300 font-medium">Secure Payment</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-colors">
                <RotateCcw size={24} className="text-tiktok-cyan" />
                <span className="text-xs text-gray-300 font-medium">30-Day Returns</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-colors">
                <Package size={24} className="text-tiktok-cyan" />
                <span className="text-xs text-gray-300 font-medium">Quality Checked</span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-tiktok-dark rounded-xl p-4 mb-8 flex items-center gap-4">
              <Clock className="text-green-400" size={20} />
              <div>
                <p className="text-white font-medium">Order within the next 2 hours</p>
                <p className="text-sm text-gray-400">Get it by <span className="text-green-400 font-medium">Friday, Jan 24</span></p>
              </div>
            </div>

            {/* Buy Button - Desktop */}
            <div className="hidden lg:block mt-auto">
              <BuyButton productId={product.id} price={price} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-tiktok-black/95 backdrop-blur-lg border-t border-white/10 z-50">
        <div className="max-w-md mx-auto">
          <BuyButton productId={product.id} price={price} />
        </div>
      </div>

      {/* Bottom padding for mobile sticky footer */}
      <div className="lg:hidden h-24" />
    </div>
  );
}
