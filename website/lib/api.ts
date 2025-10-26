import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'
import type { Article, ArticleMetadata, CategorySlug } from './articles'

const articlesDirectory = path.join(process.cwd(), 'content/articles')

// Real articles from Instagram @balizero0 (converted from top-performing posts)
const mockArticles: Article[] = [
  {
    slug: 'bali-floods-overtourism-reckoning',
    title: "Bali's Reckoning: When Paradise Drowns, Who's to Blame?",
    excerpt: "18 lives lost. 81 neighborhoods submerged. September's floods exposed the deadly cost of unchecked development. Did overtourism and illegal building kill Bali's rice terraces—and with them, the island's flood defenses?",
    category: 'property',
    image: '/instagram/post_4_cover.jpg',
    publishedAt: '2025-10-01',
    updatedAt: '2025-10-01',
    readTime: 12,
    author: 'Bali Zero Research Team',
    featured: true,
    content: 'Full article in /content/articles/bali-floods-overtourism-reckoning.md',
    tags: ['Bali floods', 'overtourism', 'Subak', 'environmental crisis', 'property development'],
    relatedArticles: ['north-bali-airport-decade-promises', 'd12-visa-indonesia-business-explorer']
  },
  {
    slug: 'north-bali-airport-decade-promises',
    title: 'North Bali Airport: Ten Years of Promises, Still No Runway',
    excerpt: "Billions discussed. Consultants hired. Studies commissioned. And Buleleng still waits for the airport that was supposed to change everything. After a decade of broken promises, is North Bali's airport just a political mirage?",
    category: 'business',
    image: '/instagram/post_2_cover.jpg',
    publishedAt: '2025-10-21',
    updatedAt: '2025-10-21',
    readTime: 10,
    author: 'Bali Zero Research Team',
    featured: true,
    content: 'Full article in /content/articles/north-bali-airport-decade-promises.md',
    tags: ['North Bali airport', 'infrastructure', 'Buleleng', 'investment', 'government accountability'],
    relatedArticles: ['bali-floods-overtourism-reckoning', 'oss-2-migration-deadline-indonesia']
  },
  {
    slug: 'd12-visa-indonesia-business-explorer',
    title: "The D12 Visa: Indonesia's 2-Year Business Exploration Gateway",
    excerpt: "Imagine spending up to two years exploring Indonesia—meeting partners, scouting locations, testing business ideas—all on a completely legal visa. The D12 Pre-Investment Visa is your roadmap to informed Indonesian business entry.",
    category: 'immigration',
    image: '/instagram/post_3_cover.jpg',
    publishedAt: '2025-10-15',
    updatedAt: '2025-10-15',
    readTime: 8,
    author: 'Bali Zero Immigration Desk',
    featured: true,
    content: 'Full article in /content/articles/d12-visa-indonesia-business-explorer.md',
    tags: ['D12 visa', 'business visa', 'pre-investment', 'immigration', 'entrepreneur visa'],
    relatedArticles: ['oss-2-migration-deadline-indonesia', 'skpl-alcohol-license-bali-complete-guide']
  },
  {
    slug: 'skpl-alcohol-license-bali-complete-guide',
    title: 'When Inspectors Walk In: The Real Cost of Skipping Your SKPL',
    excerpt: "Your bar is packed. Music's loud. Drinks are flowing. Then you see them: two officials with clipboards, walking straight toward your manager. And you realize—nobody checked the alcohol license in six months.",
    category: 'business',
    image: '/instagram/post_1_cover.jpg',
    publishedAt: '2025-10-24',
    updatedAt: '2025-10-24',
    readTime: 9,
    author: 'Bali Zero Legal Compliance',
    featured: false,
    content: 'Full article in /content/articles/skpl-alcohol-license-bali-complete-guide.md',
    tags: ['SKPL', 'alcohol license', 'F&B compliance', 'bar license', 'Bali business'],
    relatedArticles: ['oss-2-migration-deadline-indonesia', 'd12-visa-indonesia-business-explorer']
  },
  {
    slug: 'oss-2-migration-deadline-indonesia',
    title: 'OSS 2.0: The Migration Deadline That Locked Out Thousands',
    excerpt: "October 5th, 2025 wasn't just another date. It was the day Indonesia's business licensing system fundamentally changed. 47,000 companies missed the migration—and found themselves frozen out. Learn about Positif Fiktif and the new compliance reality.",
    category: 'business',
    image: '/instagram/post_5_cover.jpg',
    publishedAt: '2025-09-20',
    updatedAt: '2025-10-05',
    readTime: 11,
    author: 'Bali Zero Corporate Services',
    featured: true,
    content: 'Full article in /content/articles/oss-2-migration-deadline-indonesia.md',
    tags: ['OSS 2.0', 'NIB', 'LKPM', 'business licensing', 'Positif Fiktif', 'PT PMA compliance'],
    relatedArticles: ['d12-visa-indonesia-business-explorer', 'north-bali-airport-decade-promises']
  }
]

export async function getAllArticles(): Promise<Article[]> {
  return mockArticles.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const article = mockArticles.find(a => a.slug === slug)
  if (!article) return null

  // Read the actual markdown file
  try {
    const fullPath = path.join(articlesDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { content } = matter(fileContents)

    // Convert markdown to HTML
    const htmlContent = await marked.parse(content)

    // Return article with actual HTML content
    return {
      ...article,
      content: htmlContent
    }
  } catch (error) {
    console.error(`Error reading article ${slug}:`, error)
    return article // Return with placeholder content if file not found
  }
}

export async function getArticlesByCategory(category: CategorySlug): Promise<Article[]> {
  return mockArticles
    .filter(a => a.category === category)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export async function getFeaturedArticles(limit: number = 6): Promise<Article[]> {
  return mockArticles
    .filter(a => a.featured)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}

export async function getRelatedArticles(slug: string, limit: number = 3): Promise<Article[]> {
  const currentArticle = await getArticleBySlug(slug)
  if (!currentArticle) return []

  return mockArticles
    .filter(a => a.slug !== slug && a.category === currentArticle.category)
    .slice(0, limit)
}

export async function searchArticles(query: string): Promise<Article[]> {
  const lowerQuery = query.toLowerCase()
  return mockArticles.filter(article =>
    article.title.toLowerCase().includes(lowerQuery) ||
    article.excerpt.toLowerCase().includes(lowerQuery) ||
    article.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}
