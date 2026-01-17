"use client";

import { motion } from "framer-motion";
import { TrendingUp, Star, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  trendScore: number;
  soldCount: number;
}

export function AllProducts({ products }: { products: Product[] }) {
  return (
    <section id="products" className="py-20 px-6 bg-tiktok-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-tiktok-cyan/10 text-tiktok-cyan px-4 py-2 rounded-full mb-4"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">Live Inventory</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold text-white"
            >
              All Trending Products
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400"
          >
            {products.length} products · Updated every hour
          </motion.p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No products available yet.</p>
            <p className="text-sm text-gray-500">Check back soon for trending items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
              >
                <Link href={`/p/${product.slug}`} className="group block">
                  <div className="bg-tiktok-dark rounded-xl overflow-hidden border border-white/5 hover:border-tiktok-cyan/30 transition-all duration-300">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-tiktok-gray flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      {/* Score badge */}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {product.trendScore}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-medium text-white text-sm mb-2 line-clamp-2 group-hover:text-tiktok-cyan transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {product.soldCount}+ sold
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
