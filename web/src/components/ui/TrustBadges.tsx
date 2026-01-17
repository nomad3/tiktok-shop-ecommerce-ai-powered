"use client";

import { motion } from "framer-motion";
import { Truck, RotateCcw, Shield, CreditCard } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "2-5 day delivery worldwide"
  },
  {
    icon: RotateCcw,
    title: "30-Day Returns",
    description: "No questions asked"
  },
  {
    icon: Shield,
    title: "Secure Checkout",
    description: "SSL encrypted payments"
  },
  {
    icon: CreditCard,
    title: "Pay Your Way",
    description: "All major cards accepted"
  }
];

export function TrustBadges() {
  return (
    <section className="py-16 px-6 bg-tiktok-dark border-y border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                <badge.icon className="w-6 h-6 text-tiktok-cyan" />
              </div>
              <h3 className="font-semibold text-white mb-1">{badge.title}</h3>
              <p className="text-sm text-gray-500">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
