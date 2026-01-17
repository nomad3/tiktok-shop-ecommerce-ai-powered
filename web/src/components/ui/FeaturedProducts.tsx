"use client";

import { motion } from "framer-motion";
import { Flame, Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  trendScore: number;
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  const featured = products.slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-tiktok-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-tiktok-red/10 text-tiktok-red px-4 py-2 rounded-full mb-4"
          >
            <Flame className="w-4 h-4" />
            <span className="text-sm font-semibold">Hot Right Now</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Featured Products
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-xl mx-auto"
          >
            Hand-picked viral sensations currently breaking the internet
          </motion.p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/p/${product.slug}`} className="group block">
                <div className="relative bg-tiktok-dark rounded-2xl overflow-hidden border border-white/5 hover:border-tiktok-cyan/30 transition-all duration-300 hover:shadow-xl hover:shadow-tiktok-cyan/5">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-tiktok-gray flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-tiktok-dark via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Badge */}
                    {index === 0 && (
                      <div className="absolute top-4 left-4 bg-tiktok-red text-white text-xs font-bold px-3 py-1 rounded-full">
                        #1 Trending
                      </div>
                    )}
                    {/* Trend Score */}
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {product.trendScore}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-tiktok-cyan transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-white">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-tiktok-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                        View <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
