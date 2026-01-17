import clsx from "clsx";
import "./globals.css";

// Use system font stack as fallback when Google Fonts can't be fetched
const fontClass = "font-sans";

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
      <body className={clsx(fontClass, "bg-tiktok-black text-tiktok-white min-h-screen")}>
        <main className="max-w-md mx-auto min-h-screen bg-tiktok-black relative shadow-2xl shadow-tiktok-gray/50 overflow-hidden">
          {/* Mobile-first container constraint */}
          {children}
        </main>
      </body>
    </html>
  );
}
