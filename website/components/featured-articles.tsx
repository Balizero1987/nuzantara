import { ArrowRight } from "lucide-react"

interface Article {
  id: string
  title: string
  category: string
  excerpt: string
  image: string
  size: "large" | "small" | "medium"
  featured?: boolean
}

const articles: Article[] = [
  {
    id: "1",
    title: "The Future of AI in Southeast Asian Markets",
    category: "Intelligence",
    excerpt: "How artificial intelligence is reshaping business landscapes across the region.",
    image: "/ai-southeast-asia-market-analysis.jpg",
    size: "large",
    featured: true,
  },
  {
    id: "2",
    title: "Digital Transformation Trends 2025",
    category: "Research",
    excerpt: "Key insights on enterprise modernization.",
    image: "/digital-transformation.png",
    size: "small",
  },
  {
    id: "3",
    title: "Sustainable Business Models",
    category: "Insights",
    excerpt: "Building profitable enterprises with environmental responsibility.",
    image: "/sustainable-business-green-technology.jpg",
    size: "small",
  },
  {
    id: "4",
    title: "Supply Chain Resilience in Crisis",
    category: "Analysis",
    excerpt: "Strategic approaches to building robust supply networks.",
    image: "/supply-chain-logistics-network.jpg",
    size: "medium",
  },
  {
    id: "5",
    title: "Emerging Markets Investment Guide",
    category: "Intelligence",
    excerpt: "Opportunities and risks in high-growth economies.",
    image: "/emerging-markets-investment-finance.jpg",
    size: "small",
  },
  {
    id: "6",
    title: "Leadership in the AI Era",
    category: "Insights",
    excerpt: "How executives are adapting to rapid technological change.",
    image: "/leadership-executive-management.jpg",
    size: "medium",
  },
]

function ArticleCard({ article }: { article: Article }) {
  const sizeClasses = {
    large: "col-span-1 md:col-span-2 row-span-2",
    medium: "col-span-1 md:col-span-2 row-span-1",
    small: "col-span-1 row-span-1",
  }

  return (
    <article
      className={`${sizeClasses[article.size]} group relative overflow-hidden bg-navy rounded-lg cursor-pointer transition-all duration-300 hover:shadow-2xl`}
    >
      {/* Image */}
      <div className="absolute inset-0">
        <img
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-70 transition-opacity"></div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-between">
        <div>
          <span className="inline-block text-red text-xs font-bold tracking-widest mb-3">{article.category}</span>
        </div>

        <div className="space-y-3">
          <h3 className="text-cream font-serif font-bold text-lg md:text-2xl leading-tight group-hover:text-red transition-colors">
            {article.title}
          </h3>
          {article.size !== "small" && (
            <p className="text-cream/70 font-sans text-sm md:text-base leading-relaxed hidden md:block">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center gap-2 text-red font-sans font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Read More <ArrowRight size={16} />
          </div>
        </div>
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shimmer"></div>
    </article>
  )
}

export function FeaturedArticles() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <span className="text-red font-serif font-bold text-sm tracking-widest">FEATURED CONTENT</span>
          <h2 className="text-cream font-serif font-bold text-4xl md:text-5xl mt-2">Latest Insights</h2>
        </div>

        {/* Articles Grid - Asymmetric Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[300px] md:auto-rows-[350px]">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-12 flex justify-center">
          <button className="border border-cream text-cream px-8 py-3 font-serif font-bold hover:bg-cream hover:text-black transition-colors">
            View All Articles
          </button>
        </div>
      </div>
    </section>
  )
}
