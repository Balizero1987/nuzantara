import type { Article } from "@/lib/articles"
import { formatDate } from "@/lib/utils/date"
import { getCategoryBySlug } from "@/lib/categories"

interface ArticleHeroProps {
  article: Article
}

export function ArticleHero({ article }: ArticleHeroProps) {
  const category = getCategoryBySlug(article.category)

  return (
    <section className="relative w-full">
      {/* Hero Image */}
      <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pb-12 md:pb-16 w-full">
            {/* Category tag */}
            {category && (
              <div className="inline-block bg-red px-4 py-2 mb-6">
                <span className="text-black font-serif font-bold text-sm tracking-widest uppercase">
                  {category.name}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              {article.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-white/70 font-sans text-sm md:text-base">
              <span>By {article.author || 'Bali Zero Team'}</span>
              <span>•</span>
              <span>{formatDate(article.publishedAt)}</span>
              <span>•</span>
              <span>{article.readTime} min read</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
