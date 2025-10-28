import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { BaliZeroJournal } from "@/components/bali-zero-journal"
import { FeaturedArticles } from "@/components/featured-articles"
import { ThresholdSection } from "@/components/threshold-section"
import { ContentPillars } from "@/components/content-pillars"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="bg-black batik-pattern">
      <Header />
      <HeroSection />
      {/* <BaliZeroJournal /> - Rimosso */}
      <FeaturedArticles />
      <ThresholdSection />
      <ContentPillars />
      <CTASection />
      <Footer />
    </main>
  )
}
