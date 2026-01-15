import { ProductCard } from "@/components/ui/ProductCard";
import { getProducts } from "@/lib/api";

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-tiktok-black/80 backdrop-blur-md px-4 py-4 border-b border-white/10 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter text-white">
          TIK<span className="text-tiktok-cyan">TOK</span><span className="text-tiktok-red">FIND</span>
        </h1>
        <div className="w-2 h-2 rounded-full bg-tiktok-red animate-pulse" />
      </header>

      {/* Feed */}
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Trending Now</h2>
          <span className="text-xs text-tiktok-cyan font-medium">Updates every 1h</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>Loading trends...</p>
            <p className="text-xs mt-2">(Ensure Engine is running & seeded)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
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
                  soldCount: Math.round(product.urgency_score * 1.5) // Fake sold count based on urgency
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
