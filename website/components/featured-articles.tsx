import { getFeaturedArticles } from "@/lib/api"
import { ArticleCard } from "@/components/article/article-card"

export async function FeaturedArticles() {
  const allArticles = await getFeaturedArticles(6)

  // Custom order: Bali Floods, Airport, Telkom, SKPL, OSS
  const desiredOrder = [
    'bali-floods-overtourism-reckoning',
    'north-bali-airport-decade-promises',
    'telkom-ai-campus',
    'skpl-alcohol-license-bali-complete-guide',
    'oss-2-migration-deadline-indonesia'
  ]

  const articles = desiredOrder
    .map(slug => allArticles.find(a => a.slug === slug))
    .filter(Boolean)

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto lg:px-[6%]">
        {/* Asymmetric Layout - Custom Design */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 auto-rows-[180px]">
          {/* Yellow (Bali Floods) - esteso verso il basso */}
          {articles[0] && (
            <div className="lg:col-span-2 lg:row-span-8">
              <ArticleCard
                article={articles[0]}
                variant="medium"
              />
            </div>
          )}

          {/* Blue (Airport) - più spazio immagine */}
          {articles[1] && (
            <div className="lg:col-span-2 lg:row-span-5 mt-[1.5cm]">
              <ArticleCard
                article={articles[1]}
                variant="featured"
              />
            </div>
          )}

          {/* Red (Telkom) - più spazio immagine */}
          {articles[2] && (
            <div className="lg:col-span-2 lg:row-span-7">
              <ArticleCard
                article={articles[2]}
                variant="featured"
              />
            </div>
          )}

          {/* Green (SKPL/Alcohol) - spostato più in alto */}
          {articles[3] && (
            <div className="lg:col-span-4 lg:row-span-4 -mt-[10cm]">
              <ArticleCard
                article={articles[3]}
                variant="large"
              />
            </div>
          )}

          {/* Azzurro (OSS) - spostato più in alto */}
          {articles[4] && (
            <div className="lg:col-span-2 lg:row-span-4 -mt-[10cm]">
              <ArticleCard
                article={articles[4]}
                variant="small"
              />
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
