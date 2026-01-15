import clsx from "clsx";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "TikTok Urgency Shelf",
  description: "Trending products, right now.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={clsx(inter.variable, "bg-tiktok-black text-tiktok-white min-h-screen")}>
        <main className="max-w-md mx-auto min-h-screen bg-tiktok-black relative shadow-2xl shadow-tiktok-gray/50 overflow-hidden">
          {/* Mobile-first container constraint */}
          {children}
        </main>
      </body>
    </html>
  );
}
