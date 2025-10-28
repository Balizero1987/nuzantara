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
    <section className="py-8 md:py-16 px-4 md:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto lg:px-[6%]">
        {/* Mobile-First: Stack layout for mobile, puzzle for desktop */}
        <div className="grid grid-cols-1 gap-6 md:gap-4 lg:grid-cols-6 lg:gap-0.5 lg:auto-rows-[125px]">
          {/* Mobile: Standard card layout, Desktop: Puzzle layout */}
          
          {/* Bali Floods - Hero article on mobile, yellow position on desktop */}
          {articles[0] && (
            <div className="md:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-span-5 lg:row-start-2 lg:-mt-[62.5px]">
              <ArticleCard
                article={articles[0]}
                variant="featured"
                className="h-[300px] md:h-auto"
              />
            </div>
          )}

          {/* Airport - Featured on mobile, blue position on desktop */}
          {articles[1] && (
            <div className="md:col-span-2 lg:col-span-2 lg:col-start-3 lg:row-span-6 lg:row-start-2">
              <ArticleCard
                article={articles[1]}
                variant="featured"
                className="h-[300px] md:h-auto"
              />
            </div>
          )}

          {/* Telkom - Standard on mobile, red position on desktop */}
          {articles[2] && (
            <div className="md:col-span-2 lg:col-span-2 lg:col-start-5 lg:row-span-7 lg:row-start-0 lg:-mt-[62.5px] lg:pb-[62.5px]">
              <ArticleCard
                article={articles[2]}
                variant="medium"
                className="h-[250px] md:h-auto"
              />
            </div>
          )}

          {/* SKPL/Alcohol - Wide on mobile, green position on desktop */}
          {articles[3] && (
            <div className="md:col-span-3 lg:col-span-4 lg:col-start-1 lg:row-span-5 lg:row-start-8 lg:pr-[25px]">
              <ArticleCard
                article={articles[3]}
                variant="large"
                className="h-[200px] md:h-auto"
              />
            </div>
          )}

          {/* OSS - Standard on mobile, azzurro position on desktop */}
          {articles[4] && (
            <div className="md:col-span-1 lg:col-span-2 lg:col-start-5 lg:row-span-5 lg:row-start-8 lg:-mt-[50px]">
              <ArticleCard
                article={articles[4]}
                variant="small"
                className="h-[250px] md:h-auto"
              />
            </div>
          )}
        </div>

        {/* View All Button - Mobile optimized */}
        <div className="mt-8 md:mt-16 flex justify-center">
          <button className="border-2 border-red text-red px-6 py-3 md:px-10 md:py-4 font-serif font-bold tracking-tight hover:bg-red hover:text-black transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.7)] text-sm md:text-base w-full max-w-xs md:w-auto">
            Explore All Stories
          </button>
        </div>
      </div>
    </section>
  )
}
