import Link from "next/link"
import type { Article } from "@/lib/articles"
import { formatDate } from "@/lib/utils/date"

interface ArticleCardProps {
  article: Article
  variant?: 'featured' | 'medium' | 'small'
}

export function ArticleCard({ article, variant = 'small' }: ArticleCardProps) {
  // Define aspect ratios based on variant
  const getAspectRatio = () => {
    switch (variant) {
      case 'featured':
        return 'aspect-[16/9]' // Wide for featured
      case 'medium':
        return 'aspect-[4/3]' // Medium rectangle
      case 'small':
      default:
        return 'aspect-[3/4]' // Vertical for small
    }
  }

  // Define title sizes based on variant
  const getTitleSize = () => {
    switch (variant) {
      case 'featured':
        return 'text-2xl md:text-3xl lg:text-4xl'
      case 'medium':
        return 'text-xl md:text-2xl'
      case 'small':
      default:
        return 'text-lg md:text-xl lg:text-2xl'
    }
  }

  return (
    <Link href={`/article/${article.slug}`}>
      <article className="group cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-[1.02] h-full flex flex-col">
        {/* Image Container - Dynamic Aspect Ratio */}
        <div className={`relative w-full ${getAspectRatio()} overflow-hidden rounded-lg border border-white/10 group-hover:border-red/70 transition-colors duration-500`}>
          <img
            src={article.image || "/placeholder.svg"}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 vibrant-image"
          />

          {/* Category tag */}
          <div className="absolute top-4 left-4 bg-black/80 border border-red/50 px-3 py-1 text-xs font-serif font-bold text-red tracking-wider">
            {article.category.toUpperCase().replace('-', ' ')}
          </div>

          {/* Read time badge */}
          <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 text-xs font-sans text-white/70">
            {article.readTime} min
          </div>

          {/* Watermark cover - bottom right corner */}
          <div className="absolute bottom-0 right-0 w-32 h-12 bg-gradient-to-tl from-black via-black/90 to-transparent z-10"></div>

          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shimmer"></div>
        </div>

        {/* Content */}
        <div className="mt-6 px-1 space-y-3">
          {/* Title */}
          <h3 className={`text-white font-serif font-bold ${getTitleSize()} leading-snug group-hover:text-red transition-colors duration-300`}>
            {article.title}
          </h3>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-white/50 font-sans text-sm">
            <span>{formatDate(article.publishedAt)}</span>
            <span>•</span>
            <span>{article.readTime} min read</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
