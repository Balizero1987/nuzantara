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
    excerpt: "",
    image: "/Bali_Zero_HQ_generate_a_colorful_galungan_ceremony,_make_bright,_under_sun_and_cb79a747-390f-4f3f-a2bd-950a437a4eb0.jpg",
    size: "large",
    featured: true,
  },
  {
    id: "2",
    title: "ZANTARA Meets AI: Indonesia's Cultural Intelligence Revolution",
    category: "AI Insights",
    excerpt: "",
    image: "/Bali_Zero_HQ_generate_a_futuristic_image_of_a_batik_Indonesian_bd69f7e8-34df-44c7-9f63-a694fe72f0f6.jpg",
    size: "small",
  },
  {
    id: "3",
    title: "Building Your PT PMA: From Paperwork to Prosperity",
    category: "Business",
    excerpt: "",
    image: "/sustainable-business-green-technology.jpg",
    size: "small",
  },
  {
    id: "4",
    title: "The Import-Export Playbook: Navigating Indonesian Trade Laws",
    category: "Business",
    excerpt: "",
    image: "/supply-chain-logistics-network.jpg",
    size: "medium",
  },
  {
    id: "5",
    title: "Property Ownership in Paradise: What Foreigners Can (and Can't) Buy",
    category: "Property",
    excerpt: "",
    image: "/emerging-markets-investment-finance.jpg",
    size: "small",
  },
  {
    id: "6",
    title: "Indonesian Tax Decoded: Your Essential Guide to Compliance & Savings",
    category: "Tax & Legal",
    excerpt: "",
    image: "/digital-transformation.png",
    size: "medium",
  },
]

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-[1.03] border border-white/10 hover:border-red/70">
      {/* Image */}
      <div className="absolute inset-0">
        <img
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
      </div>

      {/* Content - Only Title */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
        <h3 className="text-white font-serif font-bold text-2xl md:text-3xl lg:text-4xl leading-tight group-hover:text-red transition-colors duration-300">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 text-red font-sans font-bold text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          Read More <ArrowRight size={18} />
        </div>
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shimmer"></div>
    </article>
  )
}

export function FeaturedArticles() {
  return (
    <section className="py-12 px-4 md:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        {/* McKinsey-style Overlapping Layout */}
        <div className="relative">
          {/* Top Row - Large hero left + stacked right */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Large hero article - left side */}
            <div className="md:col-span-2 h-[500px] md:h-[600px]">
              <ArticleCard article={articles[0]} />
            </div>

            {/* Right column - two stacked articles */}
            <div className="flex flex-col gap-6">
              <div className="h-[250px] md:h-[292px]">
                <ArticleCard article={articles[1]} />
              </div>
              <div className="h-[250px] md:h-[292px]">
                <ArticleCard article={articles[2]} />
              </div>
            </div>
          </div>

          {/* Bottom Row - Three equal sized articles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-[300px] md:h-[350px]">
              <ArticleCard article={articles[3]} />
            </div>
            <div className="h-[300px] md:h-[350px]">
              <ArticleCard article={articles[4]} />
            </div>
            <div className="h-[300px] md:h-[350px]">
              <ArticleCard article={articles[5]} />
            </div>
          </div>
        </div>

        {/* View All Button */}
        <div className="mt-12 flex justify-center">
          <button className="border-2 border-red text-red px-10 py-4 font-serif font-bold hover:bg-red hover:text-black transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,0,0,0.7)]">
            Explore All Stories
          </button>
        </div>
      </div>
    </section>
  )
}
