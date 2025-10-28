# Bali Zero Blog Website

**Live**: https://balizero.com  
**Stack**: Next.js 16.0.0 + TypeScript + Tailwind CSS  
**Status**: Production Ready ✅

---

## 🚀 Quick Deploy

```bash
# One-click deploy
./deploy.sh production

# Manual deploy
npm install
npm run build
npm start
```

**Full instructions**: See [QUICK_START.md](./QUICK_START.md)

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
│   ├── featured-articles.tsx (Puzzle Layout)
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

## 🎨 Design System

### Featured Articles Layout
The homepage features a **puzzle layout** with cards that fit together with minimal gaps (2px).

**Full specs**: See [FEATURED_ARTICLES_LAYOUT_GUIDELINES.md](./FEATURED_ARTICLES_LAYOUT_GUIDELINES.md)

**Key features**:
- CSS Grid with explicit positioning
- Microadjustments (0.2-0.5 row offsets)
- Custom font sizes per card
- Brightness effects on logos
- 6-column responsive grid

---

## 🔧 Development

### Install dependencies:
```bash
npm install
```

### Run development server:
```bash
npm run dev
# Open: http://localhost:3000
```

### Build for production:
```bash
npm run build
npm start
```

### Type checking:
```bash
npm run typecheck
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
Place in `/public/instagram/` (optimized JPG, 1080x1346px, ~300KB)

### 4. Verify Article Loads
- Development: `http://localhost:3000/article/your-article-slug`
- Check homepage: Featured articles section

---

## 🌐 Deployment

### Production Deploy
```bash
./deploy.sh production
```

### Preview Deploy
```bash
./deploy.sh preview
```

### Guides Available
- 📘 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment process
- 🌐 [DNS_CONFIGURATION_GUIDE.md](./DNS_CONFIGURATION_GUIDE.md) - Domain setup
- ⚡ [QUICK_START.md](./QUICK_START.md) - 5-minute deploy guide

---

## 📊 Current Status

**Articles Published**: 6  
**Total Word Count**: ~10,000 words  
**Featured Articles**: 5  
**Cover Images**: 6 (optimized)  
**Lighthouse Score**: 95+ (all metrics)

**Articles**:
1. Bali Floods & Overtourism (Property)
2. North Bali Airport Promises (Business)
3. D12 Visa Business Explorer (Immigration)
4. Telkom AI Campus (Business)
5. SKPL Alcohol License Guide (Business)
6. OSS 2.0 Migration Deadline (Business)

---

## 🎯 Content Strategy

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

- **Live Site**: [balizero.com](https://balizero.com)
- **Main Site**: [balizero.com](https://balizero.com)
- **Instagram**: [@balizero0](https://instagram.com/balizero0)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.0 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI + shadcn/ui
- **Markdown**: gray-matter + marked
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics
- **Fonts**: Playfair Display + Inter (Google Fonts)

---

## 📈 Performance

- **Lighthouse Performance**: 95+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic via Next.js

---

## 🧪 Testing

### Local Testing
```bash
npm run build
npm start
# Test all pages manually
```

### Production Testing
```bash
# Check live site
curl -I https://balizero.com

# Run Lighthouse audit
# DevTools → Lighthouse → Generate Report
```

---

## 🤝 Contributing

### Guidelines
1. Follow [WRITING_STYLE_GUIDE.md](./WRITING_STYLE_GUIDE.md)
2. Test locally before pushing
3. Optimize images (< 400KB)
4. Use semantic HTML
5. Keep Lighthouse score > 90

### Workflow
```bash
git checkout -b feature/new-article
# Make changes
git add .
git commit -m "Add: new article about [topic]"
git push origin feature/new-article
# Create PR for review
```

---

## 📞 Support

**Technical Issues**: See deployment guides  
**Content Questions**: See writing guide  
**Emergency**: Contact Bali Zero Dev Team

---

**Last Updated**: 2025-10-26  
**Version**: 1.0 - Production Ready  
**Maintained by**: Bali Zero Development Team
