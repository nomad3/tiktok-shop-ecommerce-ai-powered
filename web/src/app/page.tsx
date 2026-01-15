import { ProductCard } from "@/components/ui/ProductCard";

// Mock Data for now
const MOCK_PRODUCTS = [
  {
    id: "1",
    slug: "galaxy-projector",
    name: "Astronaut Galaxy Projector 2.0",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
    trendScore: 98,
    soldCount: 142,
  },
  {
    id: "2",
    slug: "neck-fan",
    name: "Portable Bladeless Neck Fan",
    price: 19.99,
    image: "https://images.unsplash.com/photo-1618360987523-288f986a438d?w=800&q=80",
    trendScore: 94,
    soldCount: 89,
  },
  {
    id: "3",
    slug: "cleaning-gel",
    name: "Universal Dust Cleaning Gel",
    price: 8.99,
    image: "https://images.unsplash.com/photo-1581557991964-125469da3b8a?w=800&q=80",
    trendScore: 88,
    soldCount: 312,
  },
];

export default function Home() {
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

        <div className="grid grid-cols-1 gap-6">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
