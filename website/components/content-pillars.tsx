import type React from "react"
import { TrendingUp, Zap, Globe, Brain } from "lucide-react"

interface Pillar {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const pillars: Pillar[] = [
  {
    id: "1",
    title: "Market Intelligence",
    description:
      "Deep analysis of regional and global market trends, competitive landscapes, and emerging opportunities.",
    icon: <TrendingUp size={32} />,
    color: "text-red",
  },
  {
    id: "2",
    title: "AI & Innovation",
    description: "Cutting-edge insights on artificial intelligence, machine learning, and transformative technologies.",
    icon: <Brain size={32} />,
    color: "text-red",
  },
  {
    id: "3",
    title: "Strategic Leadership",
    description:
      "Executive guidance on organizational transformation, digital strategy, and future-ready business models.",
    icon: <Zap size={32} />,
    color: "text-red",
  },
  {
    id: "4",
    title: "Global Perspectives",
    description:
      "International insights connecting Southeast Asian markets with global economic and geopolitical trends.",
    icon: <Globe size={32} />,
    color: "text-red",
  },
]

export function ContentPillars() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-red font-serif font-bold text-sm tracking-widest">OUR EXPERTISE</span>
          <h2 className="text-white font-serif font-bold text-4xl md:text-5xl mt-4">Content Pillars</h2>
          <p className="text-white/70 font-sans text-lg mt-4 max-w-2xl mx-auto">
            Bali Zero Insights covers the most critical areas shaping business and innovation in Southeast Asia and
            beyond.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="group p-6 bg-black rounded-lg border border-white/10 hover:border-red transition-all duration-300 hover:shadow-lg hover:shadow-red/20 cursor-pointer"
            >
              {/* Icon */}
              <div className={`${pillar.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {pillar.icon}
              </div>

              {/* Title */}
              <h3 className="text-white font-serif font-bold text-xl mb-3 group-hover:text-red transition-colors">
                {pillar.title}
              </h3>

              {/* Description */}
              <p className="text-white/70 font-sans text-sm leading-relaxed">{pillar.description}</p>

              {/* Bottom accent line */}
              <div className="mt-4 h-1 w-0 bg-red group-hover:w-full transition-all duration-300"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-white/70 font-sans text-lg mb-6">Explore our full range of research and analysis</p>
          <button className="bg-red text-black px-8 py-3 font-serif font-bold hover:bg-red/90 transition-colors hover:shadow-[0_0_30px_rgba(255,0,0,0.6)]">
            Browse All Topics
          </button>
        </div>
      </div>
    </section>
  )
}
