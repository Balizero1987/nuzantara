// Article types and interfaces

export type CategorySlug = 'immigration' | 'business' | 'tax-legal' | 'property' | 'ai'

export interface Article {
  slug: string
  title: string
  excerpt: string
  category: CategorySlug
  image: string
  publishedAt: string
  updatedAt?: string
  readTime: number
  author?: string
  featured?: boolean
  content: string
  tags?: string[]
  relatedArticles?: string[]
}

export interface ArticleMetadata {
  slug: string
  title: string
  excerpt: string
  category: CategorySlug
  image: string
  publishedAt: string
  updatedAt?: string
  readTime: number
  author?: string
  featured?: boolean
  tags?: string[]
  relatedArticles?: string[]
}
