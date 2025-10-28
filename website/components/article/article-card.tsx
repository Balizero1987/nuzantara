import Link from "next/link"
import type { Article } from "@/lib/articles"
import { formatDate } from "@/lib/utils/date"

interface ArticleCardProps {
  article: Article
  variant?: 'featured' | 'medium' | 'small' | 'large'
  colorBlock?: 'marrone-rosso' | 'giallo' | 'blu-scuro' | 'verde' | 'blu-viola'
  className?: string
}

export function ArticleCard({ article, variant = 'small', colorBlock, className }: ArticleCardProps) {
  // Define aspect ratios based on variant
  const getAspectRatio = () => {
    switch (variant) {
      case 'featured':
        return 'aspect-[3/4]' // Vertical for featured too
      case 'large':
        return 'aspect-[16/9]' // Horizontal for large
      case 'medium':
        return 'aspect-[3/4]' // Vertical for medium
      case 'small':
      default:
        return 'aspect-[3/4]' // Vertical for small
    }
  }

  // Define title sizes based on variant - Optimized for mobile readability
  const getTitleSize = () => {
    switch (variant) {
      case 'featured':
        return 'text-xl md:text-2xl lg:text-3xl xl:text-4xl'
      case 'large':
        return 'text-lg md:text-xl lg:text-2xl xl:text-3xl'
      case 'medium':
        return 'text-base md:text-lg lg:text-xl xl:text-2xl'
      case 'small':
      default:
        return 'text-sm md:text-base lg:text-lg xl:text-xl'
    }
  }

  // Define text colors based on color block
  const getTextColor = () => {
    switch (colorBlock) {
      case 'marrone-rosso':
        return 'text-white'
      case 'giallo':
        return 'text-black'
      case 'blu-scuro':
        return 'text-white'
      case 'verde':
        return 'text-black'
      case 'blu-viola':
        return 'text-white'
      default:
        return 'text-white'
    }
  }

  return (
    <Link href={`/article/${article.slug}`}>
      <article className={`group cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] md:hover:scale-[1.02] h-full flex flex-col article-card-mobile ${className || ''}`}>
        {/* Image Container - Dynamic Aspect Ratio */}
        <div className={`relative w-full ${getAspectRatio()} overflow-hidden rounded-lg border border-white/10 group-hover:border-red/70 transition-colors duration-500`}>
          <img
            src={article.image || "/placeholder.svg"}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 vibrant-image"
          />

          {/* Category tag - Responsive sizing */}
          <div className="absolute top-2 md:top-4 left-2 md:left-4 bg-black/80 border border-red/50 px-2 md:px-3 py-1 text-xs font-serif font-bold text-red tracking-wider">
            {article.category.toUpperCase().replace('-', ' ')}
          </div>

          {/* Read time badge - Responsive sizing */}
          <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 bg-black/80 px-2 md:px-3 py-1 text-xs font-sans text-white/70">
            {article.readTime} min
          </div>

          {/* Watermark cover - bottom right corner */}
          <div className="absolute bottom-0 right-0 w-32 h-12 bg-gradient-to-tl from-black via-black/90 to-transparent z-10"></div>

          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shimmer"></div>
        </div>

        {/* Content - Optimized spacing for mobile */}
        <div className="mt-3 md:mt-6 px-1 space-y-2 md:space-y-3">
          {/* Title - Better mobile line height */}
          <h3 className={`text-white font-serif font-bold ${getTitleSize()} leading-tight md:leading-snug group-hover:text-red transition-colors duration-300 article-title-mobile`}>
            {article.title}
          </h3>

          {/* Metadata - Responsive text size */}
          <div className="flex items-center gap-2 text-white/50 font-sans text-xs md:text-sm">
            <span>{formatDate(article.publishedAt)}</span>
            <span>•</span>
            <span>{article.readTime} min read</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
