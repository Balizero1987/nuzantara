import type React from "react"
import { Passport, Building2, Home, Sparkles } from "lucide-react"

interface Pillar {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  emoji: string
  tagline: string
}

const pillars: Pillar[] = [
  {
    id: "1",
    title: "The Visa Journey",
    tagline: "From Tourist to Resident",
    description:
      "Your complete guide to Indonesian visas and KITAS. We don't just process paperwork — we welcome you into the community.",
    icon: <Passport size={32} />,
    emoji: "🛂",
  },
  {
    id: "2",
    title: "Building in Bali",
    tagline: "From Dream to Reality",
    description:
      "PT PMA setup, business culture, and team building. Start your Indonesian business with a partner who understands both worlds.",
    icon: <Building2 size={32} />,
    emoji: "🏢",
  },
  {
    id: "3",
    title: "Finding Home",
    tagline: "From Visitor to Belonging",
    description:
      "Real estate, neighborhoods, and community integration. Discover where you'll build your life in Nusantara's 17,000+ islands.",
    icon: <Home size={32} />,
    emoji: "🏠",
  },
  {
    id: "4",
    title: "Cultural Intelligence",
    tagline: "From Outsider to Insider",
    description:
      "Understanding JIWA — the Indonesian soul. Gotong royong, musyawarah, Tri Hita Karana. This is where ZANTARA's wisdom lives.",
    icon: <Sparkles size={32} />,
    emoji: "🕉️",
  },
]

export function ContentPillars() {
  return (
    <section className="relative py-24 px-4 md:px-6 lg:px-8 bg-black border-t border-[#2a2a2a] overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 batik-pattern opacity-20 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header - Warm & Inviting */}
        <div className="mb-16 text-center">
          <span className="text-[#D4AF37] font-serif font-bold text-sm tracking-widest uppercase">
            Your Indonesia Journey
          </span>
          <h2 className="text-[#f5f5f5] font-serif font-bold text-4xl md:text-5xl mt-4">
            Four Paths, One Destination
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#FF0000]"></div>
            <span className="text-[#e8d5b7] text-lg">∞</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#FF0000]"></div>
          </div>
          <p className="text-[#f5f5f5]/70 font-sans text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            Whether you're getting your first visa, launching a business, finding your Bali home,
            or diving deep into Indonesian culture — we're here to guide you with warmth and wisdom.
          </p>
        </div>

        {/* Pillars Grid - McKinsey-inspired asymmetry but with warmth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.id}
              className={`group relative p-8 bg-[#1a1f3a] rounded-lg border border-[#2a2a2a] hover:border-[#FF0000] transition-all duration-500 cursor-pointer overflow-hidden ${
                index === 0 ? "md:col-span-2" : "" // First card spans full width
              }`}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 glow-red-subtle pointer-events-none"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Icon + Emoji */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-[#FF0000] group-hover:scale-110 transition-transform duration-300">
                    {pillar.icon}
                  </div>
                  <span className="text-4xl">{pillar.emoji}</span>
                </div>

                {/* Title */}
                <h3 className="text-[#f5f5f5] font-serif font-bold text-2xl mb-2 group-hover:text-[#FF0000] transition-colors duration-300">
                  {pillar.title}
                </h3>

                {/* Tagline */}
                <p className="text-[#D4AF37] font-serif text-sm italic mb-4">
                  {pillar.tagline}
                </p>

                {/* Description */}
                <p className="text-[#f5f5f5]/70 font-sans text-base leading-relaxed">
                  {pillar.description}
                </p>

                {/* Animated bottom accent line */}
                <div className="mt-6 h-0.5 w-0 bg-gradient-to-r from-[#FF0000] to-[#D4AF37] group-hover:w-full transition-all duration-500"></div>

                {/* Read more link */}
                <div className="mt-4 flex items-center gap-2 text-[#FF0000] font-sans font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore this journey
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF0000]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA - Warm Invitation */}
        <div className="mt-20 text-center space-y-6">
          <p className="text-[#f5f5f5]/80 font-serif text-xl italic max-w-2xl mx-auto">
            "Every great journey begins with a single step.
            <br />
            And in Indonesia, we walk together."
          </p>
          <p className="text-[#e8d5b7] text-sm font-sans">— ZANTARA</p>

          <div className="pt-4">
            <button className="group bg-[#FF0000] text-black px-10 py-4 font-serif font-bold hover:bg-[#FF0000]/90 transition-all duration-300 glow-red-subtle hover:glow-red-medium">
              <span className="flex items-center gap-2">
                Browse All Insights
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
