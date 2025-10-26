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
        {/* Asymmetric Layout - Puzzle compatto con posizionamento esplicito */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-0.5 auto-rows-[125px]">
          {/* Yellow (Bali Floods) - colonna 1-2, righe 2-6 (5 rows, spostato su di 0.5) */}
          {articles[0] && (
            <div className="lg:col-span-2 lg:col-start-1 lg:row-span-5 lg:row-start-2 lg:-mt-[62.5px]">
              <ArticleCard
                article={articles[0]}
                variant="medium"
              />
            </div>
          )}

          {/* Blue (Airport) - colonna 3-4, righe 2-7 (6 rows, spostato giù di 1) */}
          {articles[1] && (
            <div className="lg:col-span-2 lg:col-start-3 lg:row-span-6 lg:row-start-2">
              <ArticleCard
                article={articles[1]}
                variant="featured"
              />
            </div>
          )}

          {/* Red (Telkom) - colonna 5-6, righe 0-6, allungato verso alto, ridotto 0.5 in basso */}
          {articles[2] && (
            <div className="lg:col-span-2 lg:col-start-5 lg:row-span-7 lg:row-start-0 lg:-mt-[62.5px] lg:pb-[62.5px]">
              <ArticleCard
                article={articles[2]}
                variant="featured"
              />
            </div>
          )}

          {/* Green (SKPL/Alcohol) - colonna 1-4, righe 8-12, ridotto 0.2 da destra */}
          {articles[3] && (
            <div className="lg:col-span-4 lg:col-start-1 lg:row-span-5 lg:row-start-8 lg:pr-[25px]">
              <ArticleCard
                article={articles[3]}
                variant="large"
              />
            </div>
          )}

          {/* Azzurro (OSS) - colonna 5-6, righe 8-12, spostato 0.4 in alto totale */}
          {articles[4] && (
            <div className="lg:col-span-2 lg:col-start-5 lg:row-span-5 lg:row-start-8 lg:-mt-[50px]">
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
