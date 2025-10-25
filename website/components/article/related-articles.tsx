import Link from "next/link"
import type { Article } from "@/lib/articles"
import { formatDate } from "@/lib/utils/date"

interface RelatedArticlesProps {
  articles: Article[]
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (!articles || articles.length === 0) return null

  return (
    <section className="border-t border-white/10 bg-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-20">
        {/* Section header */}
        <div className="mb-12">
          <h2 className="text-white font-serif font-bold text-3xl md:text-4xl mb-3">
            You Might Also Like
          </h2>
          <p className="text-white/60 font-sans text-lg">
            Continue exploring related insights
          </p>
        </div>

        {/* Related articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/article/${article.slug}`}
              className="group"
            >
              <article className="flex flex-col h-full">
                {/* Image */}
                <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg border border-white/10 group-hover:border-red/70 transition-colors duration-300 mb-4">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Category badge */}
                  <div className="absolute top-3 left-3 bg-black/80 border border-red/50 px-2 py-1 text-xs font-serif font-bold text-red">
                    {article.category.toUpperCase().replace('-', ' ')}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-white font-serif font-bold text-xl leading-snug mb-3 group-hover:text-red transition-colors">
                    {article.title}
                  </h3>

                  <div className="flex items-center gap-2 text-white/50 font-sans text-sm">
                    <span>{formatDate(article.publishedAt)}</span>
                    <span>•</span>
                    <span>{article.readTime} min</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
