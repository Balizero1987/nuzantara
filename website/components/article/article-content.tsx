"use client"

interface ArticleContentProps {
  content: string
  excerpt: string
}

export function ArticleContent({ content, excerpt }: ArticleContentProps) {
  return (
    <div className="mx-auto px-6 sm:px-8 lg:px-12 py-16 md:py-24">
      <article className="article-content">
        {/* Excerpt/Introduction - Minimalista */}
        <div className="max-w-[680px] mx-auto mb-20 pb-8 border-l-2 border-gray-200 dark:border-gray-700 pl-8">
          <p className="text-gray-900 dark:text-gray-100 text-2xl leading-[1.7] font-serif italic">
            {excerpt}
          </p>
        </div>

        {/* Main article content */}
        <div
          className="prose prose-lg mx-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Tags - Minimalisti */}
        <div className="max-w-[680px] mx-auto mt-20 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            {['Bali', 'Indonesia', 'Business'].map(tag => (
              <span
                key={tag}
                className="text-gray-500 dark:text-gray-400 text-sm hover:text-red-600 dark:hover:text-red-500 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}
