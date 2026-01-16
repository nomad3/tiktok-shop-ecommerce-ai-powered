import { Zap } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden">
      {/* Background (Simulated Video) */}
      <div className="absolute inset-0 bg-tiktok-gray">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-tiktok-black" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start gap-4">
        <div className="flex items-center gap-2 bg-tiktok-red px-3 py-1 rounded-full animate-pulse">
          <Zap size={16} className="fill-white text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Flash Drop</span>
        </div>

        <h1 className="text-4xl font-black text-white leading-none tracking-tighter">
          TRENDS<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-tiktok-cyan to-tiktok-white">ZERO</span> DELAY
        </h1>

        <p className="text-gray-300 text-sm max-w-[80%]">
          We intercept TikTok's viral products before they sell out. You have 24h.
        </p>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-lg p-2 min-w-[60px]">
            <span className="text-xl font-bold text-white font-mono">04</span>
            <span className="text-[10px] text-gray-400 uppercase">Hrs</span>
          </div>
          <span className="text-2xl font-bold text-white/50">:</span>
          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-lg p-2 min-w-[60px]">
            <span className="text-xl font-bold text-white font-mono">12</span>
            <span className="text-[10px] text-gray-400 uppercase">Min</span>
          </div>
          <span className="text-2xl font-bold text-white/50">:</span>
          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-lg p-2 min-w-[60px]">
            <span className="text-xl font-bold text-white font-mono">45</span>
            <span className="text-[10px] text-gray-400 uppercase">Sec</span>
          </div>
        </div>
      </div>
    </div>
  );
}
