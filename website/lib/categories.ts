import type { CategorySlug } from './articles'
import { TrendingUp, Briefcase, Scale, Home, Brain } from 'lucide-react'

export interface Category {
  slug: CategorySlug
  name: string
  description: string
  color: string
  icon: any
  heroImage: string
}

export const categories: Category[] = [
  {
    slug: 'immigration',
    name: 'Immigration',
    description: 'Visa, residency, and citizenship insights for living in Indonesia',
    color: '#FF0000',
    icon: TrendingUp,
    heroImage: '/category-headers/immigration-hero.jpg'
  },
  {
    slug: 'business',
    name: 'Business',
    description: 'Company formation, trade laws, and entrepreneurship in Indonesia',
    color: '#D4AF37',
    icon: Briefcase,
    heroImage: '/category-headers/business-hero.jpg'
  },
  {
    slug: 'tax-legal',
    name: 'Tax & Legal',
    description: 'Compliance, regulations, and legal framework for businesses',
    color: '#FFFFFF',
    icon: Scale,
    heroImage: '/category-headers/tax-legal-hero.jpg'
  },
  {
    slug: 'property',
    name: 'Property',
    description: 'Real estate ownership, leasehold, and investment opportunities',
    color: '#D4AF37',
    icon: Home,
    heroImage: '/category-headers/property-hero.jpg'
  },
  {
    slug: 'ai',
    name: 'AI & Innovation',
    description: 'Cultural intelligence, technology, and the future of Southeast Asia',
    color: '#FF0000',
    icon: Brain,
    heroImage: '/category-headers/ai-hero.jpg'
  }
]

export function getCategoryBySlug(slug: CategorySlug): Category | undefined {
  return categories.find(cat => cat.slug === slug)
}
