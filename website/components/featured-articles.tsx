import { ArrowRight } from "lucide-react"

interface Article {
  id: string
  title: string
  category: string
  excerpt: string
  image: string
  size: "large" | "small" | "medium"
  readTime: string
}

// Indonesian-focused articles with journey narratives
const articles: Article[] = [
  {
    id: "1",
    title: "From Zero to PT PMA: Marco's 120-Day Journey in Bali",
    category: "Building in Bali",
    excerpt: "How an Italian entrepreneur built his dream company in Indonesia — navigating bureaucracy, culture, and community with ZANTARA's guidance.",
    image: "/placeholder.svg", // Will be replaced with ImagineArt image
    size: "large",
    readTime: "8 min read",
  },
  {
    id: "2",
    title: "Understanding Tri Hita Karana: Harmony in Business",
    category: "Cultural Intelligence",
    excerpt: "The Balinese philosophy that transforms how you work, live, and build relationships in Indonesia.",
    image: "/placeholder.svg",
    size: "small",
    readTime: "5 min read",
  },
  {
    id: "3",
    title: "Your Complete KITAS Checklist (2025 Update)",
    category: "The Visa Journey",
    excerpt: "Everything you need for your Indonesian residence permit — with warmth, not just bureaucracy.",
    image: "/placeholder.svg",
    size: "small",
    readTime: "6 min read",
  },
  {
    id: "4",
    title: "Finding Your Bali Home: From Canggu to Ubud",
    category: "Finding Home",
    excerpt: "A neighborhood guide for expats — where digital nomads, families, and entrepreneurs find their place in paradise.",
    image: "/placeholder.svg",
    size: "medium",
    readTime: "10 min read",
  },
]

function ArticleCard({ article }: { article: Article }) {
  const sizeClasses = {
    large: "col-span-1 md:col-span-2 row-span-2 md:aspect-[3/4]", // 66% width, tall
    medium: "col-span-1 md:col-span-2 row-span-1 aspect-video", // 50% width on mobile, full on desktop
    small: "col-span-1 row-span-1 aspect-square", // 33% width, square
  }

  return (
    <article
      className={`${sizeClasses[article.size]} group relative overflow-hidden bg-[#1a1f3a] rounded-lg cursor-pointer transition-all duration-500 hover:shadow-2xl glow-red-subtle hover:glow-red-medium`}
    >
      {/* Image with overlay */}
      <div className="absolute inset-0">
        <img
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 group-hover:via-black/60 transition-all duration-500"></div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between z-10">
        {/* Category + Read Time */}
        <div className="flex items-center justify-between">
          <span className="inline-block text-[#FF0000] text-xs font-bold tracking-widest uppercase bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
            {article.category}
          </span>
          <span className="text-[#e8d5b7]/80 text-xs font-sans bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
            {article.readTime}
          </span>
        </div>

        {/* Title + Excerpt */}
        <div className="space-y-3">
          <h3 className="text-[#f5f5f5] font-serif font-bold text-xl md:text-2xl lg:text-3xl leading-tight group-hover:text-[#FF0000] transition-colors duration-300">
            {article.title}
          </h3>

          {/* Excerpt - only show on large/medium cards */}
          {(article.size === "large" || article.size === "medium") && (
            <p className="text-[#f5f5f5]/80 font-sans text-sm md:text-base leading-relaxed line-clamp-2 md:line-clamp-3">
              {article.excerpt}
            </p>
          )}

          {/* Read More CTA */}
          <div className="flex items-center gap-2 text-[#FF0000] font-sans font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            Read Journey
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer pointer-events-none"></div>

      {/* Indonesian decorative accent (top-right corner) */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </article>
  )
}

export function FeaturedArticles() {
  return (
    <section className="relative py-24 px-4 md:px-6 lg:px-8 bg-black">
      {/* Subtle background elements */}
      <div className="absolute inset-0 batik-pattern opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="mb-12">
          <span className="text-[#D4AF37] font-serif font-bold text-sm tracking-widest uppercase">
            Journey Stories & Insights
          </span>
          <h2 className="text-[#f5f5f5] font-serif font-bold text-4xl md:text-5xl mt-2">
            Latest from the Community
          </h2>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-px w-16 bg-gradient-to-r from-[#FF0000] to-transparent"></div>
            <span className="text-[#e8d5b7] text-sm font-sans italic">
              Real stories, practical wisdom
            </span>
          </div>
        </div>

        {/* Articles Grid - McKinsey Asymmetric Layout */}
        {/*
          GRID STRUCTURE:
          Row 1: [LARGE 2cols x 2rows] [SMALL 1col x 1row]
                                        [SMALL 1col x 1row]
          Row 2: [MEDIUM 2cols x 1row centered]
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px] md:auto-rows-[320px]">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {/* View All Button - Warm Invitation */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <p className="text-[#f5f5f5]/70 font-serif text-lg italic max-w-xl text-center">
            Every article is a conversation, every guide a companion.
            <br />
            Join thousands finding their way in Indonesia.
          </p>

          <button className="group border-2 border-[#e8d5b7] text-[#e8d5b7] px-10 py-4 font-serif font-bold hover:bg-[#e8d5b7] hover:text-black transition-all duration-300">
            <span className="flex items-center gap-2">
              View All Journeys
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
