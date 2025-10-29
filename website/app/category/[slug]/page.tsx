import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCategoryBySlug, categories } from "@/lib/categories"
import { getArticlesByCategory } from "@/lib/api"
import { Header } from "@/components/header"
import { CategoryHeader } from "@/components/category/category-header"
import { CategoryGrid } from "@/components/category/category-grid"
import { Footer } from "@/components/footer"
import type { CategorySlug } from "@/lib/articles"

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate static paths for all categories
export async function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug as CategorySlug)

  if (!category) {
    return {
      title: "Category Not Found | Bali Zero",
    }
  }

  return {
    title: `${category.name} | Bali Zero Insights`,
    description: category.description,
    openGraph: {
      title: `${category.name} | Bali Zero Insights`,
      description: category.description,
      type: "website",
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategoryBySlug(slug as CategorySlug)

  if (!category) {
    notFound()
  }

  const articles = await getArticlesByCategory(slug as CategorySlug)

  return (
    <main className="batik-pattern min-h-screen">
      <Header />
      <CategoryHeader category={category} />
      <CategoryGrid articles={articles} />
      <Footer />
    </main>
  )
}
