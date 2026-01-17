"use client";

import { motion } from "framer-motion";
import { Bell, ArrowRight } from "lucide-react";
import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section className="py-20 px-6 bg-tiktok-black">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-tiktok-dark to-tiktok-gray rounded-3xl p-8 md:p-12 text-center border border-white/5 relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-tiktok-cyan/5 via-transparent to-transparent" />

          <div className="relative z-10">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-tiktok-cyan/10 flex items-center justify-center">
              <Bell className="w-8 h-8 text-tiktok-cyan" />
            </div>

            {/* Content */}
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Get Trend Alerts First
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Subscribe to get notified when we detect the next big viral product.
              Be the first to know, first to buy.
            </p>

            {/* Form */}
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 text-green-400 py-4 px-6 rounded-full inline-flex items-center gap-2"
              >
                <Bell className="w-5 h-5" />
                You&apos;re on the list! Watch your inbox.
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-tiktok-cyan/50 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-tiktok-red hover:bg-tiktok-red/90 text-white font-semibold px-6 py-4 rounded-full flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  Subscribe
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <p className="text-xs text-gray-500 mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
