import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturedArticles } from "@/components/featured-articles"
import { ContentPillars } from "@/components/content-pillars"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="bg-black">
      <Header />
      <HeroSection />
      <FeaturedArticles />
      <ContentPillars />
      <CTASection />
      <Footer />
    </main>
  )
}
