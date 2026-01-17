"use client";

import { motion } from "framer-motion";
import { Search, Zap, Package, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "AI Scans TikTok",
    description: "Our AI monitors millions of TikTok videos 24/7, detecting viral products before they hit mainstream.",
    color: "tiktok-cyan"
  },
  {
    icon: Zap,
    title: "We Score & Source",
    description: "Each trend gets an urgency score. We source the highest-potential products directly from verified suppliers.",
    color: "tiktok-red"
  },
  {
    icon: Package,
    title: "You Get It First",
    description: "Order before the trend peaks. Fast shipping ensures you're ahead of the curve, every time.",
    color: "green-400"
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-tiktok-dark">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/5 text-gray-300 px-4 py-2 rounded-full mb-4"
          >
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Simple 3-Step Process</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-xl mx-auto"
          >
            From viral TikTok discovery to your doorstep in record time
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-white/10 to-transparent" />
              )}

              <div className="bg-tiktok-black rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-colors h-full">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-tiktok-dark rounded-full flex items-center justify-center border border-white/10">
                  <span className="text-sm font-bold text-white">{index + 1}</span>
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-${step.color}/10 flex items-center justify-center mb-6`}>
                  <step.icon className={`w-7 h-7 text-${step.color}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
