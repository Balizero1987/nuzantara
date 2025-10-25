import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Article, ArticleMetadata, CategorySlug } from './articles'

const articlesDirectory = path.join(process.cwd(), 'content/articles')

// Mock articles data (sostituirà i file markdown inizialmente)
const mockArticles: Article[] = [
  {
    slug: 'kitas-complete-guide-2025',
    title: 'Your Journey to Indonesian Residency: A Complete KITAS Guide',
    excerpt: "From tourist to resident: Navigate Indonesia's KITAS system with confidence. Understand requirements, timelines, and insider tips for a smooth application process.",
    category: 'immigration',
    image: '/Bali_Zero_HQ_ultrarealistic_scene_of_a_modern_boardroom_in_Bali_overlooking_ju_42aa072f-fd9e-4f0f-9361-9bb38946516f.jpg',
    publishedAt: '2025-01-25',
    readTime: 8,
    featured: true,
    content: '',
    tags: ['KITAS', 'visa', 'residency']
  },
  {
    slug: 'zantara-ai-revolution',
    title: "ZANTARA Meets AI: Indonesia's Cultural Intelligence Revolution",
    excerpt: "How ancient Indonesian wisdom converges with cutting-edge AI. Discover the cultural intelligence framework reshaping Southeast Asian tech innovation.",
    category: 'ai',
    image: '/Bali_Zero_HQ_macro_shot_of_an_AI_neural_core_made_of_glowing_Balinese_patterns_b354de34-e933-4ba1-940b-3b62a53bdf0c.jpg',
    publishedAt: '2025-01-24',
    readTime: 6,
    featured: true,
    content: '',
    tags: ['AI', 'ZANTARA', 'innovation']
  },
  {
    slug: 'pt-pma-setup-bali',
    title: 'Building Your PT PMA: From Paperwork to Prosperity',
    excerpt: "The definitive roadmap to establishing your foreign-owned company in Indonesia. Legal structures, capital requirements, and strategic considerations for success.",
    category: 'business',
    image: '/Bali_Zero_HQ_ultrarealistic_digital_art_of_a_futuristic_Indonesia_skyline_blen_af473dcd-feb2-4ebc-ad5b-5f0f9b5a051e.jpg',
    publishedAt: '2025-01-23',
    readTime: 12,
    featured: true,
    content: '',
    tags: ['PT PMA', 'business', 'company formation']
  },
  {
    slug: 'indonesia-import-export-playbook',
    title: 'The Import-Export Playbook: Navigating Indonesian Trade Laws',
    excerpt: "Master Indonesia's complex customs landscape. Essential regulations, tariff classifications, and compliance strategies for cross-border commerce.",
    category: 'business',
    image: '/Bali_Zero_HQ_ultrarealistic_digital_art_of_a_futuristic_Indonesia_skyline_blen_0adb2134-a40a-4613-827b-6c717a579629.png',
    publishedAt: '2025-01-22',
    readTime: 10,
    featured: false,
    content: '',
    tags: ['trade', 'import', 'export']
  },
  {
    slug: 'property-ownership-foreigners-indonesia',
    title: "Property Ownership in Paradise: What Foreigners Can (and Can't) Buy",
    excerpt: "Decode Indonesian property laws for foreign investors. Rights, restrictions, and smart strategies for securing real estate in the archipelago.",
    category: 'property',
    image: '/Bali_Zero_HQ_ultrarealistic_scene_of_a_modern_boardroom_in_Bali_overlooking_ju_42aa072f-fd9e-4f0f-9361-9bb38946516f.jpg',
    publishedAt: '2025-01-21',
    readTime: 9,
    featured: true,
    content: '',
    tags: ['property', 'real estate', 'leasehold']
  },
  {
    slug: 'indonesian-tax-compliance-guide',
    title: 'Indonesian Tax Decoded: Your Essential Guide to Compliance & Savings',
    excerpt: "Demystify Indonesia's tax system. From NPWP registration to double taxation treaties—your complete guide to staying compliant and optimizing liabilities.",
    category: 'tax-legal',
    image: '/Bali_Zero_HQ_macro_shot_of_an_AI_neural_core_made_of_glowing_Balinese_patterns_b354de34-e933-4ba1-940b-3b62a53bdf0c.jpg',
    publishedAt: '2025-01-20',
    readTime: 11,
    featured: true,
    content: '',
    tags: ['tax', 'NPWP', 'compliance']
  }
]

export async function getAllArticles(): Promise<Article[]> {
  return mockArticles.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const article = mockArticles.find(a => a.slug === slug)
  return article || null
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
