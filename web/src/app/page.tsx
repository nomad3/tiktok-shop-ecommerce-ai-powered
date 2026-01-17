import { Header } from "@/components/ui/Header";
import { PremiumHero } from "@/components/ui/PremiumHero";
import { FeaturedProducts } from "@/components/ui/FeaturedProducts";
import { HowItWorks } from "@/components/ui/HowItWorks";
import { AllProducts } from "@/components/ui/AllProducts";
import { SocialProof } from "@/components/ui/SocialProof";
import { TrustBadges } from "@/components/ui/TrustBadges";
import { Newsletter } from "@/components/ui/Newsletter";
import { Footer } from "@/components/ui/Footer";
import { getProducts } from "@/lib/api";

export default async function Home() {
  const products = await getProducts();

  const formattedProducts = products.map((product) => ({
    id: product.id.toString(),
    slug: product.slug,
    name: product.name,
    price: product.price_cents / 100,
    image: product.main_image_url || "",
    trendScore: Math.round(product.trend_score),
    soldCount: Math.round(product.urgency_score * 1.5)
  }));

  return (
    <div className="bg-tiktok-black min-h-screen">
      <Header />
      <PremiumHero />
      <FeaturedProducts products={formattedProducts} />
      <HowItWorks />
      <AllProducts products={formattedProducts} />
      <SocialProof />
      <TrustBadges />
      <Newsletter />
      <Footer />
    </div>
  );
}
