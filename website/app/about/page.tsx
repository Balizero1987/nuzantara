import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Brain, Target, Globe, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "About Us | Bali Zero",
  description: "Learn about Bali Zero's mission to bridge Indonesia and the world through intelligence and insights powered by ZANTARA AI.",
}

export default function AboutPage() {
  return (
    <main className="batik-pattern min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-white font-serif font-bold text-5xl md:text-6xl lg:text-7xl mb-8">
            Bridging Indonesia and the World
          </h1>
          <p className="text-white/70 font-sans text-xl md:text-2xl leading-relaxed">
            Through intelligence, insights, and cultural understanding
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-red font-serif font-bold text-sm tracking-widest mb-4">OUR MISSION</h2>
          <p className="text-white font-sans text-lg md:text-xl leading-relaxed mb-6">
            Bali Zero was founded in 2019 with a singular mission: to make Indonesia accessible to entrepreneurs and
            expats through education and professional services.
          </p>
          <p className="text-white/80 font-sans text-lg leading-relaxed mb-6">
            We recognized a gap in the market—high-quality, trustworthy information about Indonesian business, immigration,
            and legal systems was scattered, outdated, or simply didn't exist in accessible formats.
          </p>
          <p className="text-white/80 font-sans text-lg leading-relaxed">
            Today, we serve thousands of readers monthly through our blog and hundreds of clients through our professional
            services, becoming the trusted bridge between Indonesia and the global community.
          </p>
        </div>
      </section>

      {/* ZANTARA AI Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-red/20 border-2 border-red flex items-center justify-center">
                  <Brain className="w-8 h-8 text-red" />
                </div>
                <div>
                  <h2 className="text-white font-serif font-bold text-3xl md:text-4xl">
                    Powered by ZANTARA
                  </h2>
                  <p className="text-white/60 font-sans">Culturally Intelligent AI</p>
                </div>
              </div>

              <p className="text-white/80 font-sans text-lg leading-relaxed mb-6">
                At the heart of Bali Zero is ZANTARA—our proprietary AI system that combines cutting-edge technology with
                deep cultural intelligence. ZANTARA doesn't just translate information; it understands context, nuance, and
                the unique intersection of Indonesian and international business cultures.
              </p>

              <p className="text-white/80 font-sans text-lg leading-relaxed">
                This cultural intelligence framework powers everything we do, from content creation to client service delivery,
                ensuring that our insights are not just accurate, but truly meaningful.
              </p>
            </div>

            {/* Right: ZANTARA Visual */}
            <div className="relative h-96 rounded-lg overflow-hidden border border-white/10">
              <img
                src="/zantara.jpg"
                alt="ZANTARA AI Technology"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white font-serif font-bold text-3xl md:text-4xl text-center mb-12">
            What Drives Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Value 1 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-lg hover:border-red/30 transition-colors">
              <Target className="w-10 h-10 text-red mb-4" />
              <h3 className="text-white font-serif font-bold text-xl mb-3">
                Education First
              </h3>
              <p className="text-white/70 font-sans leading-relaxed">
                We believe informed decision-making starts with quality education. Our content prioritizes clarity,
                accuracy, and actionable insights over marketing fluff.
              </p>
            </div>

            {/* Value 2 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-lg hover:border-red/30 transition-colors">
              <Globe className="w-10 h-10 text-red mb-4" />
              <h3 className="text-white font-serif font-bold text-xl mb-3">
                Cultural Bridge
              </h3>
              <p className="text-white/70 font-sans leading-relaxed">
                We don't just explain Indonesian systems—we help you understand the cultural context that makes them work.
                True success comes from cultural fluency, not just legal compliance.
              </p>
            </div>

            {/* Value 3 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-lg hover:border-red/30 transition-colors">
              <Zap className="w-10 h-10 text-red mb-4" />
              <h3 className="text-white font-serif font-bold text-xl mb-3">
                Innovation & Technology
              </h3>
              <p className="text-white/70 font-sans leading-relaxed">
                From AI-powered content to streamlined service delivery, we leverage technology to make complex processes
                simple and accessible for everyone.
              </p>
            </div>

            {/* Value 4 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-lg hover:border-red/30 transition-colors">
              <Brain className="w-10 h-10 text-red mb-4" />
              <h3 className="text-white font-serif font-bold text-xl mb-3">
                Continuous Learning
              </h3>
              <p className="text-white/70 font-sans leading-relaxed">
                Indonesian regulations evolve constantly. We stay ahead of changes, ensuring our community always has
                the most current, relevant information at their fingertips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-white font-serif font-bold text-3xl md:text-4xl mb-6">
            Let's Connect
          </h2>

          <div className="space-y-4 text-white/70 font-sans text-lg mb-8">
            <p>
              <strong className="text-white">For Professional Services:</strong><br />
              <a href="https://balizero.com" className="text-red hover:text-gold transition-colors">
                balizero.com
              </a>
            </p>
            <p>
              <strong className="text-white">For Partnership Inquiries:</strong><br />
              <a href="mailto:partnerships@balizero.com" className="text-red hover:text-gold transition-colors">
                partnerships@balizero.com
              </a>
            </p>
            <p>
              <strong className="text-white">For Media & Press:</strong><br />
              <a href="mailto:press@balizero.com" className="text-red hover:text-gold transition-colors">
                press@balizero.com
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
