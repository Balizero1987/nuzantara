import { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/api'
import { categories } from '@/lib/categories'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://balizero.com'

  // Get all articles
  const articles = await getAllArticles()

  // Generate article URLs
  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/article/${article.slug}`,
    lastModified: article.updatedAt || article.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Generate category URLs
  const categoryUrls = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...categoryUrls,
    ...articleUrls,
  ]
}
