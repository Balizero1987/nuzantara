import type { Article } from "@/lib/articles"
import { ArticleCard } from "@/components/article/article-card"

interface CategoryGridProps {
  articles: Article[]
}

export function CategoryGrid({ articles }: CategoryGridProps) {
  if (!articles || articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 text-center">
        <p className="text-white/60 font-sans text-lg">
          No articles found in this category yet. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <section className="bg-black py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}
