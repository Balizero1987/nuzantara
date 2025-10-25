import Link from "next/link"
import type { Article } from "@/lib/articles"
import { formatDate } from "@/lib/utils/date"

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/article/${article.slug}`}>
      <article className="group cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-[1.02] h-full flex flex-col">
        {/* Image Container - Vertical Rectangle (3:4 Aspect Ratio) */}
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg border border-white/10 group-hover:border-red/70 transition-colors duration-500">
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
          <h3 className="text-white font-serif font-bold text-lg md:text-xl lg:text-2xl leading-snug group-hover:text-red transition-colors duration-300">
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
