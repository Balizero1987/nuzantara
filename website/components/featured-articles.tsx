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
    image: "/Bali_Zero_HQ_ultrarealistic_scene_of_a_modern_boardroom_in_Bali_overlooking_ju_42aa072f-fd9e-4f0f-9361-9bb38946516f.jpg",
    size: "large",
    featured: true,
  },
  {
    id: "2",
    title: "ZANTARA Meets AI: Indonesia's Cultural Intelligence Revolution",
    category: "AI Insights",
    excerpt: "",
    image: "/Bali_Zero_HQ_macro_shot_of_an_AI_neural_core_made_of_glowing_Balinese_patterns_b354de34-e933-4ba1-940b-3b62a53bdf0c.jpg",
    size: "small",
  },
  {
    id: "3",
    title: "Building Your PT PMA: From Paperwork to Prosperity",
    category: "Business",
    excerpt: "",
    image: "/Bali_Zero_HQ_ultrarealistic_digital_art_of_a_futuristic_Indonesia_skyline_blen_af473dcd-feb2-4ebc-ad5b-5f0f9b5a051e.jpg",
    size: "small",
  },
  {
    id: "4",
    title: "The Import-Export Playbook: Navigating Indonesian Trade Laws",
    category: "Business",
    excerpt: "",
    image: "/Bali_Zero_HQ_ultrarealistic_digital_art_of_a_futuristic_Indonesia_skyline_blen_0adb2134-a40a-4613-827b-6c717a579629.png",
    size: "medium",
  },
  {
    id: "5",
    title: "Property Ownership in Paradise: What Foreigners Can (and Can't) Buy",
    category: "Property",
    excerpt: "",
    image: "/Bali_Zero_HQ_ultrarealistic_scene_of_a_modern_boardroom_in_Bali_overlooking_ju_42aa072f-fd9e-4f0f-9361-9bb38946516f.jpg",
    size: "small",
  },
  {
    id: "6",
    title: "Indonesian Tax Decoded: Your Essential Guide to Compliance & Savings",
    category: "Tax & Legal",
    excerpt: "",
    image: "/Bali_Zero_HQ_macro_shot_of_an_AI_neural_core_made_of_glowing_Balinese_patterns_b354de34-e933-4ba1-940b-3b62a53bdf0c.jpg",
    size: "medium",
  },
]

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-[1.03] border border-white/10 hover:border-red/70 h-full">
      {/* Image */}
      <div className="absolute inset-0">
        <img
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 vibrant-image"
        />
        {/* Lighter overlay for brightness */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70 group-hover:opacity-60 transition-opacity"></div>

        {/* Watermark cover - bottom right corner */}
        <div className="absolute bottom-0 right-0 w-32 h-12 bg-gradient-to-tl from-black via-black/90 to-transparent z-10"></div>
      </div>

      {/* Content - Only Title */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end z-20">
        {/* Dark background for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

        <h3 className="text-white font-serif font-bold text-2xl md:text-3xl lg:text-4xl leading-tight group-hover:text-red transition-colors duration-300 relative z-10" style={{textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.7)'}}>
          {article.title}
        </h3>
        <div className="flex items-center gap-2 text-red font-sans font-bold text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity relative z-10" style={{textShadow: '0 2px 4px rgba(0,0,0,0.9)'}}>
          Read More <ArrowRight size={18} />
        </div>
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shimmer z-30"></div>
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
