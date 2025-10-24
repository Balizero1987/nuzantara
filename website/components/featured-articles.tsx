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
    title: "Your Journey to Indonesian Residency: A Complete KITAS Guide",
    category: "Immigration",
    excerpt: "From tourist dreams to permanent residence—discover the pathway that transformed thousands of expats into Indonesian residents. Navigate visas, KITAS applications, and sponsorship with clarity and confidence.",
    image: "/leadership-executive-management.jpg",
    size: "large",
    featured: true,
  },
  {
    id: "2",
    title: "ZANTARA Meets AI: Indonesia's Cultural Intelligence Revolution",
    category: "AI Insights",
    excerpt: "Where gotong royong meets machine learning—the future of business in Bali.",
    image: "/ai-southeast-asia-market-analysis.jpg",
    size: "small",
  },
  {
    id: "3",
    title: "Building Your PT PMA: From Paperwork to Prosperity",
    category: "Business",
    excerpt: "The entrepreneur's roadmap to launching a foreign-owned company in Indonesia—legal structure, capital requirements, and the hidden secrets of successful setup.",
    image: "/sustainable-business-green-technology.jpg",
    size: "small",
  },
  {
    id: "4",
    title: "The Import-Export Playbook: Navigating Indonesian Trade Laws",
    category: "Business",
    excerpt: "Customs, permits, and logistics—master the art of moving goods across Indonesian borders while staying compliant and profitable.",
    image: "/supply-chain-logistics-network.jpg",
    size: "medium",
  },
  {
    id: "5",
    title: "Property Ownership in Paradise: What Foreigners Can (and Can't) Buy",
    category: "Property",
    excerpt: "Leasehold vs. freehold, nominee structures, and the truth about owning Bali real estate—your complete guide to Indonesian property law.",
    image: "/emerging-markets-investment-finance.jpg",
    size: "small",
  },
  {
    id: "6",
    title: "Indonesian Tax Decoded: Your Essential Guide to Compliance & Savings",
    category: "Tax & Legal",
    excerpt: "Understanding NPWP registration, corporate tax rates, and the strategies that keep your business compliant while maximizing deductions in Indonesia's evolving tax landscape.",
    image: "/digital-transformation.png",
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
      className={`${sizeClasses[article.size]} group relative overflow-hidden bg-navy rounded-lg cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] hover:scale-[1.02] border border-cream/10 hover:border-red/50`}
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
          <span className="inline-block text-red text-xs font-bold tracking-widest mb-3 border-l-2 border-gold pl-3">
            {article.category.toUpperCase()}
          </span>
        </div>

        <div className="space-y-3">
          <h3 className="text-off-white font-serif font-bold text-lg md:text-2xl leading-tight group-hover:text-gold transition-colors duration-300">
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
          <span className="text-red font-serif font-bold text-sm tracking-widest">FEATURED STORIES</span>
          <h2 className="text-off-white font-serif font-bold text-4xl md:text-5xl mt-2">
            Your Path to <span className="text-gold">Indonesian Success</span>
          </h2>
          <p className="text-cream/80 font-sans text-lg mt-4 max-w-3xl">
            Real insights from the Bali Zero community—immigration, business, tax, property, and AI innovation in Indonesia.
          </p>
        </div>

        {/* Articles Grid - Asymmetric Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[300px] md:auto-rows-[350px]">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-12 flex justify-center">
          <button className="border-2 border-gold text-gold px-8 py-3 font-serif font-bold hover:bg-red hover:text-black hover:border-red transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,0,0,0.6)]">
            Explore All Stories
          </button>
        </div>
      </div>
    </section>
  )
}
