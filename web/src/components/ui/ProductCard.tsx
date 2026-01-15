import { Clock, Flame, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  trendScore: number;
  soldCount: number;
}

export function ProductCard({ product }: { product: ProductProps }) {
  return (
    <Link href={`/p/${product.slug}`} className="block group relative">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-tiktok-gray border border-white/5 shadow-lg">
        {/* Image / Video Placeholder */}
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="flex items-center gap-1 bg-tiktok-red/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-white">
            <Flame size={12} className="fill-white" />
            <span>Trending</span>
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between mb-1">
            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 w-3/4">
              {product.name}
            </h3>
            <div className="text-xl font-bold text-tiktok-cyan">
              ${product.price}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-300 mt-2">
            <div className="flex items-center gap-1">
              <TrendingUp size={14} className="text-tiktok-cyan" />
              <span>{product.trendScore} Score</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-tiktok-red" />
              <span>{product.soldCount} sold/hr</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
