import { Home, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";

export function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-tiktok-black/95 backdrop-blur-md border-t border-white/10 z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <Link href="/" className="flex flex-col items-center gap-1 text-white">
          <Home size={24} fill="currentColor" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="#" className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition">
          <Search size={24} />
          <span className="text-[10px] font-medium">Discover</span>
        </Link>
        <div className="relative -top-5">
          <div className="bg-gradient-to-r from-tiktok-cyan to-tiktok-red p-[2px] rounded-full">
            <div className="bg-tiktok-black p-3 rounded-full">
              <ShoppingBag size={24} className="text-white" />
            </div>
          </div>
        </div>
        <Link href="#" className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition">
          <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
            {/* Placeholder Avatar */}
          </div>
          <span className="text-[10px] font-medium">Me</span>
        </Link>
      </div>
    </div>
  );
}
