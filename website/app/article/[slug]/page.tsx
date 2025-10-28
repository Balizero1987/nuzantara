import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getAllArticles, getArticleBySlug, getRelatedArticles } from "@/lib/api"
import { Header } from "@/components/header"
import { ArticleHero } from "@/components/article/article-hero"
import { ArticleContent } from "@/components/article/article-content"
import { RelatedArticles } from "@/components/article/related-articles"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

interface ArticlePageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate static paths for all articles
export async function generateStaticParams() {
  const articles = await getAllArticles()
  return articles.map((article) => ({
    slug: article.slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return {
      title: "Article Not Found | Bali Zero",
    }
  }

  return {
    title: `${article.title} | Bali Zero`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.image],
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author || "Bali Zero Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const relatedArticles = await getRelatedArticles(slug, 3)

  return (
    <main className="bg-black batik-pattern min-h-screen">
      <Header />
      <ArticleHero article={article} />
      <ArticleContent content={article.content} excerpt={article.excerpt} category={article.category} />

      {/* CTA to balizero.com */}
      <section className="border-t border-white/10 bg-black/50">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
          <h3 className="text-white font-serif font-bold text-2xl md:text-3xl mb-4">
            Need Professional Help?
          </h3>
          <p className="text-white/70 font-sans text-lg mb-8">
            Our team of experts can guide you through the complexities of Indonesian regulations and business setup.
          </p>
          <a
            href="https://balizero.com"
            className="inline-block bg-red text-black px-8 py-4 font-serif font-bold tracking-tight hover:bg-gold transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]"
          >
            Explore Our Services
          </a>
        </div>
      </section>

      <RelatedArticles articles={relatedArticles} />
      <CTASection />
      <Footer />
    </main>
  )
}
