import { getFeaturedArticles } from "@/lib/api"
import { ArticleCard } from "@/components/article/article-card"

export async function FeaturedArticles() {
  const articles = await getFeaturedArticles(6)

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto lg:px-[6%]">
        {/* Uniform Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-16 flex justify-center">
          <button className="border-2 border-red text-red px-10 py-4 font-serif font-bold tracking-tight hover:bg-red hover:text-black transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.7)]">
            Explore All Stories
          </button>
        </div>
      </div>
    </section>
  )
}
