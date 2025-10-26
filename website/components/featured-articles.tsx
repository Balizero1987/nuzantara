import { getFeaturedArticles } from "@/lib/api"
import { ArticleCard } from "@/components/article/article-card"

export async function FeaturedArticles() {
  const articles = await getFeaturedArticles(6)

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto lg:px-[6%]">
        {/* Asymmetric Layout */}
        <div className="space-y-8">
          {/* Featured Article - Large Block */}
          {articles.length > 0 && (
            <div className="w-full">
              <ArticleCard 
                key={articles[0].slug} 
                article={articles[0]} 
                variant="featured"
              />
            </div>
          )}

          {/* Secondary Articles - Asymmetric Grid */}
          {articles.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Medium Block - Left */}
              {articles[1] && (
                <div className="md:col-span-1 lg:col-span-2">
                  <ArticleCard 
                    key={articles[1].slug} 
                    article={articles[1]} 
                    variant="medium"
                  />
                </div>
              )}
              
              {/* Small Block - Right */}
              {articles[2] && (
                <div className="md:col-span-1 lg:col-span-1">
                  <ArticleCard 
                    key={articles[2].slug} 
                    article={articles[2]} 
                    variant="small"
                  />
                </div>
              )}
              
              {/* Small Block - Right */}
              {articles[3] && (
                <div className="md:col-span-1 lg:col-span-1">
                  <ArticleCard 
                    key={articles[3].slug} 
                    article={articles[3]} 
                    variant="small"
                  />
                </div>
              )}
            </div>
          )}

          {/* Third Row - Mixed Sizes */}
          {articles.length > 4 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.slice(4, 6).map((article, index) => (
                <div key={article.slug} className={index === 0 ? "md:col-span-2" : "md:col-span-1"}>
                  <ArticleCard 
                    article={article} 
                    variant={index === 0 ? "medium" : "small"}
                  />
                </div>
              ))}
            </div>
          )}
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
