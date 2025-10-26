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
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '80px 24px',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      position: 'relative'
    }}>
      {/* Fog Effect Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      <article style={{ position: 'relative', zIndex: 2 }}>
        {/* Category Badge */}
        {category && (
          <div style={{
            maxWidth: '680px',
            margin: '0 auto 40px auto',
            textAlign: 'left'
          }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: getCategoryColor(category),
              color: 'white',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: '4px'
            }}>
              {getCategoryName(category)}
            </span>
          </div>
        )}

        {/* Excerpt */}
        <div style={{
          maxWidth: '680px',
          margin: '0 auto 80px auto',
          paddingLeft: '32px',
          borderLeft: `4px solid ${getCategoryColor(category)}`,
          fontStyle: 'italic'
        }}>
          <p style={{
            fontSize: '28px',
            lineHeight: '1.6',
            margin: 0,
            color: '#1a1a1a',
            fontFamily: 'Georgia, serif'
          }}>
            {excerpt}
          </p>
        </div>

        {/* Main Content */}
        <div 
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            fontSize: 'clamp(18px, 4vw, 22px)',
            lineHeight: '1.8',
            color: '#333333',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
          }}
          dangerouslySetInnerHTML={{
            __html: content
              .replace(/<h2>/g, '<h2 style="font-size: 42px; font-weight: 700; line-height: 1.2; margin: 80px 0 32px 0; color: #1a1a1a; font-family: \'Georgia\', serif;">')
              .replace(/<h3>/g, '<h3 style="font-size: 32px; font-weight: 600; line-height: 1.3; margin: 64px 0 24px 0; color: #1a1a1a; font-family: \'Georgia\', serif;">')
              .replace(/<p>/g, '<p style="margin: 0 0 48px 0; font-size: clamp(18px, 4vw, 22px); line-height: 1.8; color: #333333;">')
              .replace(/<strong>/g, '<strong style="font-weight: 700; color: #1a1a1a;">')
              .replace(/<a href="/g, `<a style="color: ${getCategoryColor(category)}; text-decoration: none; border-bottom: 2px solid ${getCategoryColor(category)}; padding-bottom: 2px; font-weight: 600;" href="`)
              .replace(/<img/g, '<img style="width: 100%; height: auto; margin: 60px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"')
              .replace(/<blockquote>/g, `<blockquote style="border-left: 4px solid ${getCategoryColor(category)}; background: #f8f9fa; padding: 32px; margin: 60px 0; font-style: italic; font-size: 24px; line-height: 1.6; color: #1a1a1a;">`)
              .replace(/<ul>/g, '<ul style="margin: 48px 0; padding-left: 24px;">')
              .replace(/<li>/g, '<li style="margin: 20px 0; font-size: clamp(18px, 4vw, 22px); line-height: 1.8;">')
          }}
        />

        {/* Tags */}
        <div style={{
          maxWidth: '680px',
          margin: '80px auto 0 auto',
          paddingTop: '40px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {['Bali', 'Indonesia', 'Business'].map(tag => (
              <span
                key={tag}
                style={{
                  color: '#6b7280',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '20px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLElement
                  target.style.color = getCategoryColor(category)
                  target.style.borderColor = getCategoryColor(category)
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLElement
                  target.style.color = '#6b7280'
                  target.style.borderColor = '#e5e7eb'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bali Zero Identity */}
        <div style={{
          maxWidth: '680px',
          margin: '60px auto 0 auto',
          padding: '40px 0',
          textAlign: 'center',
          borderTop: '2px solid #dc2626'
        }}>
          <img
            src="/logo/balizero-logo-3d.png"
            alt="Bali Zero"
            style={{
              height: '48px',
              width: 'auto',
              objectFit: 'contain'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/logo/balizero-logo.png'
            }}
          />
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0,
            fontStyle: 'italic'
          }}>
            Premium business intelligence for Southeast Asia
          </p>
        </div>

        {/* Read Next */}
        <div style={{
          maxWidth: '680px',
          margin: '80px auto 0 auto',
          padding: '40px 0'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '32px',
            fontFamily: 'Georgia, serif'
          }}>
            Read Next
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px'
          }}>
            {[1, 2].map(item => (
              <a
                key={item}
                href="#"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#1a1a1a',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <img
                  src={`/article-images/placeholder-${item}.jpg`}
                  alt={`Related Article ${item}`}
                  style={{
                    width: '100px',
                    height: '70px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
                <div>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    lineHeight: '1.4'
                  }}>
                    Related Article Title {item}
                  </p>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Category Name
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}