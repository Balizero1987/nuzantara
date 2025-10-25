"use client"

interface ArticleContentProps {
  content: string
  excerpt: string
}

export function ArticleContent({ content, excerpt }: ArticleContentProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-20">
      <article className="article-content">
        {/* Excerpt/Introduction */}
        <p className="text-white/90 font-sans text-xl md:text-2xl leading-relaxed mb-12 border-l-4 border-red pl-6 italic">
          {excerpt}
        </p>

        {/* Main content would go here */}
        {/* For now showing placeholder structure */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-6 text-white/80 font-sans text-lg leading-relaxed">
            <p className="first-letter:text-7xl first-letter:font-serif first-letter:font-bold first-letter:text-red first-letter:float-left first-letter:mr-3 first-letter:leading-none">
              This is where the article content will be rendered. The first letter has a special dropcap styling to create
              an elegant magazine-style opening.
            </p>

            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>

            <h2 className="text-white font-serif font-bold text-3xl md:text-4xl mt-12 mb-6">
              Section Title Example
            </h2>

            <p>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>

            {/* Example pull quote */}
            <blockquote className="my-12 py-6 px-8 border-l-4 border-gold bg-white/5">
              <p className="text-2xl font-serif italic text-white mb-4">
                "This is an example of a pull quote that stands out from the main text, drawing attention to key insights."
              </p>
              <footer className="text-white/60 font-sans text-sm">— Source Attribution</footer>
            </blockquote>

            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            {['tag1', 'tag2', 'tag3'].map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/5 border border-white/20 text-white/70 font-sans text-sm hover:border-red hover:text-red transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}
