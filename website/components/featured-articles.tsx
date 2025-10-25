import { ArrowRight } from "lucide-react"

interface Article {
  id: string
  title: string
  category: string
  excerpt: string
  image: string
  featured?: boolean
}

const articles: Article[] = [
  {
    id: "1",
    title: "Your Journey to Indonesian Residency: A Complete KITAS Guide",
    category: "Immigration",
    excerpt: "",
    image: "/Bali_Zero_HQ_ultrarealistic_scene_of_a_modern_boardroom_in_Bali_overlooking_ju_42aa072f-fd9e-4f0f-9361-9bb38946516f.jpg",
    featured: true,
  },
  {
    id: "2",
    title: "ZANTARA Meets AI: Indonesia's Cultural Intelligence Revolution",
    category: "AI Insights",
    excerpt: "",
    image: "/Bali_Zero_HQ_macro_shot_of_an_AI_neural_core_made_of_glowing_Balinese_patterns_b354de34-e933-4ba1-940b-3b62a53bdf0c.jpg",
  },
  {
    id: "3",
    title: "Building Your PT PMA: From Paperwork to Prosperity",
    category: "Business",
    excerpt: "",
    image: "/Bali_Zero_HQ_ultrarealistic_digital_art_of_a_futuristic_Indonesia_skyline_blen_af473dcd-feb2-4ebc-ad5b-5f0f9b5a051e.jpg",
  },
  {
    id: "4",
    title: "The Import-Export Playbook: Navigating Indonesian Trade Laws",
    category: "Business",
    excerpt: "",
    image: "/Bali_Zero_HQ_ultrarealistic_digital_art_of_a_futuristic_Indonesia_skyline_blen_0adb2134-a40a-4613-827b-6c717a579629.png",
  },
  {
    id: "5",
    title: "Property Ownership in Paradise: What Foreigners Can (and Can't) Buy",
    category: "Property",
    excerpt: "",
    image: "/Bali_Zero_HQ_ultrarealistic_scene_of_a_modern_boardroom_in_Bali_overlooking_ju_42aa072f-fd9e-4f0f-9361-9bb38946516f.jpg",
  },
  {
    id: "6",
    title: "Indonesian Tax Decoded: Your Essential Guide to Compliance & Savings",
    category: "Tax & Legal",
    excerpt: "",
    image: "/Bali_Zero_HQ_macro_shot_of_an_AI_neural_core_made_of_glowing_Balinese_patterns_b354de34-e933-4ba1-940b-3b62a53bdf0c.jpg",
  },
]

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="group cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-[1.02] h-full flex flex-col">
      {/* Image Container - 16:9 Aspect Ratio */}
      <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-white/10 group-hover:border-red/70 transition-colors duration-500">
        <img
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 vibrant-image"
        />

        {/* Watermark cover - bottom right corner */}
        <div className="absolute bottom-0 right-0 w-32 h-12 bg-gradient-to-tl from-black via-black/90 to-transparent z-10"></div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shimmer"></div>
      </div>

      {/* Title - Below Image */}
      <div className="mt-4 px-2">
        <h3 className="text-white font-serif font-bold text-xl md:text-2xl lg:text-3xl leading-tight group-hover:text-red transition-colors duration-300">
          {article.title}
        </h3>
      </div>
    </article>
  )
}

export function FeaturedArticles() {
  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto lg:px-[6%]">
        {/* Uniform Grid Layout - 16:9 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
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
