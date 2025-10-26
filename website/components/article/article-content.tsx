"use client"

interface ArticleContentProps {
  content: string
  excerpt: string
  category?: string
}

export function ArticleContent({ content, excerpt, category }: ArticleContentProps) {
  const getCategoryColor = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'property': return '#dc2626'
      case 'tax': return '#0891b2'
      case 'ai': return '#d97706'
      case 'immigration': return '#7c3aed'
      case 'business': return '#059669'
      default: return '#dc2626'
    }
  }

  const getCategoryName = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'property': return 'PROPERTY'
      case 'tax': return 'TAX & LEGAL'
      case 'ai': return 'AI INSIGHTS'
      case 'immigration': return 'IMMIGRATION'
      case 'business': return 'BUSINESS'
      default: return 'INSIGHTS'
    }
  }

  return (
    <div className="article-content-container">
      <div className="fog-overlay" />
      
      <article className="article-content">
        {/* Category Badge */}
        {category && (
          <div className="category-badge-container">
            <span 
              className="category-badge"
              style={{ backgroundColor: getCategoryColor(category) }}
            >
              {getCategoryName(category)}
            </span>
          </div>
        )}

        {/* Excerpt */}
        <div 
          className="article-excerpt"
          style={{ borderLeftColor: getCategoryColor(category) }}
        >
          <p className="excerpt-text">{excerpt}</p>
        </div>

        {/* Main Content */}
        <div 
          className="article-main-content"
          dangerouslySetInnerHTML={{
            __html: content
              .replace(/<h2>/g, '<h2 class="article-h2">')
              .replace(/<h3>/g, '<h3 class="article-h3">')
              .replace(/<p>/g, '<p class="article-p">')
              .replace(/<strong>/g, '<strong class="article-strong">')
              .replace(/<a href="/g, `<a class="article-link" style="color: ${getCategoryColor(category)}; border-bottom-color: ${getCategoryColor(category)};" href="`)
              .replace(/<img/g, '<img class="article-img"')
              .replace(/<blockquote>/g, `<blockquote class="article-blockquote" style="border-left-color: ${getCategoryColor(category)};">`)
              .replace(/<ul>/g, '<ul class="article-ul">')
              .replace(/<li>/g, '<li class="article-li">')
          }}
        />

        {/* Tags */}
        <div className="article-tags">
          <div className="tags-container">
            {['Bali', 'Indonesia', 'Business'].map(tag => (
              <span key={tag} className="tag-item">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bali Zero Identity */}
        <div className="bali-zero-identity">
          <img
            src="/logo/balizero-logo-3d.png"
            alt="Bali Zero"
            className="bali-zero-logo"
            onError={(e) => {
              e.target.src = '/logo/balizero-logo.png'
            }}
          />
          <p className="bali-zero-tagline">
            Premium business intelligence for Southeast Asia
          </p>
        </div>

        {/* Read Next */}
        <div className="read-next-section">
          <h3 className="read-next-title">Read Next</h3>
          <div className="related-articles">
            {[1, 2].map(item => (
              <a key={item} href="#" className="related-article">
                <img
                  src={`/article-images/placeholder-${item}.jpg`}
                  alt={`Related Article ${item}`}
                  className="related-article-img"
                />
                <div className="related-article-content">
                  <p className="related-article-title">Related Article Title {item}</p>
                  <span className="related-article-category">Category Name</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}