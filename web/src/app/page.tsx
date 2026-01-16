import { BottomNav } from "@/components/ui/BottomNav";
import { HeroSection } from "@/components/ui/HeroSection";
import { ProductCard } from "@/components/ui/ProductCard";
import { getProducts } from "@/lib/api";

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="pb-24 bg-tiktok-black min-h-screen">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent max-w-md mx-auto">
        <h1 className="text-xl font-black tracking-tighter text-white drop-shadow-md">
          TIK<span className="text-tiktok-cyan">TOK</span><span className="text-tiktok-red">FIND</span>
        </h1>
        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-tiktok-red animate-pulse" />
        </div>
      </header>

      <HeroSection />

      {/* Feed */}
      <div className="px-4 py-6 space-y-6 -mt-6 relative z-10 bg-gradient-to-t from-tiktok-black via-tiktok-black to-transparent pt-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-tiktok-cyan rounded-full" />
            Trending Now
          </h2>
          <span className="text-xs text-tiktok-cyan font-medium bg-tiktok-cyan/10 px-2 py-1 rounded-full">Updates every 1h</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>Loading trends...</p>
            <p className="text-xs mt-2">(Ensure Engine is running & seeded)</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id.toString(),
                  slug: product.slug,
                  name: product.name,
                  price: product.price_cents / 100,
                  image: product.main_image_url || "",
                  trendScore: Math.round(product.trend_score),
                  soldCount: Math.round(product.urgency_score * 1.5)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
