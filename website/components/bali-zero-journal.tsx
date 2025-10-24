import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface MagazineArticle {
  id: string
  title: string
  subtitle?: string
  category: string
  image: string
  publishedDate: string
  size: "hero" | "featured" | "standard"
}

// MANUAL CURATION: Update this array after each Intel Scraping run
// Select max 4-5 most impactful articles from all categories
const magazineArticles: MagazineArticle[] = [
  {
    id: "1",
    title: "Indonesia's Free Meal Program",
    subtitle: "Safety Crisis Threatens 90M Beneficiaries",
    category: "Policy Alert",
    image: "/bali-zero-journal-cover-1.jpg", // Generate with ImagineArt
    publishedDate: "2025-10-24",
    size: "hero", // Large hero article - takes 60% width
  },
  {
    id: "2",
    title: "New Immigration Reforms",
    subtitle: "Simplified Visa Process Effective August 2025",
    category: "Immigration",
    image: "/bali-zero-journal-cover-2.jpg",
    publishedDate: "2025-10-24",
    size: "featured", // Medium featured - 40% width
  },
  {
    id: "3",
    title: "Military Tribunal Law Under Fire",
    subtitle: "Concerns Over Lenient TNI Sentences",
    category: "Legal",
    image: "/bali-zero-journal-cover-3.jpg",
    publishedDate: "2025-10-24",
    size: "standard", // Small standard - 50% width
  },
  {
    id: "4",
    title: "Bali Tourism Safety Alert",
    subtitle: "Russian Influencer Kidnapping Incident",
    category: "Safety",
    image: "/bali-zero-journal-cover-4.jpg",
    publishedDate: "2025-10-24",
    size: "standard", // Small standard - 50% width
  },
]

function MagazineCoverArticle({ article }: { article: MagazineArticle }) {
  const sizeStyles = {
    hero: "col-span-1 md:col-span-3 row-span-2 h-[500px] md:h-[700px]",
    featured: "col-span-1 md:col-span-2 row-span-2 h-[500px] md:h-[700px]",
    standard: "col-span-1 md:col-span-2 row-span-1 h-[300px] md:h-[340px]",
  }

  return (
    <Link
      href={`/journal/${article.id}`}
      className={`${sizeStyles[article.size]} group relative overflow-hidden cursor-pointer transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(255,0,0,0.5)]`}
    >
      {/* Image Background */}
      <div className="absolute inset-0">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        {/* Premium gradient overlay - breathing space */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-85 group-hover:opacity-75 transition-opacity duration-700"></div>
      </div>

      {/* Content - Minimal & Impactful */}
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
        {/* Category Badge */}
        <span className="inline-block w-fit text-red font-serif font-bold text-xs tracking-[0.2em] mb-6 border-l-4 border-red pl-4 uppercase">
          {article.category}
        </span>

        {/* Title - Bold & Readable */}
        <h2 className="text-white font-serif font-bold text-3xl md:text-5xl lg:text-6xl leading-tight mb-4 group-hover:text-red transition-colors duration-500">
          {article.title}
        </h2>

        {/* Subtitle - Breathing space */}
        {article.subtitle && (
          <p className="text-cream/90 font-sans text-lg md:text-xl lg:text-2xl leading-relaxed mb-6 max-w-3xl">
            {article.subtitle}
          </p>
        )}

        {/* Date & CTA */}
        <div className="flex items-center justify-between">
          <span className="text-cream/70 font-sans text-sm tracking-wide">
            {new Date(article.publishedDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <div className="flex items-center gap-3 text-red font-sans font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            Read Full Report
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
          </div>
        </div>
      </div>

      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-red/30 transition-all duration-700 pointer-events-none"></div>
    </Link>
  )
}

export function BaliZeroJournal() {
  return (
    <section className="py-24 px-4 md:px-6 lg:px-8 bg-black relative overflow-hidden">
      {/* Premium background treatment */}
      <div className="absolute inset-0 batik-pattern opacity-30"></div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Magazine Header - Breathing space */}
        <div className="mb-16 text-center">
          <span className="text-red font-serif font-bold text-sm tracking-[0.3em] uppercase">
            Bali Zero Intelligence
          </span>
          <h1 className="text-white font-serif font-bold text-5xl md:text-7xl lg:text-8xl mt-4 mb-6">
            The Journal
          </h1>
          <p className="text-cream/80 font-sans text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Curated intelligence reports for expats and entrepreneurs in Indonesia
          </p>
          <div className="h-px w-64 bg-gradient-to-r from-transparent via-red to-transparent mx-auto mt-12"></div>
        </div>

        {/* McKinsey-style Asymmetric Grid - Maximum breathing space */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10 auto-rows-auto mb-16">
          {/* First row: Hero (3 cols) + Featured (2 cols) */}
          {magazineArticles.slice(0, 2).map((article) => (
            <MagazineCoverArticle key={article.id} article={article} />
          ))}
        </div>

        {/* Second row: Two standard articles (2.5 cols each) */}
        {magazineArticles.length > 2 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10">
            {magazineArticles.slice(2, 4).map((article) => (
              <MagazineCoverArticle key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Archive CTA - Breathing space */}
        <div className="mt-24 text-center">
          <Link
            href="/journal/archive"
            className="inline-block border-2 border-red text-red px-12 py-5 font-serif font-bold text-lg hover:bg-red hover:text-white transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)]"
          >
            View All Reports
          </Link>
        </div>
      </div>
    </section>
  )
}
