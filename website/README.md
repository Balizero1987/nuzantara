# Bali Zero Blog Website

**Live**: http://localhost:3001
**Stack**: Next.js 16.0.0 + TypeScript + Tailwind CSS
**Status**: Development

---

## 📁 Project Structure

```
/website
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage
│   ├── article/[slug]/    # Dynamic article pages
│   ├── category/[slug]/   # Dynamic category pages
│   └── about/             # About page
├── components/            # React components
│   ├── header.tsx
│   ├── footer.tsx
│   ├── hero-section.tsx
│   ├── featured-articles.tsx
│   └── article/
├── content/               # Article content (Markdown)
│   └── articles/          # All blog articles
├── lib/                   # Utilities
│   ├── api.ts            # Article data & API functions
│   └── articles.ts       # TypeScript types
├── public/                # Static assets
│   ├── instagram/        # Article cover images
│   ├── logo/            # Brand logos
│   └── garuda.mp4       # Hero video
└── WRITING_STYLE_GUIDE.md # 📖 Editorial guidelines
```

---

## ✍️ Content Guidelines

**For all content writers and editors**: Please read the comprehensive writing guide before creating or editing articles.

### 📖 [WRITING STYLE GUIDE](./WRITING_STYLE_GUIDE.md)

This guide covers:
- **Article structure** (7-part narrative framework)
- **Language rules** (simple, immediate, effective)
- **Journalism techniques** (The Atlantic + ProPublica + Wired)
- **Word count targets** (1,500-2,000 words per article)
- **Quality checklist** (clarity, engagement, accuracy)
- **Concrete examples** (before/after comparisons)

**Required reading** before writing any article.

---

## 🚀 Quick Start

### Install dependencies:
```bash
npm install
```

### Run development server:
```bash
npm run dev
```

### Build for production:
```bash
npm run build
```

---

## 📝 Adding New Articles

### 1. Create Markdown File
Add to `/content/articles/your-article-slug.md`:

```markdown
# Your Article Title

**Opening hook with scene or data...**

---

## Section 1

Content here...
```

### 2. Add to API
Update `/lib/api.ts` with article metadata:

```typescript
{
  slug: 'your-article-slug',
  title: 'Your Article Title',
  excerpt: 'Compelling 1-2 sentence description...',
  category: 'immigration' | 'business' | 'tax-legal' | 'property' | 'ai',
  image: '/instagram/your_cover.jpg',
  publishedAt: '2025-10-26',
  readTime: 12, // minutes
  author: 'Bali Zero [Team Name]',
  featured: true, // Show on homepage
  tags: ['tag1', 'tag2', 'tag3'],
  relatedArticles: ['related-slug-1', 'related-slug-2']
}
```

### 3. Add Cover Image
Place in `/public/instagram/` (optimized JPG, ~300-400KB)

### 4. Verify Article Loads
- Development: `http://localhost:3001/article/your-article-slug`
- Check homepage: Featured articles section

---

## 🎨 Design System

**Colors**:
- Background: `#000000` (black)
- Text: `#F5F5F0` (off-white)
- Accent: `#FF0000` (red)
- Gold: `#D4AF37`

**Typography**:
- Headings: Playfair Display (serif)
- Body: Inter (sans-serif)

**Spacing**:
- Mobile: `px-4 py-16`
- Desktop: `px-8 py-24`
- Max width: `max-w-7xl`

---

## 📊 Content Strategy

**Categories**:
1. **Immigration** - Visas, KITAS, residency
2. **Business** - Company formation, licensing, compliance
3. **Tax & Legal** - Regulations, OSS 2.0, legal frameworks
4. **Property** - Real estate, development, environmental issues
5. **AI Insights** - ZANTARA-powered analysis

**Article Mix**:
- 60% investigative/accountability (government, business, environment)
- 40% practical how-to (visa guides, compliance checklists)

**SEO Focus**:
- Keywords: D12 visa, KITAS Indonesia, PT PMA, OSS 2.0, Bali property
- Target: Foreign entrepreneurs, expats, investors in Indonesia

---

## 🔗 Key Links

- **Writing Style Guide**: [WRITING_STYLE_GUIDE.md](./WRITING_STYLE_GUIDE.md)
- **Main Site**: [welcome.balizero.com](https://welcome.balizero.com)
- **Instagram**: [@balizero0](https://instagram.com/balizero0)

---

## 📈 Current Status

**Articles Published**: 5
**Total Word Count**: ~8,500 words
**Featured Articles**: 4
**Cover Images**: 5 (Instagram posts)

**Next Steps**:
- [ ] Rewrite all articles to 1,500-2,000 words (using style guide)
- [ ] Add sitemap.xml
- [ ] Integrate Google Analytics
- [ ] Create Twitter threads for each article
- [ ] Deploy to production

---

**Last Updated**: October 26, 2025
**Maintained by**: Bali Zero Editorial Team
